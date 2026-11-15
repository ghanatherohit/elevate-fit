import type { Metadata } from "next";
import { Sora, Space_Grotesk } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/layout/ThemeProvider";
import BottomNav from "@/components/layout/BottomNav";
import { OverlayLockProvider } from "@/components/shared/OverlayLock";
import {
  DEFAULT_UI_STYLE,
  UI_STYLE_IDS,
  UI_STYLE_STORAGE_KEY,
} from "@/lib/theme/styles";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ElevateFit",
  description: "Premium lifestyle and fitness companion.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icons/icon.svg", type: "image/svg+xml" }],
    apple: "/icons/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#0b0d13",
};

const themeBootScript = `(function(){try{var k=${JSON.stringify(
  UI_STYLE_STORAGE_KEY,
)};var ids=${JSON.stringify([...UI_STYLE_IDS])};var fallback=${JSON.stringify(
  DEFAULT_UI_STYLE,
)};var t=localStorage.getItem(k);if(!t||ids.indexOf(t)<0){var legacy=localStorage.getItem("ef-theme");t=legacy==="light"?"ethereal":fallback;}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme",${JSON.stringify(
  DEFAULT_UI_STYLE,
)});} })();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="glassmorphism" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body
        className={`${sora.variable} ${spaceGrotesk.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <ThemeProvider>
          <OverlayLockProvider>
            {children}
            <BottomNav />
          </OverlayLockProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
