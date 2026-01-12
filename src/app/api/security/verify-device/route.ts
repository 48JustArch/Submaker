import { createClient } from '@/lib/supabase/client'; // Use client for now, or createServerClient if cookies needed
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { deviceHash } = await request.json();

    if (!deviceHash) {
        return NextResponse.json({ error: 'No device hash provided' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );

    // Check if device is banned
    const { data: bannedDevice } = await supabase
        .from('banned_devices')
        .select('id, reason')
        .eq('device_hash', deviceHash)
        .single();

    if (bannedDevice) {
        // If user is logged in, ban them too? (Optional policy)
        // For now, just return banned status
        return NextResponse.json({ banned: true, reason: bannedDevice.reason }, { status: 200 });
    }

    return NextResponse.json({ banned: false }, { status: 200 });
}
