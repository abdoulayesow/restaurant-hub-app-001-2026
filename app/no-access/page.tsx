'use client'

import { useSession, signOut } from 'next-auth/react'
import { AlertTriangle } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

export default function NoAccessPage() {
  const { data: session } = useSession()
  const { t } = useLocale()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-stone-950 px-4">
      <div className="text-center p-8 max-w-md">
        <div className="mb-6">
          <div className="
            w-20 h-20 mx-auto mb-4
            bg-amber-100 dark:bg-amber-900/30
            rounded-full flex items-center justify-center
          ">
            <AlertTriangle className="w-12 h-12 text-amber-600 dark:text-amber-400" />
          </div>
          <h1
            className="text-3xl font-bold text-gray-900 dark:text-stone-100 mb-3"
            style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
          >
            {t('noAccess.title')}
          </h1>
          <p className="text-gray-600 dark:text-stone-400 mb-6 leading-relaxed">
            {t('noAccess.message')}
          </p>
        </div>

        {session?.user?.email && (
          <div className="
            mb-6 p-4 rounded-xl
            bg-gray-100 dark:bg-stone-800
            border border-gray-200 dark:border-stone-700
          ">
            <p className="text-xs text-gray-500 dark:text-stone-400 mb-1">
              {t('noAccess.authenticatedAs')}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-stone-100">
              {session.user.email}
            </p>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="
            w-full px-6 py-3 rounded-xl
            bg-gray-900 dark:bg-white
            text-white dark:text-gray-900
            hover:bg-gray-800 dark:hover:bg-gray-100
            font-medium transition-all duration-200
            shadow-md hover:shadow-lg
          "
        >
          {t('noAccess.signOut')}
        </button>
      </div>
    </div>
  )
}
