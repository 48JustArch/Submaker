import { createClient } from '@/lib/supabase/client'
import { isAdminEmail } from '@/lib/config'

export interface AudioGeneration {
    id: string
    created_at: string
    user_id: string
    title: string
    intention: string | null
    file_path: string | null
    duration_seconds: number | null
    status: 'draft' | 'processing' | 'completed' | 'failed'
    metadata: Record<string, unknown> | null
    audio_type: 'mp3' | 'mp4' | 'wav' | null
    audio_url: string | null
    is_closed: boolean
}

export interface UserProfile {
    id: string
    email: string
    name: string | null
    avatar_url: string | null
    plan: string
    generations_used: number
    generations_limit: number
}

// Create a new session (audio generation entry)
export async function createSession(userId: string, title: string): Promise<AudioGeneration | null> {
    const supabase = createClient()

    console.log('Creating session for user:', userId, 'with title:', title)

    const { data, error } = await supabase
        .from('audio_generations')
        .insert({
            user_id: userId,
            title,
            intention: '', // Required field - default to empty string
            status: 'draft',
            is_closed: false
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating session:', error.message, error.code, error.details, error.hint)
        return null
    }
    console.log('Session created successfully:', data.id)
    return data
}

// Get user's sessions
export async function getUserSessions(userId: string): Promise<AudioGeneration[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('audio_generations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching sessions:', error)
        return []
    }
    return data || []
}

// Get single session by ID
export async function getSessionById(sessionId: string): Promise<AudioGeneration | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('audio_generations')
        .select('*')
        .eq('id', sessionId)
        .single()

    if (error) {
        console.error('Error fetching session:', error)
        return null
    }
    return data
}

// Get user profile with generation info
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

    if (error) {
        console.error('Error fetching user profile:', error)
        return null
    }
    return data
}

// Check if user can create more sessions
// Rules:
// 1. Max 3 active drafts at a time
// 2. Free plan: Cannot exceed generations_limit for completed exports
export async function canCreateSession(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const supabase = createClient()

    // Check active drafts count
    const { count: draftCount, error: draftError } = await supabase
        .from('audio_generations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'draft')
        .eq('is_closed', false)

    if (draftError) {
        console.error('Error checking draft count:', draftError)
        return { allowed: false, reason: 'Error checking draft count' }
    }

    // Limit to 3 active drafts
    if ((draftCount || 0) >= 3) {
        return { allowed: false, reason: 'You have 3 open drafts. Finish or delete one to create new.' }
    }

    // Check generations limit for free plan
    const profile = await getUserProfile(userId)
    if (profile && profile.plan === 'free') {
        if (profile.generations_used >= profile.generations_limit) {
            return { allowed: false, reason: `You've reached your free plan limit (${profile.generations_limit} exports). Upgrade to continue.` }
        }
    }

    return { allowed: true }
}

// Ensure user profile exists (create if missing)
export async function ensureUserProfile(userId: string, email: string, name?: string, avatarUrl?: string): Promise<UserProfile | null> {
    const supabase = createClient()

    // Try to get existing profile
    const { data: existing, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

    if (existing) {
        console.log('User profile already exists:', existing.id)
        return existing
    }

    // If error is NOT "no rows", log it
    if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking user profile:', selectError)
    }

    console.log('Creating new user profile for:', userId)

    // Create profile if it doesn't exist
    const { data, error } = await supabase
        .from('users')
        .insert({
            id: userId,
            email,
            name: name || null,
            avatar_url: avatarUrl || null,
            plan: 'free',
            generations_used: 0,
            generations_limit: 3,
            created_at: new Date().toISOString()
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating user profile:', error.message, error.code, error.details)
        return null
    }
    console.log('User profile created successfully:', data.id)
    return data
}

// Update session title in database
export async function updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
        .from('audio_generations')
        .update({ title })
        .eq('id', sessionId)

    if (error) {
        console.error('Error updating session title:', error.message || JSON.stringify(error))
        return false
    }
    return true
}

// Save full session state (Metadata)
export async function updateSessionData(sessionId: string, title: string, metadata: Record<string, any>): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
        .from('audio_generations')
        .update({
            title,
            metadata,
            updated_at: new Date().toISOString() // Ensure updated_at exists or is handled by trigger
        })
        .eq('id', sessionId)

    if (error) {
        console.error('Error updating session data:', error.message || JSON.stringify(error))
        return false
    }
    return true
}

// Close session after export
export async function closeSession(sessionId: string, audioUrl: string, audioType: 'mp3' | 'mp4' | 'wav', title?: string): Promise<boolean> {
    const supabase = createClient()

    const updateData: Record<string, unknown> = {
        status: 'completed',
        is_closed: true,
        audio_url: audioUrl,
        audio_type: audioType
    }

    // Include title if provided
    if (title) {
        updateData.title = title
    }

    const { error } = await supabase
        .from('audio_generations')
        .update(updateData)
        .eq('id', sessionId)

    if (error) {
        console.error('Error closing session:', error.message || JSON.stringify(error))
        return false
    }
    return true
}

// Increment user's generation count
export async function incrementGenerationCount(userId: string): Promise<boolean> {
    const supabase = createClient()

    // First get current count
    const profile = await getUserProfile(userId)
    if (!profile) return false

    const { error } = await supabase
        .from('users')
        .update({
            generations_used: profile.generations_used + 1
        })
        .eq('id', userId)

    if (error) {
        console.error('Error incrementing generation count:', error)
        return false
    }
    return true
}

// Ban/Unban user (Admin only)
export async function toggleUserBan(userId: string, shouldBan: boolean): Promise<boolean> {
    const supabase = createClient()

    // Check if current user is admin first (extra security layer)
    const { data: { user } } = await supabase.auth.getUser()
    if (!isAdminEmail(user?.email)) {
        console.error('Unauthorized: Only admin can ban users')
        return false
    }

    const { error } = await supabase
        .from('users')
        .update({ is_banned: shouldBan })
        .eq('id', userId)

    if (error) {
        console.error('Error updating ban status:', error)
        return false
    }
    return true
}

// Delete a session
export async function deleteSession(sessionId: string): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase
        .from('audio_generations')
        .delete()
        .eq('id', sessionId)

    if (error) {
        console.error('Error deleting session:', error)
        return false
    }
    return true
}

// Reset user's generation count (Admin only)
export async function resetGenerationCount(userId: string): Promise<boolean> {
    const supabase = createClient()

    // Check if current user is admin first (extra security layer)
    const { data: { user } } = await supabase.auth.getUser()
    if (!isAdminEmail(user?.email)) {
        console.error('Unauthorized: Only admin can reset generation counts')
        return false
    }

    const { error } = await supabase
        .from('users')
        .update({ generations_used: 0 })
        .eq('id', userId)

    if (error) {
        console.error('Error resetting generation count:', error)
        return false
    }
    return true
}
