import type { Metadata } from "next"
import "./globals.css"

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
    <html lang="ru">
      <body className="bg-midnight-900 font-sans antialiased">{children}</body>
    </html>
  )
}
