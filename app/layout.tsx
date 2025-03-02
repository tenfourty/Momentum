import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { Inter, DM_Mono } from "next/font/google"
import { SettingsProvider } from "@/lib/settings-provider"

export const metadata: Metadata = {
  title: "Momentum • Screenpipe",
  description: "A pipe to analyze your screen time between different apps.",
}

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--font-dm-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <SettingsProvider>
        <body
          className={`antialiased min-h-screen bg-background ${dmMono.variable} ${inter.variable} font-mono font-light tracking-tight`}
          suppressHydrationWarning
          data-suppress-hydration-warning={true}
        >
          {children}
          <Toaster />
        </body>
      </SettingsProvider>
    </html>
  )
}
