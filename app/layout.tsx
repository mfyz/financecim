import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { MainNav } from '@/components/main-nav'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Financecim - Personal Finance Tracker',
  description: 'Track and categorize your transactions from multiple sources',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('financecim-theme') || 'light';
                document.documentElement.classList.add(theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900`}>
        <ThemeProvider defaultTheme="light" storageKey="financecim-theme">
          <div className="min-h-screen">
            <MainNav />
            <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6">
              {children}
            </main>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: '',
              style: {
                background: '#ffffff',
                color: '#000000',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              },
              success: {
                duration: 4000,
                style: {
                  background: '#ffffff',
                  color: '#065f46',
                  border: '1px solid #10b981',
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: '#ffffff',
                  color: '#991b1b',
                  border: '1px solid #ef4444',
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}