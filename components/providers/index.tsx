'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from './ThemeProvider'
import { LocaleProvider } from './LocaleProvider'
import { BakeryProvider } from './BakeryProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={0}           // Disable automatic session polling
      refetchOnWindowFocus={false}  // Disable refetch when window gains focus
    >
      <ThemeProvider>
        <LocaleProvider>
          <BakeryProvider>{children}</BakeryProvider>
        </LocaleProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
