import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { ProjectProvider } from '@/contexts/project-context'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgriPlan - Planificador Agrícola',
  description: 'Sistema de planificación agrícola offline-first para pequeños agricultores',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AgriPlan',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#22c55e',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="antialiased bg-gray-50">
        <ErrorBoundary>
          <AuthProvider>
            <ProjectProvider>
              {children}
            </ProjectProvider>
          </AuthProvider>
        </ErrorBoundary>
        <Toaster position="bottom-right" richColors duration={3000} />
      </body>
    </html>
  )
}
