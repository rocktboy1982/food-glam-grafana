import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { Navigation } from '@/components/navigation'
import { FeatureFlagsProvider } from '@/components/feature-flags-provider'
import FeatureFlagPanel from '@/components/dev/feature-flag-panel'
import ToastClient from '@/components/ui/toast-client'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Food Glam Platform',
  description: 'An elegant, simple food platform where people can discover recipes by Approach/Region.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ...existing code...
  return (
    <html lang="en">
      <body className={inter.className}>
        <FeatureFlagsProvider>
          <ToastClient>
            <Navigation />
            {children}
            {process.env.NODE_ENV !== 'production' && <FeatureFlagPanel />}
          </ToastClient>
        </FeatureFlagsProvider>
      </body>
    </html>
  );
}
