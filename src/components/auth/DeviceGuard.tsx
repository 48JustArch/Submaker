'use client';

import { useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { useRouter, usePathname } from 'next/navigation';

export default function DeviceGuard() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (pathname === '/banned') return;

        const checkDevice = async () => {
            try {
                // Initialize an agent at application startup.
                const fpPromise = FingerprintJS.load();
                const fp = await fpPromise;
                const result = await fp.get();
                const deviceHash = result.visitorId;

                // Check against server
                const response = await fetch('/api/security/verify-device', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deviceHash }),
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.banned) {
                        router.push('/banned');
                    }
                }
            } catch (error) {
                console.error('Device check failed:', error);
            }
        };

        checkDevice();
    }, [pathname, router]);

    return null; // This component doesn't render anything
}
