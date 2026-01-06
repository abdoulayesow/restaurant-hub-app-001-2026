'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from './ThemeProvider'
import { LocaleProvider } from './LocaleProvider'
import { BakeryProvider } from './BakeryProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LocaleProvider>
          <BakeryProvider>{children}</BakeryProvider>
        </LocaleProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
