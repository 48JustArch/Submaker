import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { RATE_LIMITS } from '@/lib/config';

export type RateLimitAction = keyof typeof RATE_LIMITS;

interface RateLimitResult {
    allowed: boolean;
    error?: string;
    retryAfter?: number;
}

/**
 * Check rate limit for a given action
 * Returns { allowed: true } if within limits, or { allowed: false, error, retryAfter } if blocked
 */
export async function checkRateLimit(
    request: NextRequest,
    action: RateLimitAction
): Promise<RateLimitResult> {
    const config = RATE_LIMITS[action];
    if (!config) {
        console.warn(`Unknown rate limit action: ${action}`);
        return { allowed: true };
    }

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

    // Get IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const key = `ip:${ip}:${action}`;

    // Call the Postgres rate limit function
    const { data: allowed, error } = await supabase.rpc('check_rate_limit', {
        limit_key: key,
        max_requests: config.limit,
        window_seconds: config.windowSeconds
    });

    if (error) {
        console.error('Rate limit check failed:', error);
        // Fail open (allow) if there's a database error - can change to fail closed if preferred
        return { allowed: true };
    }

    if (!allowed) {
        return {
            allowed: false,
            error: 'Too many requests. Please try again later.',
            retryAfter: config.windowSeconds
        };
    }

    return { allowed: true };
}

/**
 * Create a rate-limited API route wrapper
 * Usage: export const POST = withRateLimit('login', async (request) => { ... })
 */
export function withRateLimit(
    action: RateLimitAction,
    handler: (request: NextRequest) => Promise<NextResponse>
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        const result = await checkRateLimit(request, action);

        if (!result.allowed) {
            return NextResponse.json(
                { error: result.error },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(result.retryAfter || 60),
                        'X-RateLimit-Action': action
                    }
                }
            );
        }

        return handler(request);
    };
}

/**
 * Rate limit response helper for when you need custom handling
 */
export function rateLimitExceeded(action: RateLimitAction): NextResponse {
    const config = RATE_LIMITS[action];
    return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
            status: 429,
            headers: {
                'Retry-After': String(config?.windowSeconds || 60),
                'X-RateLimit-Action': action
            }
        }
    );
}
