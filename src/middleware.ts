import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { type UserRole, isAdminRole } from '@/lib/config'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Safety Check: Redirect to setup if keys are missing
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        if (request.nextUrl.pathname === '/setup') {
            return NextResponse.next()
        }
        return NextResponse.redirect(new URL('/setup', request.url))
    }

    if (request.nextUrl.pathname === '/setup') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    // 1. IP Ban Check
    // Get IP from headers (x-forwarded-for is standard for proxies/load balancers like Vercel/Supabase)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

    if (ip !== 'unknown' && request.nextUrl.pathname !== '/banned') {
        const { data: bannedIp } = await supabase
            .from('banned_ips')
            .select('id')
            .eq('ip_address', ip)
            .single()

        if (bannedIp) {
            return NextResponse.redirect(new URL('/banned', request.url))
        }
    }

    const { data: { user } } = await supabase.auth.getUser()

    // 2. User Ban Check
    if (user && request.nextUrl.pathname !== '/banned') {
        const { data: profile } = await supabase
            .from('users')
            .select('is_banned, role')
            .eq('id', user.id)
            .single()

        if (profile?.is_banned) {
            return NextResponse.redirect(new URL('/banned', request.url))
        }

        // Store role in response headers for downstream use (optional)
        if (profile?.role) {
            response.headers.set('x-user-role', profile.role)
        }
    }

    // 3. Protect admin routes - require authentication AND admin role
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            // Not authenticated, redirect to login
            return NextResponse.redirect(new URL('/login?redirect=/admin', request.url))
        }

        // Check user role from database
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        const userRole = profile?.role as UserRole | null

        if (!isAdminRole(userRole)) {
            // User is not an admin, redirect to unauthorized page
            return NextResponse.redirect(new URL('/unauthorized', request.url))
        }
    }

    // 4. Protect studio routes - require authentication (unless in dev bypass mode)
    const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
    if (request.nextUrl.pathname.startsWith('/studio')) {
        if (!user && !devBypass) {
            return NextResponse.redirect(new URL('/login?redirect=/studio', request.url))
        }
    }

    // 5. Protect dashboard routes - require authentication
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login?redirect=/dashboard', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
