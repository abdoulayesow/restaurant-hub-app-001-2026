'use client'

import { useState } from 'react'
import { X, User, Building2, Phone, Mail, CreditCard, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useRestaurant } from '@/components/providers/RestaurantProvider'
import { colorPalettes } from '@/components/brand/Logo'

interface CustomerQuickCreateProps {
  isOpen: boolean
  onClose: () => void
}

type CustomerType = 'Individual' | 'Corporate' | 'Wholesale'

interface FormData {
  name: string
  customerType: CustomerType
  phone: string
  email: string
  company: string
  creditLimit: string
  notes: string
}

const initialFormData: FormData = {
  name: '',
  customerType: 'Individual',
  phone: '',
  email: '',
  company: '',
  creditLimit: '0',
  notes: '',
}

export function CustomerQuickCreate({ isOpen, onClose }: CustomerQuickCreateProps) {
  const { t, locale } = useLocale()
  const { currentRestaurant, currentPalette } = useRestaurant()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const accentColor = colorPalettes[currentPalette].primary

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: currentRestaurant?.id,
          name: formData.name.trim(),
          customerType: formData.customerType,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          company: formData.company.trim() || null,
          creditLimit: parseInt(formData.creditLimit) || 0,
          notes: formData.notes.trim() || null,
          isActive: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create customer')
      }

      // Success animation
      setSuccess(true)
      setTimeout(() => {
        setFormData(initialFormData)
        setSuccess(false)
        onClose()
        // Refresh the page to update customer dropdowns
        window.location.reload()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData(initialFormData)
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={handleClose}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="
            w-full max-w-2xl max-h-[90vh] overflow-y-auto
            bg-white dark:bg-dark-900
            rounded-3xl shadow-2xl
            pointer-events-auto
          "
          style={{
            animation: 'modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            border: `1px solid ${accentColor}20`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 px-8 py-6 border-b border-terracotta-200/30 dark:border-terracotta-400/20 backdrop-blur-xl"
            style={{
              background: `linear-gradient(135deg, ${accentColor}10 0%, transparent 100%)`,
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2
                  className="text-2xl font-bold text-terracotta-900 dark:text-cream-100 flex items-center gap-3"
                  style={{ fontFamily: "var(--font-poppins), 'Poppins', sans-serif" }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${accentColor}15`,
                    }}
                  >
                    <User className="w-6 h-6" style={{ color: accentColor }} strokeWidth={2.5} />
                  </div>
                  {locale === 'fr' ? 'Nouveau Client' : 'New Customer'}
                </h2>
                <p className="text-sm text-terracotta-600/70 dark:text-cream-300/70 mt-2 ml-[60px]">
                  {locale === 'fr'
                    ? 'Créer un client pour les ventes à crédit'
                    : 'Create a customer for credit sales'}
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="
                  w-10 h-10 rounded-full flex items-center justify-center
                  hover:bg-terracotta-100 dark:hover:bg-dark-800
                  transition-colors
                  disabled:opacity-50
                "
              >
                <X className="w-5 h-5 text-terracotta-600 dark:text-cream-400" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-terracotta-900 dark:text-cream-100 mb-2">
                {locale === 'fr' ? 'Nom' : 'Name'} <span style={{ color: accentColor }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-terracotta-50/50 dark:bg-dark-800
                  border-2 border-terracotta-200/40 dark:border-terracotta-400/20
                  text-terracotta-900 dark:text-cream-100
                  placeholder:text-terracotta-400/50 dark:placeholder:text-cream-400/30
                  focus:outline-none focus:border-opacity-100 transition-colors
                "
                style={{ borderColor: `${accentColor}40` }}
                placeholder={locale === 'fr' ? 'Ex: Aminata Sylla' : 'e.g., Aminata Sylla'}
              />
            </div>

            {/* Customer Type */}
            <div>
              <label className="block text-sm font-semibold text-terracotta-900 dark:text-cream-100 mb-3">
                {locale === 'fr' ? 'Type de Client' : 'Customer Type'} <span style={{ color: accentColor }}>*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['Individual', 'Corporate', 'Wholesale'] as CustomerType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateField('customerType', type)}
                    className={`
                      px-4 py-3 rounded-xl font-medium text-sm
                      transition-all duration-300
                      ${formData.customerType === type
                        ? 'text-white shadow-lg scale-105'
                        : 'bg-terracotta-50 dark:bg-dark-800 text-terracotta-700 dark:text-cream-200 hover:bg-terracotta-100 dark:hover:bg-dark-700'
                      }
                    `}
                    style={
                      formData.customerType === type
                        ? { backgroundColor: accentColor }
                        : undefined
                    }
                  >
                    {type === 'Individual' && (locale === 'fr' ? 'Individuel' : 'Individual')}
                    {type === 'Corporate' && (locale === 'fr' ? 'Entreprise' : 'Corporate')}
                    {type === 'Wholesale' && (locale === 'fr' ? 'Gros' : 'Wholesale')}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-terracotta-900 dark:text-cream-100 mb-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  {locale === 'fr' ? 'Téléphone' : 'Phone'}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="
                    w-full px-4 py-3 rounded-xl
                    bg-terracotta-50/50 dark:bg-dark-800
                    border-2 border-terracotta-200/40 dark:border-terracotta-400/20
                    text-terracotta-900 dark:text-cream-100
                    placeholder:text-terracotta-400/50 dark:placeholder:text-cream-400/30
                    focus:outline-none transition-colors
                  "
                  style={{ borderColor: `${accentColor}20` }}
                  placeholder="+224 621 00 00 00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-terracotta-900 dark:text-cream-100 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  {locale === 'fr' ? 'Email' : 'Email'}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="
                    w-full px-4 py-3 rounded-xl
                    bg-terracotta-50/50 dark:bg-dark-800
                    border-2 border-terracotta-200/40 dark:border-terracotta-400/20
                    text-terracotta-900 dark:text-cream-100
                    placeholder:text-terracotta-400/50 dark:placeholder:text-cream-400/30
                    focus:outline-none transition-colors
                  "
                  style={{ borderColor: `${accentColor}20` }}
                  placeholder="exemple@email.com"
                />
              </div>
            </div>

            {/* Company (conditional) */}
            {formData.customerType !== 'Individual' && (
              <div>
                <label className="block text-sm font-semibold text-terracotta-900 dark:text-cream-100 mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  {locale === 'fr' ? 'Entreprise' : 'Company'}
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  className="
                    w-full px-4 py-3 rounded-xl
                    bg-terracotta-50/50 dark:bg-dark-800
                    border-2 border-terracotta-200/40 dark:border-terracotta-400/20
                    text-terracotta-900 dark:text-cream-100
                    placeholder:text-terracotta-400/50 dark:placeholder:text-cream-400/30
                    focus:outline-none transition-colors
                  "
                  style={{ borderColor: `${accentColor}20` }}
                  placeholder={locale === 'fr' ? 'Nom de l\'entreprise' : 'Company name'}
                />
              </div>
            )}

            {/* Credit Limit */}
            <div>
              <label className="block text-sm font-semibold text-terracotta-900 dark:text-cream-100 mb-2">
                <CreditCard className="w-4 h-4 inline mr-1" />
                {locale === 'fr' ? 'Limite de Crédit (GNF)' : 'Credit Limit (GNF)'}
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.creditLimit}
                onChange={(e) => updateField('creditLimit', e.target.value)}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-terracotta-50/50 dark:bg-dark-800
                  border-2 border-terracotta-200/40 dark:border-terracotta-400/20
                  text-terracotta-900 dark:text-cream-100
                  placeholder:text-terracotta-400/50 dark:placeholder:text-cream-400/30
                  focus:outline-none transition-colors
                "
                style={{ borderColor: `${accentColor}20` }}
                placeholder="5000000"
              />
              <p className="text-xs text-terracotta-600/60 dark:text-cream-300/60 mt-1.5">
                {locale === 'fr'
                  ? 'Montant maximum pouvant être dû'
                  : 'Maximum amount that can be owed'}
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-terracotta-900 dark:text-cream-100 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                {locale === 'fr' ? 'Notes' : 'Notes'}
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-terracotta-50/50 dark:bg-dark-800
                  border-2 border-terracotta-200/40 dark:border-terracotta-400/20
                  text-terracotta-900 dark:text-cream-100
                  placeholder:text-terracotta-400/50 dark:placeholder:text-cream-400/30
                  focus:outline-none transition-colors
                  resize-none
                "
                style={{ borderColor: `${accentColor}20` }}
                placeholder={locale === 'fr' ? 'Notes additionnelles (optionnel)' : 'Additional notes (optional)'}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800"
                style={{ animation: 'shake 0.5s ease-out' }}
              >
                <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div
                className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800"
                style={{ animation: 'fadeIn 0.3s ease-out' }}
              >
                <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {locale === 'fr' ? 'Client créé avec succès!' : 'Customer created successfully!'}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="
                  flex-1 px-6 py-3.5 rounded-xl font-semibold
                  bg-terracotta-100 dark:bg-dark-800
                  text-terracotta-700 dark:text-cream-200
                  hover:bg-terracotta-200 dark:hover:bg-dark-700
                  transition-colors
                  disabled:opacity-50
                "
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="
                  flex-1 px-6 py-3.5 rounded-xl font-semibold
                  text-white shadow-lg
                  hover:shadow-xl hover:scale-105
                  transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                "
                style={{ backgroundColor: accentColor }}
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {locale === 'fr' ? 'Créer Client' : 'Create Customer'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }
      `}</style>
    </>
  )
}
