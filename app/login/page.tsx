'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { BlissLogo } from '@/components/brand/BlissLogo'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t, locale, setLocale } = useLocale()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      const role = session?.user?.role
      if (role === 'Manager') {
        router.push('/dashboard')
      } else {
        router.push('/editor')
      }
    }
  }, [session, status, router])

  const handleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await signIn('google', { callbackUrl: '/' })
      if (result?.error) {
        setError(t('auth.unauthorized'))
      }
    } catch {
      setError(t('errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-plum-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-plum-500 animate-spin" />
          <span className="bliss-elegant text-plum-600 dark:text-plum-300">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-cream dark:bg-plum-900 px-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 diagonal-stripes-bliss opacity-50" />

      {/* Floating sparkles */}
      <div className="absolute top-20 left-[15%] text-mauve-400 animate-sparkle opacity-60">
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="absolute top-32 right-[20%] text-plum-400 animate-sparkle opacity-40" style={{ animationDelay: '0.5s' }}>
        <Sparkles className="w-3 h-3" />
      </div>
      <div className="absolute bottom-32 left-[25%] text-mauve-300 animate-sparkle opacity-50" style={{ animationDelay: '1s' }}>
        <Sparkles className="w-3 h-3" />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="flex justify-center mb-6">
            <BlissLogo size="xl" variant="full" animate showTagline />
          </div>
          <p className="bliss-elegant text-lg text-plum-600 dark:text-plum-300 mt-4 italic">
            {t('auth.description')}
          </p>
        </div>

        {/* Login Card */}
        <div
          className="
            bg-cream-50/90 dark:bg-plum-800/90
            backdrop-blur-sm
            rounded-3xl
            warm-shadow-lg
            p-8
            border border-plum-200/30 dark:border-plum-600/30
            diagonal-stripes-bliss
            ornate-corners
            animate-fade-in-up
          "
          style={{ animationDelay: '0.1s' }}
        >
          <h2 className="bliss-display text-2xl font-semibold text-plum-800 dark:text-cream-100 text-center mb-2">
            {t('auth.welcome')}
          </h2>
          <p className="bliss-body text-sm text-plum-500 dark:text-plum-400 text-center mb-8">
            Sign in to manage your patisserie
          </p>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm text-center">
              <p className="font-medium">{error}</p>
              <p className="mt-1 text-xs opacity-80">{t('auth.contactAdmin')}</p>
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="
              w-full flex items-center justify-center gap-3
              px-5 py-4
              bg-cream-50 dark:bg-plum-700
              border-2 border-plum-200 dark:border-plum-500
              rounded-2xl
              hover:bg-plum-50 dark:hover:bg-plum-600
              hover:border-plum-300 dark:hover:border-plum-400
              hover:shadow-plum
              transition-all duration-300
              disabled:opacity-50 disabled:cursor-not-allowed
              group
              btn-lift
            "
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-plum-600 dark:text-cream-300" />
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="bliss-body text-plum-700 dark:text-cream-100 font-medium text-base group-hover:text-plum-800">
                  {t('auth.signInWith')} {t('auth.google')}
                </span>
              </>
            )}
          </button>

          {/* Decorative divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-plum-200 dark:via-plum-600 to-transparent" />
            <Sparkles className="w-4 h-4 text-mauve-400" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-plum-200 dark:via-plum-600 to-transparent" />
          </div>

          {/* Language Switcher */}
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setLocale('fr')}
              className={`
                px-4 py-2 bliss-body text-sm rounded-xl transition-all duration-300
                ${locale === 'fr'
                  ? 'bg-plum-700 text-cream-50 shadow-plum'
                  : 'bg-plum-50 dark:bg-plum-700/50 text-plum-600 dark:text-plum-300 hover:bg-plum-100 dark:hover:bg-plum-600/50'
                }
              `}
            >
              Français
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`
                px-4 py-2 bliss-body text-sm rounded-xl transition-all duration-300
                ${locale === 'en'
                  ? 'bg-plum-700 text-cream-50 shadow-plum'
                  : 'bg-plum-50 dark:bg-plum-700/50 text-plum-600 dark:text-plum-300 hover:bg-plum-100 dark:hover:bg-plum-600/50'
                }
              `}
            >
              English
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center bliss-body text-xs text-plum-400 dark:text-plum-500 mt-8">
          <span className="bliss-script text-base text-plum-500 dark:text-plum-400">Bliss</span>
          {' '}Patisserie © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
