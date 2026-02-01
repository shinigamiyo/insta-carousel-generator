import type { Metadata } from "next"
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-lcd",
})

export const metadata: Metadata = {
  title: "BOLSHAKOV_AI",
  description: "Создавайте визуальные карусели для Instagram.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className={jetbrainsMono.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
