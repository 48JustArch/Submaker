import { createClient } from './server';

export interface StorageMetric {
    id: string;
    user_id: string;
    file_type: 'audio' | 'video' | 'image';
    file_size: number;
    file_name: string;
    session_id?: string;
    created_at: string;
}

export interface StorageSummary {
    totalBytes: number;
    totalFiles: number;
    byType: {
        audio: { bytes: number; count: number };
        video: { bytes: number; count: number };
        image: { bytes: number; count: number };
    };
}

/**
 * Track a file upload
 */
export async function trackFileUpload(
    userId: string,
    fileType: 'audio' | 'video' | 'image',
    fileSize: number,
    fileName: string,
    sessionId?: string
): Promise<boolean> {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('storage_metrics')
            .insert({
                user_id: userId,
                file_type: fileType,
                file_size: fileSize,
                file_name: fileName,
                session_id: sessionId,
            });

        if (error) {
            console.error('Failed to track file upload:', error);
            return false;
        }

        return true;
    } catch (e) {
        console.error('Storage tracking error:', e);
        return false;
    }
}

/**
 * Get storage summary for a user
 */
export async function getUserStorageSummary(userId: string): Promise<StorageSummary> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('storage_metrics')
            .select('file_type, file_size')
            .eq('user_id', userId);

        if (error || !data) {
            console.error('Failed to fetch storage metrics:', error);
            return getEmptyStorageSummary();
        }

        const summary: StorageSummary = {
            totalBytes: 0,
            totalFiles: data.length,
            byType: {
                audio: { bytes: 0, count: 0 },
                video: { bytes: 0, count: 0 },
                image: { bytes: 0, count: 0 },
            },
        };

        data.forEach(metric => {
            summary.totalBytes += metric.file_size;
            const type = metric.file_type as 'audio' | 'video' | 'image';
            if (summary.byType[type]) {
                summary.byType[type].bytes += metric.file_size;
                summary.byType[type].count += 1;
            }
        });

        return summary;
    } catch (e) {
        console.error('Storage summary error:', e);
        return getEmptyStorageSummary();
    }
}

/**
 * Get global storage statistics (admin only)
 */
export async function getGlobalStorageStats(): Promise<{
    totalBytes: number;
    totalFiles: number;
    userCount: number;
    avgBytesPerUser: number;
    topUsers: { userId: string; bytes: number; fileCount: number }[];
}> {
    try {
        const supabase = await createClient();

        // Get all metrics grouped by user
        const { data, error } = await supabase
            .from('storage_metrics')
            .select('user_id, file_size');

        if (error || !data) {
            return {
                totalBytes: 0,
                totalFiles: 0,
                userCount: 0,
                avgBytesPerUser: 0,
                topUsers: [],
            };
        }

        // Calculate stats
        const userMap = new Map<string, { bytes: number; fileCount: number }>();
        let totalBytes = 0;

        data.forEach(metric => {
            totalBytes += metric.file_size;
            const existing = userMap.get(metric.user_id) || { bytes: 0, fileCount: 0 };
            existing.bytes += metric.file_size;
            existing.fileCount += 1;
            userMap.set(metric.user_id, existing);
        });

        const topUsers = Array.from(userMap.entries())
            .map(([userId, stats]) => ({ userId, ...stats }))
            .sort((a, b) => b.bytes - a.bytes)
            .slice(0, 10);

        return {
            totalBytes,
            totalFiles: data.length,
            userCount: userMap.size,
            avgBytesPerUser: userMap.size > 0 ? totalBytes / userMap.size : 0,
            topUsers,
        };
    } catch (e) {
        console.error('Global storage stats error:', e);
        return {
            totalBytes: 0,
            totalFiles: 0,
            userCount: 0,
            avgBytesPerUser: 0,
            topUsers: [],
        };
    }
}

function getEmptyStorageSummary(): StorageSummary {
    return {
        totalBytes: 0,
        totalFiles: 0,
        byType: {
            audio: { bytes: 0, count: 0 },
            video: { bytes: 0, count: 0 },
            image: { bytes: 0, count: 0 },
        },
    };
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
