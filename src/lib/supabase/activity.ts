import { createClient } from './server';

export type ActivityType =
    | 'user_signup'
    | 'user_login'
    | 'user_logout'
    | 'session_created'
    | 'session_deleted'
    | 'audio_generated'
    | 'audio_exported'
    | 'settings_updated'
    | 'admin_action';

export interface ActivityLog {
    id: string;
    user_id: string;
    activity_type: ActivityType;
    details: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
}

/**
 * Log an activity event
 */
export async function logActivity(
    userId: string,
    activityType: ActivityType,
    details: Record<string, unknown> = {},
    request?: Request
): Promise<boolean> {
    try {
        const supabase = await createClient();

        const logEntry = {
            user_id: userId,
            activity_type: activityType,
            details,
            ip_address: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
            user_agent: request?.headers.get('user-agent') || undefined,
        };

        const { error } = await supabase
            .from('activity_logs')
            .insert(logEntry);

        if (error) {
            console.error('Failed to log activity:', error);
            return false;
        }

        return true;
    } catch (e) {
        console.error('Activity logging error:', e);
        return false;
    }
}

/**
 * Get recent activity logs (admin only)
 */
export async function getRecentActivityLogs(limit: number = 50): Promise<ActivityLog[]> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('activity_logs')
            .select(`
                id,
                user_id,
                activity_type,
                details,
                ip_address,
                user_agent,
                created_at,
                users:user_id (
                    email,
                    name
                )
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Failed to fetch activity logs:', error);
            return [];
        }

        return data || [];
    } catch (e) {
        console.error('Activity fetch error:', e);
        return [];
    }
}

/**
 * Get activity logs for a specific user
 */
export async function getUserActivityLogs(userId: string, limit: number = 20): Promise<ActivityLog[]> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Failed to fetch user activity logs:', error);
            return [];
        }

        return data || [];
    } catch (e) {
        console.error('User activity fetch error:', e);
        return [];
    }
}

/**
 * Get activity statistics
 */
export async function getActivityStats(): Promise<{
    totalToday: number;
    totalThisWeek: number;
    topActivityTypes: { type: string; count: number }[];
}> {
    try {
        const supabase = await createClient();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);

        // Get today's count
        const { count: todayCount } = await supabase
            .from('activity_logs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        // Get this week's count
        const { count: weekCount } = await supabase
            .from('activity_logs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', weekAgo.toISOString());

        return {
            totalToday: todayCount || 0,
            totalThisWeek: weekCount || 0,
            topActivityTypes: [], // Would need raw SQL for grouping
        };
    } catch (e) {
        console.error('Activity stats error:', e);
        return {
            totalToday: 0,
            totalThisWeek: 0,
            topActivityTypes: [],
        };
    }
}
