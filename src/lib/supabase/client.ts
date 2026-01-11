import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('Supabase keys missing! Check .env.local')
        // Return a dummy client or throw specific error? Throwing is honest.
        throw new Error('Supabase environment variables missing. Please configure .env.local')
    }
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
}
