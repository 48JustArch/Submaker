/**
 * Application Configuration
 * Centralized configuration for admin access and app settings
 */

// Admin emails - can be extended or moved to environment variables
// For production, consider using a database role column instead
export const ADMIN_EMAILS: string[] = [
    'damon66.op@gmail.com',
    // Add more admin emails here as needed
];

/**
 * Check if an email belongs to an admin
 */
export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email.toLowerCase());
}

// App limits and constants
export const APP_LIMITS = {
    MAX_DRAFTS: 3,
    MAX_AUDIO_DURATION_SECONDS: 300, // 5 minutes
    MAX_TEXT_LENGTH_TTS: 1000,
    MAX_AFFIRMATION_TEXT_LENGTH: 300,
} as const;

// Default values
export const DEFAULTS = {
    SESSION_NAME: 'Untitled Session',
    USER_PLAN: 'free',
    GENERATIONS_LIMIT: 3,
} as const;
