import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/pwa";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff8f2" },
    { media: "(prefers-color-scheme: dark)", color: "#070b14" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Abdu Tunes",
    template: "%s · Abdu Tunes",
  },
  description: "MUSIC. INDIA. EVERYWHERE. Streaming de música indiana moderna.",
  applicationName: "Abdu Tunes",
  keywords: ["Abdu Tunes", "música indiana", "streaming", "YouTube MP3"],
  appleWebApp: {
    capable: true,
    title: "Abdu Tunes",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PwaRegister />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
