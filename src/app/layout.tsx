import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
