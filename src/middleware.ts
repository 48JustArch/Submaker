import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

    const { data: { user } } = await supabase.auth.getUser()

    // Protect admin routes - require authentication
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            // Not authenticated, redirect to login
            return NextResponse.redirect(new URL('/login?redirect=/admin', request.url))
        }
        // TODO: Add role check when 'role' column is added to users table
        // const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
        // if (profile?.role !== 'admin') {
        //     return NextResponse.redirect(new URL('/unauthorized', request.url))
        // }
    }

    // Protect studio routes - require authentication (unless in dev bypass mode)
    // To enable dev bypass, set NEXT_PUBLIC_DEV_BYPASS_AUTH=true in .env.local
    const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
    if (request.nextUrl.pathname.startsWith('/studio')) {
        if (!user && !devBypass) {
            return NextResponse.redirect(new URL('/login?redirect=/studio', request.url))
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
