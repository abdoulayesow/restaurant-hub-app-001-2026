'use client'

import { useState, useEffect } from 'react'
import {
  Bell,
  AlertTriangle,
  DollarSign,
  CheckCircle,
  BarChart3,
  Clock,
  Languages,
  Save,
  Loader2,
  Check
} from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

interface NotificationPreference {
  lowStockAlerts: boolean
  criticalStockAlerts: boolean
  expenseAlerts: boolean
  approvalAlerts: boolean
  dailySummary: boolean
  largeExpenseThreshold: number
  preferredLocale: string
  quietHoursStart: string | null
  quietHoursEnd: string | null
}

const defaultPreferences: NotificationPreference = {
  lowStockAlerts: true,
  criticalStockAlerts: true,
  expenseAlerts: true,
  approvalAlerts: true,
  dailySummary: true,
  largeExpenseThreshold: 500000,
  preferredLocale: 'fr',
  quietHoursStart: null,
  quietHoursEnd: null,
}

export function NotificationPreferences() {
  const { t } = useLocale()
  const [preferences, setPreferences] = useState<NotificationPreference>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch preferences on mount
  useEffect(() => {
    async function fetchPreferences() {
      try {
        setLoading(true)
        const response = await fetch('/api/user/preferences')
        if (response.ok) {
          const data = await response.json()
          setPreferences(data.preferences)
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to load preferences')
        }
      } catch (err) {
        setError('Failed to load preferences')
        console.error('Error fetching preferences:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPreferences()
  }, [])

  // Save preferences
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSaved(false)

      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save preferences')
      }
    } catch (err) {
      setError('Failed to save preferences')
      console.error('Error saving preferences:', err)
    } finally {
      setSaving(false)
    }
  }

  // Toggle handler
  const handleToggle = (field: keyof NotificationPreference) => {
    setPreferences(prev => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  if (loading) {
    return (
      <div className="max-w-4xl animate-pulse space-y-6">
        <div className="h-8 bg-cream-200 dark:bg-dark-700 rounded w-1/3"></div>
        <div className="h-48 bg-cream-200 dark:bg-dark-700 rounded"></div>
        <div className="h-32 bg-cream-200 dark:bg-dark-700 rounded"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-terracotta-900 dark:text-cream-100">
          {t('settings.notificationPrefs') || 'Notification Preferences'}
        </h2>
        <p className="text-sm text-terracotta-600 dark:text-cream-300 mt-1">
          {t('settings.notificationPrefsDesc') || 'Configure how and when you receive SMS alerts'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* SMS Alerts Section */}
      <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-medium text-terracotta-900 dark:text-cream-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-terracotta-500" />
          {t('settings.smsAlerts') || 'SMS Alerts'}
        </h3>

        {/* Low Stock Alerts */}
        <ToggleRow
          icon={<AlertTriangle className="w-6 h-6 text-yellow-500" />}
          label={t('settings.lowStockAlerts') || 'Low Stock Alerts'}
          description={t('settings.lowStockAlertsDesc') || 'Receive alerts when items fall below minimum stock'}
          checked={preferences.lowStockAlerts}
          onChange={() => handleToggle('lowStockAlerts')}
        />

        {/* Critical Stock Alerts */}
        <ToggleRow
          icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
          label={t('settings.criticalStockAlerts') || 'Critical Stock Alerts'}
          description={t('settings.criticalStockAlertsDesc') || 'Receive urgent alerts for critically low or out-of-stock items'}
          checked={preferences.criticalStockAlerts}
          onChange={() => handleToggle('criticalStockAlerts')}
        />

        {/* Expense Alerts */}
        <ToggleRow
          icon={<DollarSign className="w-6 h-6 text-green-500" />}
          label={t('settings.expenseAlerts') || 'Expense Alerts'}
          description={t('settings.expenseAlertsDesc') || 'Get notified when expenses are submitted'}
          checked={preferences.expenseAlerts}
          onChange={() => handleToggle('expenseAlerts')}
        />

        {/* Approval Alerts */}
        <ToggleRow
          icon={<CheckCircle className="w-6 h-6 text-blue-500" />}
          label={t('settings.approvalAlerts') || 'Approval Alerts'}
          description={t('settings.approvalAlertsDesc') || 'Notifications for pending approvals and status changes'}
          checked={preferences.approvalAlerts}
          onChange={() => handleToggle('approvalAlerts')}
        />

        {/* Daily Summary */}
        <ToggleRow
          icon={<BarChart3 className="w-6 h-6 text-purple-500" />}
          label={t('settings.dailySummary') || 'Daily Summary'}
          description={t('settings.dailySummaryDesc') || 'Receive a daily summary of business activity'}
          checked={preferences.dailySummary}
          onChange={() => handleToggle('dailySummary')}
        />
      </div>

      {/* Large Expense Threshold */}
      <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl p-6">
        <h3 className="text-lg font-medium text-terracotta-900 dark:text-cream-100 flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-terracotta-500" />
          {t('settings.largeExpenseThreshold') || 'Large Expense Threshold'}
        </h3>
        <p className="text-sm text-terracotta-600 dark:text-cream-300 mb-4">
          {t('settings.largeExpenseThresholdDesc') || 'Alert when expenses exceed this amount (GNF)'}
        </p>
        <div className="relative max-w-xs">
          <input
            type="number"
            min="0"
            step="10000"
            value={preferences.largeExpenseThreshold}
            onChange={(e) => setPreferences(prev => ({
              ...prev,
              largeExpenseThreshold: parseFloat(e.target.value) || 0
            }))}
            className="w-full pl-4 pr-16 py-2.5 rounded-xl border border-terracotta-200 dark:border-dark-600 bg-cream-50 dark:bg-dark-700 text-terracotta-900 dark:text-cream-100 focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-terracotta-500 dark:text-cream-400 font-medium">
            GNF
          </span>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl p-6">
        <h3 className="text-lg font-medium text-terracotta-900 dark:text-cream-100 flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-terracotta-500" />
          {t('settings.quietHours') || 'Quiet Hours'}
        </h3>
        <p className="text-sm text-terracotta-600 dark:text-cream-300 mb-4">
          {t('settings.quietHoursDesc') || 'No notifications during these hours'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-1">
              {t('settings.quietHoursStart') || 'Start Time'}
            </label>
            <input
              type="time"
              value={preferences.quietHoursStart || ''}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                quietHoursStart: e.target.value || null
              }))}
              className="w-full px-4 py-2.5 rounded-xl border border-terracotta-200 dark:border-dark-600 bg-cream-50 dark:bg-dark-700 text-terracotta-900 dark:text-cream-100 focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-terracotta-700 dark:text-cream-200 mb-1">
              {t('settings.quietHoursEnd') || 'End Time'}
            </label>
            <input
              type="time"
              value={preferences.quietHoursEnd || ''}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                quietHoursEnd: e.target.value || null
              }))}
              className="w-full px-4 py-2.5 rounded-xl border border-terracotta-200 dark:border-dark-600 bg-cream-50 dark:bg-dark-700 text-terracotta-900 dark:text-cream-100 focus:ring-2 focus:ring-terracotta-500 focus:border-terracotta-500 transition-colors"
            />
          </div>
        </div>
        {(preferences.quietHoursStart || preferences.quietHoursEnd) && (
          <button
            onClick={() => setPreferences(prev => ({
              ...prev,
              quietHoursStart: null,
              quietHoursEnd: null
            }))}
            className="mt-3 text-sm text-terracotta-600 dark:text-cream-400 hover:text-terracotta-800 dark:hover:text-cream-200 transition-colors"
          >
            {t('settings.clearQuietHours') || 'Clear quiet hours'}
          </button>
        )}
      </div>

      {/* Notification Language */}
      <div className="bg-cream-100 dark:bg-dark-800 rounded-2xl p-6">
        <h3 className="text-lg font-medium text-terracotta-900 dark:text-cream-100 flex items-center gap-2 mb-4">
          <Languages className="w-5 h-5 text-terracotta-500" />
          {t('settings.notificationLanguage') || 'Notification Language'}
        </h3>
        <p className="text-sm text-terracotta-600 dark:text-cream-300 mb-4">
          {t('settings.notificationLanguageDesc') || 'Language for SMS notifications'}
        </p>
        <div className="flex gap-4">
          <label className="flex items-center gap-3 p-3 rounded-xl bg-cream-50 dark:bg-dark-700 cursor-pointer hover:bg-cream-200 dark:hover:bg-dark-600 transition-colors">
            <input
              type="radio"
              name="locale"
              value="fr"
              checked={preferences.preferredLocale === 'fr'}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                preferredLocale: e.target.value
              }))}
              className="w-4 h-4 text-terracotta-500 focus:ring-terracotta-500"
            />
            <span className="text-terracotta-900 dark:text-cream-100 font-medium">Français</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-xl bg-cream-50 dark:bg-dark-700 cursor-pointer hover:bg-cream-200 dark:hover:bg-dark-600 transition-colors">
            <input
              type="radio"
              name="locale"
              value="en"
              checked={preferences.preferredLocale === 'en'}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                preferredLocale: e.target.value
              }))}
              className="w-4 h-4 text-terracotta-500 focus:ring-terracotta-500"
            />
            <span className="text-terracotta-900 dark:text-cream-100 font-medium">English</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-terracotta-500 text-white rounded-xl hover:bg-terracotta-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('common.saving') || 'Saving...'}
            </>
          ) : saved ? (
            <>
              <Check className="w-5 h-5" />
              {t('common.saved') || 'Saved!'}
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {t('common.save') || 'Save Changes'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Toggle Row Component
interface ToggleRowProps {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onChange: () => void
}

function ToggleRow({ icon, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-cream-50 dark:bg-dark-700">
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-terracotta-900 dark:text-cream-100">
              {label}
            </label>
            <p className="text-sm text-terracotta-600 dark:text-cream-300 mt-0.5">
              {description}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={checked}
              onChange={onChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-cream-300 dark:bg-dark-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-terracotta-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-terracotta-500"></div>
          </label>
        </div>
      </div>
    </div>
  )
}
