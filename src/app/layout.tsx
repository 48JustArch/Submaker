import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmProvider } from "@/components/ui/ConfirmModal";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole, type UserRole } from "@/lib/config";
import MaintenanceScreen from "@/components/MaintenanceScreen";
import DeviceGuard from "@/components/auth/DeviceGuard";
import { SkipLink } from "@/components/ui/Accessibility";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Submaker | Design Your Subconscious",
  description: "Harness the power of subliminal, morphic, and supraliminal scalar audio to reprogram your subconscious mind. Science meets transformation.",
  keywords: ["subliminal audio", "morphic fields", "scalar waves", "subconscious programming", "frequency healing"],
  openGraph: {
    title: "ScalarAudio | Rewrite Your Frequency",
    description: "Harness the power of subliminal, morphic, and supraliminal scalar audio to reprogram your subconscious mind.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  // 1. Check Maintenance Mode Status
  const { data: settings } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single();

  // Type-safe maintenance check
  const isMaintenanceOn = (settings?.value as { enabled?: boolean })?.enabled === true;

  // 2. Check User Access (if maintenance is on)
  let shouldBlock = false;
  if (isMaintenanceOn) {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Get user's role from database
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const isAdmin = isAdminRole(profile?.role as UserRole | null);

      if (!isAdmin) {
        shouldBlock = true;
      }
    } else {
      // No user logged in during maintenance = block
      shouldBlock = true;
    }
  }

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} font-sans antialiased`}
      >
        {/* Accessibility: Skip to main content link */}
        <SkipLink href="#main-content">Skip to main content</SkipLink>

        <ToastProvider>
          <ConfirmProvider>
            <DeviceGuard />
            {shouldBlock ? (
              <MaintenanceScreen />
            ) : (
              <main id="main-content" className="min-h-screen">
                {children}
              </main>
            )}
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
