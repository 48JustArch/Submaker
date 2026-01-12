/**
 * Application Configuration
 * Centralized configuration for app settings
 * 
 * NOTE: Admin access is now controlled via database roles (RBAC)
 * See supabase/rbac_migration.sql for the role system
 */

// User role types (must match database enum)
export type UserRole = 'user' | 'moderator' | 'admin' | 'super_admin';

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<UserRole, number> = {
    user: 0,
    moderator: 1,
    admin: 2,
    super_admin: 3
};

/**
 * Check if a role has at least the required permission level
 */
export function hasMinimumRole(userRole: UserRole | null | undefined, requiredRole: UserRole): boolean {
    if (!userRole) return false;
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if a role is admin or higher
 */
export function isAdminRole(role: UserRole | null | undefined): boolean {
    return hasMinimumRole(role, 'admin');
}

/**
 * Check if a role is super_admin
 */
export function isSuperAdminRole(role: UserRole | null | undefined): boolean {
    return role === 'super_admin';
}

/**
 * @deprecated Use database role check instead
 * Kept for backwards compatibility during migration
 * Will be removed in future version
 */
export const ADMIN_EMAILS: string[] = [
    'damon66.op@gmail.com',
];

/**
 * @deprecated Use isAdminRole(user.role) instead
 * Kept for backwards compatibility during migration
 */
export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    console.warn('DEPRECATED: isAdminEmail() is deprecated. Use database role check instead.');
    return ADMIN_EMAILS.includes(email.toLowerCase());
}

// App limits and constants
export const APP_LIMITS = {
    MAX_DRAFTS: 3,
    MAX_AUDIO_DURATION_SECONDS: 300, // 5 minutes
    MAX_TEXT_LENGTH_TTS: 1000,
    MAX_AFFIRMATION_TEXT_LENGTH: 300,
    MAX_GENERATION_TEXT_LENGTH: 1000,
} as const;

// Default values
export const DEFAULTS = {
    SESSION_NAME: 'Untitled Session',
    USER_PLAN: 'free',
    GENERATIONS_LIMIT: 3,
} as const;

// Rate limit configurations
export const RATE_LIMITS = {
    login: { limit: 5, windowSeconds: 60 },
    signup: { limit: 3, windowSeconds: 300 },
    generate: { limit: 10, windowSeconds: 60 },
    passwordReset: { limit: 3, windowSeconds: 300 },
    adminAction: { limit: 30, windowSeconds: 60 },
} as const;
