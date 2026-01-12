import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { action } = await request.json();

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch { }
                },
            },
        }
    );

    // Get IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const key = `ip:${ip}:${action}`;

    // Define limits based on action
    let limit = 10;
    let window = 60; // 1 minute

    if (action === 'login') {
        limit = 5; // 5 attempts per minute
        window = 60;
    } else if (action === 'signup') {
        limit = 3; // 3 signups per minute (high for single IP but allows for shared wifi)
        window = 300; // 5 minutes
    } else if (action === 'generate') {
        limit = 10;
        window = 60;
    }

    const { data: allowed, error } = await supabase.rpc('check_rate_limit', {
        limit_key: key,
        max_requests: limit,
        window_seconds: window
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
        );
    }

    return NextResponse.json({ success: true });
}
