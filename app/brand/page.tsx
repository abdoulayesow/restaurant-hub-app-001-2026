'use client'

import React, { useState } from 'react'
import {
  Logo,
  LogoWithBread,
  LogoWithCroissant,
  colorPalettes,
  PaletteName,
  ColorPalette
} from '@/components/brand/Logo'
import { Wallet, TrendingUp, TrendingDown, Percent, LayoutDashboard, ShoppingCart, Receipt, Settings, Bell, User, Sun, Moon, ChevronDown } from 'lucide-react'

export default function BrandShowcasePage() {
  const [selectedPalette, setSelectedPalette] = useState<PaletteName>('terracotta')
  const [selectedDarkMode, setSelectedDarkMode] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [selectedLightMode, setSelectedLightMode] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [selectedHeaderDark, setSelectedHeaderDark] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [selectedHeaderLight, setSelectedHeaderLight] = useState<'A' | 'B' | 'C' | 'D'>('A')

  const palettes = Object.entries(colorPalettes) as [PaletteName, ColorPalette][]

  // Mock KPI data for preview
  const mockKPIs = [
    { label: 'Balance', value: '2,450,000 GNF', icon: Wallet, color: 'gray' },
    { label: 'Revenue', value: '+850,000 GNF', icon: TrendingUp, color: 'emerald' },
    { label: 'Expenses', value: '-320,000 GNF', icon: TrendingDown, color: 'rose' },
    { label: 'Margin', value: '62%', icon: Percent, color: 'amber' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bakery Hub Brand Showcase
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Explore logo variations and color palettes
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* Color Palette Selector */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Color Palettes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {palettes.map(([key, palette]) => (
              <button
                key={key}
                onClick={() => setSelectedPalette(key)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPalette === key
                    ? 'border-gray-900 dark:border-white shadow-lg scale-105'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="text-left">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {palette.name}
                  </span>
                  <div className="flex gap-1 mt-3">
                    <div
                      className="w-8 h-8 rounded-full border border-gray-300"
                      style={{ backgroundColor: palette.primary }}
                      title="Primary"
                    />
                    <div
                      className="w-8 h-8 rounded-full border border-gray-300"
                      style={{ backgroundColor: palette.secondary }}
                      title="Secondary"
                    />
                    <div
                      className="w-8 h-8 rounded-full border border-gray-300"
                      style={{ backgroundColor: palette.accent }}
                      title="Accent"
                    />
                    <div
                      className="w-8 h-8 rounded-full border border-gray-300"
                      style={{ backgroundColor: palette.cream }}
                      title="Cream"
                    />
                    <div
                      className="w-8 h-8 rounded-full border border-gray-300"
                      style={{ backgroundColor: palette.warm }}
                      title="Warm"
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {palette.primary}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Logo Icon Variations */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Icon Styles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Wheat Icon */}
            <div className="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">
                Wheat Sheaf
              </h3>
              <div className="flex justify-center mb-4">
                <Logo variant="icon" size="xl" palette={selectedPalette} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Classic, agricultural feel
              </p>
            </div>

            {/* Bread Icon */}
            <div className="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">
                Bread Loaf
              </h3>
              <div className="flex justify-center mb-4">
                <LogoWithBread variant="icon" size="xl" palette={selectedPalette} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Warm, artisanal bakery
              </p>
            </div>

            {/* Croissant Icon */}
            <div className="text-center p-6 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">
                Croissant
              </h3>
              <div className="flex justify-center mb-4">
                <LogoWithCroissant variant="icon" size="xl" palette={selectedPalette} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                French patisserie style
              </p>
            </div>
          </div>
        </section>

        {/* Full Logo Variations */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Full Logo Variations
          </h2>

          <div className="space-y-8">
            {/* Wheat */}
            <div className="p-6 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">
                Wheat Sheaf Logo
              </h3>
              <div className="flex flex-wrap items-end gap-8">
                <div>
                  <span className="text-xs text-gray-400 block mb-2">XS</span>
                  <Logo size="xs" palette={selectedPalette} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-2">SM</span>
                  <Logo size="sm" palette={selectedPalette} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-2">MD</span>
                  <Logo size="md" palette={selectedPalette} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-2">LG</span>
                  <Logo size="lg" palette={selectedPalette} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-2">XL</span>
                  <Logo size="xl" palette={selectedPalette} />
                </div>
              </div>
            </div>

            {/* Bread */}
            <div className="p-6 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">
                Bread Loaf Logo
              </h3>
              <div className="flex flex-wrap items-end gap-8">
                <div>
                  <span className="text-xs text-gray-400 block mb-2">XS</span>
                  <LogoWithBread size="xs" palette={selectedPalette} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-2">SM</span>
                  <LogoWithBread size="sm" palette={selectedPalette} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-2">MD</span>
                  <LogoWithBread size="md" palette={selectedPalette} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-2">LG</span>
                  <LogoWithBread size="lg" palette={selectedPalette} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-2">XL</span>
                  <LogoWithBread size="xl" palette={selectedPalette} />
                </div>
              </div>
            </div>

            {/* Croissant */}
            <div className="p-6 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4">
                Croissant Logo
              </h3>
              <div className="flex flex-wrap items-end gap-8">
                <div>
                  <span className="text-xs text-gray-400 block mb-2">XS</span>
                  <LogoWithCroissant size="xs" palette={selectedPalette} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-2">SM</span>
                  <LogoWithCroissant size="sm" palette={selectedPalette} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-2">MD</span>
                  <LogoWithCroissant size="md" palette={selectedPalette} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-2">LG</span>
                  <LogoWithCroissant size="lg" palette={selectedPalette} />
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-2">XL</span>
                  <LogoWithCroissant size="xl" palette={selectedPalette} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wordmark Only */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Wordmark Only
          </h2>

          <div className="flex flex-wrap items-end gap-8 p-6 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <Logo variant="wordmark" size="xs" palette={selectedPalette} />
            <Logo variant="wordmark" size="sm" palette={selectedPalette} />
            <Logo variant="wordmark" size="md" palette={selectedPalette} />
            <Logo variant="wordmark" size="lg" palette={selectedPalette} />
            <Logo variant="wordmark" size="xl" palette={selectedPalette} />
          </div>
        </section>

        {/* Usage on Dark/Light Backgrounds */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="font-medium text-gray-700 mb-6">On Light Background</h3>
            <div className="space-y-4">
              <Logo size="lg" palette={selectedPalette} />
              <LogoWithBread size="lg" palette={selectedPalette} />
              <LogoWithCroissant size="lg" palette={selectedPalette} />
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl shadow-sm border border-gray-700 p-8">
            <h3 className="font-medium text-gray-300 mb-6">On Dark Background</h3>
            <div className="space-y-4">
              <Logo size="lg" palette={selectedPalette} />
              <LogoWithBread size="lg" palette={selectedPalette} />
              <LogoWithCroissant size="lg" palette={selectedPalette} />
            </div>
          </div>
        </section>

        {/* Color Codes Reference */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Selected Palette: {colorPalettes[selectedPalette].name}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(colorPalettes[selectedPalette])
              .filter(([key]) => key !== 'name')
              .map(([key, value]) => (
                <div key={key} className="text-center">
                  <div
                    className="w-full h-20 rounded-lg border border-gray-300 dark:border-gray-600 mb-2"
                    style={{ backgroundColor: value as string }}
                  />
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {key}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {value}
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            HEADER DARK MODE OPTIONS
            ════════════════════════════════════════════════════════════════════ */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Header Dark Mode Options
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Navigation bar styles for dark mode
          </p>

          {/* Option Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {(['A', 'B', 'C', 'D'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSelectedHeaderDark(option)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedHeaderDark === option
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Option {option}
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {option === 'A' && 'Clean Dark'}
                  {option === 'B' && 'Warm Charcoal'}
                  {option === 'C' && 'Glass Blur'}
                  {option === 'D' && 'Gradient Edge'}
                </p>
              </button>
            ))}
          </div>

          {/* Full Width Preview */}
          <div className="rounded-2xl overflow-hidden border border-gray-300 dark:border-gray-600">
            {/* Option A: Clean Dark */}
            {selectedHeaderDark === 'A' && (
              <div style={{ background: '#111827' }}>
                <header
                  style={{
                    background: '#1f2937',
                    borderBottom: '1px solid rgba(75,85,99,0.5)',
                  }}
                >
                  <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">B</span>
                        </div>
                        <span className="font-semibold text-white">Bakery Hub</span>
                      </div>
                      <nav className="hidden md:flex items-center gap-1">
                        {[
                          { icon: LayoutDashboard, label: 'Dashboard', active: true },
                          { icon: ShoppingCart, label: 'Sales' },
                          { icon: Receipt, label: 'Expenses' },
                          { icon: Settings, label: 'Settings' },
                        ].map((item, i) => (
                          <button
                            key={i}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                              item.active
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </button>
                        ))}
                      </nav>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                        <Bell className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                        <Sun className="w-5 h-5" />
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 text-white text-sm">
                        <User className="w-4 h-4" />
                        <span>Aisha</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </header>
                <div className="p-6 h-24"></div>
                <p className="text-center text-gray-500 text-sm pb-4">
                  Clean gray-800 header with subtle border
                </p>
              </div>
            )}

            {/* Option B: Warm Charcoal */}
            {selectedHeaderDark === 'B' && (
              <div style={{ background: '#1c1917' }}>
                <header
                  style={{
                    background: '#292524',
                    borderBottom: '1px solid rgba(168,162,158,0.2)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                >
                  <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">B</span>
                        </div>
                        <span className="font-semibold text-stone-100">Bakery Hub</span>
                      </div>
                      <nav className="hidden md:flex items-center gap-1">
                        {[
                          { icon: LayoutDashboard, label: 'Dashboard', active: true },
                          { icon: ShoppingCart, label: 'Sales' },
                          { icon: Receipt, label: 'Expenses' },
                          { icon: Settings, label: 'Settings' },
                        ].map((item, i) => (
                          <button
                            key={i}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                              item.active
                                ? 'bg-stone-700 text-stone-100'
                                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-700/50'
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </button>
                        ))}
                      </nav>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-700 transition-colors">
                        <Bell className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-700 transition-colors">
                        <Sun className="w-5 h-5" />
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-700 text-stone-100 text-sm">
                        <User className="w-4 h-4" />
                        <span>Aisha</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </header>
                <div className="p-6 h-24"></div>
                <p className="text-center text-stone-500 text-sm pb-4">
                  Warm stone-800 header matching dashboard
                </p>
              </div>
            )}

            {/* Option C: Glass Blur */}
            {selectedHeaderDark === 'C' && (
              <div style={{ background: '#0f172a', position: 'relative' }}>
                {/* Background pattern for glass effect */}
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59,130,246,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(168,85,247,0.15) 0%, transparent 50%)',
                }}></div>
                <header
                  style={{
                    background: 'rgba(30,41,59,0.7)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(148,163,184,0.15)',
                    position: 'relative',
                  }}
                >
                  <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">B</span>
                        </div>
                        <span className="font-semibold text-white">Bakery Hub</span>
                      </div>
                      <nav className="hidden md:flex items-center gap-1">
                        {[
                          { icon: LayoutDashboard, label: 'Dashboard', active: true },
                          { icon: ShoppingCart, label: 'Sales' },
                          { icon: Receipt, label: 'Expenses' },
                          { icon: Settings, label: 'Settings' },
                        ].map((item, i) => (
                          <button
                            key={i}
                            style={{
                              background: item.active ? 'rgba(148,163,184,0.15)' : 'transparent',
                              backdropFilter: item.active ? 'blur(8px)' : 'none',
                            }}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                              item.active
                                ? 'text-white'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </button>
                        ))}
                      </nav>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/30 transition-colors">
                        <Bell className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/30 transition-colors">
                        <Sun className="w-5 h-5" />
                      </button>
                      <button
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm"
                        style={{
                          background: 'rgba(148,163,184,0.15)',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <User className="w-4 h-4" />
                        <span>Aisha</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </header>
                <div className="p-6 h-24"></div>
                <p className="text-center text-slate-500 text-sm pb-4">
                  Glass morphism with backdrop blur
                </p>
              </div>
            )}

            {/* Option D: Gradient Edge */}
            {selectedHeaderDark === 'D' && (
              <div style={{ background: '#111827' }}>
                <header
                  style={{
                    background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
                    borderBottom: '1px solid transparent',
                    backgroundClip: 'padding-box',
                    position: 'relative',
                  }}
                >
                  {/* Gradient border bottom */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.5) 50%, transparent 100%)',
                    }}
                  ></div>
                  <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                          <span className="text-white font-bold text-sm">B</span>
                        </div>
                        <span className="font-semibold text-white">Bakery Hub</span>
                      </div>
                      <nav className="hidden md:flex items-center gap-1">
                        {[
                          { icon: LayoutDashboard, label: 'Dashboard', active: true },
                          { icon: ShoppingCart, label: 'Sales' },
                          { icon: Receipt, label: 'Expenses' },
                          { icon: Settings, label: 'Settings' },
                        ].map((item, i) => (
                          <button
                            key={i}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                              item.active
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </button>
                        ))}
                      </nav>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="p-2 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                        <Bell className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                        <Sun className="w-5 h-5" />
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm hover:border-amber-500/50 transition-colors">
                        <User className="w-4 h-4" />
                        <span>Aisha</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </header>
                <div className="p-6 h-24"></div>
                <p className="text-center text-gray-500 text-sm pb-4">
                  Gradient with amber accent border
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            HEADER LIGHT MODE OPTIONS
            ════════════════════════════════════════════════════════════════════ */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Header Light Mode Options
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Navigation bar styles for light mode
          </p>

          {/* Option Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {(['A', 'B', 'C', 'D'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSelectedHeaderLight(option)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedHeaderLight === option
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Option {option}
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {option === 'A' && 'Clean White'}
                  {option === 'B' && 'Soft Gray'}
                  {option === 'C' && 'Cream Tint'}
                  {option === 'D' && 'Elevated Shadow'}
                </p>
              </button>
            ))}
          </div>

          {/* Full Width Preview */}
          <div className="rounded-2xl overflow-hidden border border-gray-300 dark:border-gray-600">
            {/* Option A: Clean White */}
            {selectedHeaderLight === 'A' && (
              <div style={{ background: '#f9fafb' }}>
                <header
                  style={{
                    background: '#ffffff',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">B</span>
                        </div>
                        <span className="font-semibold text-gray-900">Bakery Hub</span>
                      </div>
                      <nav className="hidden md:flex items-center gap-1">
                        {[
                          { icon: LayoutDashboard, label: 'Dashboard', active: true },
                          { icon: ShoppingCart, label: 'Sales' },
                          { icon: Receipt, label: 'Expenses' },
                          { icon: Settings, label: 'Settings' },
                        ].map((item, i) => (
                          <button
                            key={i}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                              item.active
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </button>
                        ))}
                      </nav>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                        <Bell className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                        <Moon className="w-5 h-5" />
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-900 text-sm hover:bg-gray-200 transition-colors">
                        <User className="w-4 h-4" />
                        <span>Aisha</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </header>
                <div className="p-6 h-24"></div>
                <p className="text-center text-gray-400 text-sm pb-4">
                  Pure white header with gray border
                </p>
              </div>
            )}

            {/* Option B: Soft Gray */}
            {selectedHeaderLight === 'B' && (
              <div style={{ background: '#f9fafb' }}>
                <header
                  style={{
                    background: '#f3f4f6',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">B</span>
                        </div>
                        <span className="font-semibold text-gray-900">Bakery Hub</span>
                      </div>
                      <nav className="hidden md:flex items-center gap-1">
                        {[
                          { icon: LayoutDashboard, label: 'Dashboard', active: true },
                          { icon: ShoppingCart, label: 'Sales' },
                          { icon: Receipt, label: 'Expenses' },
                          { icon: Settings, label: 'Settings' },
                        ].map((item, i) => (
                          <button
                            key={i}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                              item.active
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </button>
                        ))}
                      </nav>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors">
                        <Bell className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors">
                        <Moon className="w-5 h-5" />
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white text-gray-900 text-sm shadow-sm hover:shadow transition-shadow">
                        <User className="w-4 h-4" />
                        <span>Aisha</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </header>
                <div className="p-6 h-24"></div>
                <p className="text-center text-gray-400 text-sm pb-4">
                  Soft gray header with white active states
                </p>
              </div>
            )}

            {/* Option C: Cream Tint */}
            {selectedHeaderLight === 'C' && (
              <div style={{ background: 'linear-gradient(180deg, #fef7ed 0%, #fdf4e7 100%)' }}>
                <header
                  style={{
                    background: 'rgba(255,255,255,0.85)',
                    borderBottom: '1px solid rgba(217,119,6,0.15)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">B</span>
                        </div>
                        <span className="font-semibold text-amber-900">Bakery Hub</span>
                      </div>
                      <nav className="hidden md:flex items-center gap-1">
                        {[
                          { icon: LayoutDashboard, label: 'Dashboard', active: true },
                          { icon: ShoppingCart, label: 'Sales' },
                          { icon: Receipt, label: 'Expenses' },
                          { icon: Settings, label: 'Settings' },
                        ].map((item, i) => (
                          <button
                            key={i}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                              item.active
                                ? 'bg-amber-100 text-amber-900'
                                : 'text-amber-800/60 hover:text-amber-900 hover:bg-amber-50'
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </button>
                        ))}
                      </nav>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="p-2 rounded-lg text-amber-700/60 hover:text-amber-900 hover:bg-amber-100 transition-colors">
                        <Bell className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-lg text-amber-700/60 hover:text-amber-900 hover:bg-amber-100 transition-colors">
                        <Moon className="w-5 h-5" />
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100 text-amber-900 text-sm hover:bg-amber-200 transition-colors">
                        <User className="w-4 h-4" />
                        <span>Aisha</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </header>
                <div className="p-6 h-24"></div>
                <p className="text-center text-amber-600/60 text-sm pb-4">
                  Warm cream header matching bakery theme
                </p>
              </div>
            )}

            {/* Option D: Elevated Shadow */}
            {selectedHeaderLight === 'D' && (
              <div style={{ background: '#f9fafb' }}>
                <header
                  style={{
                    background: '#ffffff',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    borderBottom: 'none',
                  }}
                >
                  <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
                          }}
                        >
                          <span className="text-white font-bold text-sm">B</span>
                        </div>
                        <span className="font-semibold text-gray-900">Bakery Hub</span>
                      </div>
                      <nav className="hidden md:flex items-center gap-1">
                        {[
                          { icon: LayoutDashboard, label: 'Dashboard', active: true },
                          { icon: ShoppingCart, label: 'Sales' },
                          { icon: Receipt, label: 'Expenses' },
                          { icon: Settings, label: 'Settings' },
                        ].map((item, i) => (
                          <button
                            key={i}
                            style={item.active ? {
                              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                              boxShadow: '0 2px 8px rgba(245,158,11,0.15)',
                            } : {}}
                            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                              item.active
                                ? 'text-amber-900'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </button>
                        ))}
                      </nav>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                        <Bell className="w-5 h-5" />
                      </button>
                      <button className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                        <Moon className="w-5 h-5" />
                      </button>
                      <button
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-900 text-sm transition-shadow hover:shadow-md"
                        style={{
                          background: '#ffffff',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <User className="w-4 h-4" />
                        <span>Aisha</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </header>
                <div className="p-6 h-24"></div>
                <p className="text-center text-gray-400 text-sm pb-4">
                  Floating header with elevated shadow
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            DARK MODE OPTIONS PREVIEW
            ════════════════════════════════════════════════════════════════════ */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Dashboard Dark Mode Options
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Click on each option to see the full preview below
          </p>

          {/* Option Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {(['A', 'B', 'C', 'D'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSelectedDarkMode(option)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedDarkMode === option
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Option {option}
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {option === 'A' && 'Subtle Gradient'}
                  {option === 'B' && 'Warm Charcoal'}
                  {option === 'C' && 'Elevated Cards'}
                  {option === 'D' && 'Accent Glow'}
                </p>
              </button>
            ))}
          </div>

          {/* Full Width Preview */}
          <div className="rounded-2xl overflow-hidden border border-gray-300 dark:border-gray-600">
            {/* Option A: Subtle Gradient */}
            {selectedDarkMode === 'A' && (
              <div
                className="p-8"
                style={{
                  background: 'linear-gradient(180deg, #111827 0%, #0a0f1a 50%, #030712 100%)',
                }}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-1">Dashboard</h3>
                  <p className="text-gray-400">Bliss Patisserie • Conakry</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockKPIs.map((kpi, i) => {
                    const Icon = kpi.icon
                    return (
                      <div
                        key={i}
                        className="rounded-xl p-5 border"
                        style={{
                          background: 'linear-gradient(145deg, rgba(31,41,55,0.8) 0%, rgba(17,24,39,0.9) 100%)',
                          borderColor: 'rgba(75,85,99,0.4)',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${
                            kpi.color === 'emerald' ? 'bg-emerald-900/40' :
                            kpi.color === 'rose' ? 'bg-rose-900/40' :
                            kpi.color === 'amber' ? 'bg-amber-900/40' : 'bg-gray-700/50'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              kpi.color === 'emerald' ? 'text-emerald-400' :
                              kpi.color === 'rose' ? 'text-rose-400' :
                              kpi.color === 'amber' ? 'text-amber-400' : 'text-gray-300'
                            }`} />
                          </div>
                          <span className="text-sm text-gray-400">{kpi.label}</span>
                        </div>
                        <p className="text-xl font-bold text-white">{kpi.value}</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-center text-gray-500 text-sm mt-6">
                  Gradient from gray-900 → gray-950 with depth shadows
                </p>
              </div>
            )}

            {/* Option B: Warm Charcoal */}
            {selectedDarkMode === 'B' && (
              <div
                className="p-8"
                style={{
                  background: '#1c1917', // stone-900
                }}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-stone-100 mb-1">Dashboard</h3>
                  <p className="text-stone-400">Bliss Patisserie • Conakry</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockKPIs.map((kpi, i) => {
                    const Icon = kpi.icon
                    return (
                      <div
                        key={i}
                        className="rounded-xl p-5"
                        style={{
                          background: '#292524', // stone-800
                          border: '1px solid rgba(168,162,158,0.2)', // stone-400
                          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${
                            kpi.color === 'emerald' ? 'bg-emerald-900/50' :
                            kpi.color === 'rose' ? 'bg-rose-900/50' :
                            kpi.color === 'amber' ? 'bg-amber-900/50' : 'bg-stone-700'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              kpi.color === 'emerald' ? 'text-emerald-400' :
                              kpi.color === 'rose' ? 'text-rose-400' :
                              kpi.color === 'amber' ? 'text-amber-400' : 'text-stone-300'
                            }`} />
                          </div>
                          <span className="text-sm text-stone-400">{kpi.label}</span>
                        </div>
                        <p className="text-xl font-bold text-stone-100">{kpi.value}</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-center text-stone-500 text-sm mt-6">
                  Warm stone palette for a cozy, bakery feel
                </p>
              </div>
            )}

            {/* Option C: Elevated Cards (Glass) */}
            {selectedDarkMode === 'C' && (
              <div
                className="p-8"
                style={{
                  background: '#0f172a', // slate-900
                }}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-1">Dashboard</h3>
                  <p className="text-slate-400">Bliss Patisserie • Conakry</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockKPIs.map((kpi, i) => {
                    const Icon = kpi.icon
                    return (
                      <div
                        key={i}
                        className="rounded-xl p-5"
                        style={{
                          background: 'rgba(30,41,59,0.7)', // slate-800 with transparency
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(148,163,184,0.15)', // slate-400
                          boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg backdrop-blur-sm ${
                            kpi.color === 'emerald' ? 'bg-emerald-500/20' :
                            kpi.color === 'rose' ? 'bg-rose-500/20' :
                            kpi.color === 'amber' ? 'bg-amber-500/20' : 'bg-slate-500/20'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              kpi.color === 'emerald' ? 'text-emerald-400' :
                              kpi.color === 'rose' ? 'text-rose-400' :
                              kpi.color === 'amber' ? 'text-amber-400' : 'text-slate-300'
                            }`} />
                          </div>
                          <span className="text-sm text-slate-400">{kpi.label}</span>
                        </div>
                        <p className="text-xl font-bold text-white">{kpi.value}</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-center text-slate-500 text-sm mt-6">
                  Glass morphism with backdrop blur and elevated shadows
                </p>
              </div>
            )}

            {/* Option D: Accent Glow */}
            {selectedDarkMode === 'D' && (
              <div
                className="p-8"
                style={{
                  background: '#111827', // gray-900
                }}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-1">Dashboard</h3>
                  <p className="text-gray-400">Bliss Patisserie • Conakry</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockKPIs.map((kpi, i) => {
                    const Icon = kpi.icon
                    const glowColor = kpi.color === 'emerald' ? 'rgba(16,185,129,0.15)' :
                                     kpi.color === 'rose' ? 'rgba(244,63,94,0.15)' :
                                     kpi.color === 'amber' ? 'rgba(245,158,11,0.2)' : 'rgba(196,92,38,0.15)'
                    return (
                      <div
                        key={i}
                        className="rounded-xl p-5 transition-all hover:scale-[1.02]"
                        style={{
                          background: '#1f2937', // gray-800
                          border: '1px solid rgba(75,85,99,0.5)',
                          boxShadow: `0 4px 20px ${glowColor}, 0 0 0 1px rgba(75,85,99,0.3)`,
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              background: kpi.color === 'emerald' ? 'rgba(16,185,129,0.15)' :
                                         kpi.color === 'rose' ? 'rgba(244,63,94,0.15)' :
                                         kpi.color === 'amber' ? 'rgba(245,158,11,0.15)' : 'rgba(156,163,175,0.15)',
                              boxShadow: `0 0 20px ${glowColor}`,
                            }}
                          >
                            <Icon className={`w-5 h-5 ${
                              kpi.color === 'emerald' ? 'text-emerald-400' :
                              kpi.color === 'rose' ? 'text-rose-400' :
                              kpi.color === 'amber' ? 'text-amber-400' : 'text-gray-300'
                            }`} />
                          </div>
                          <span className="text-sm text-gray-400">{kpi.label}</span>
                        </div>
                        <p className="text-xl font-bold text-white">{kpi.value}</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-center text-gray-500 text-sm mt-6">
                  Subtle colored glow effects matching each KPI type
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            LIGHT MODE OPTIONS PREVIEW
            ════════════════════════════════════════════════════════════════════ */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Dashboard Light Mode Options
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Click on each option to see the full preview below
          </p>

          {/* Option Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {(['A', 'B', 'C', 'D'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSelectedLightMode(option)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedLightMode === option
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  Option {option}
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {option === 'A' && 'Clean White'}
                  {option === 'B' && 'Warm Cream'}
                  {option === 'C' && 'Soft Blue'}
                  {option === 'D' && 'Warm Sand'}
                </p>
              </button>
            ))}
          </div>

          {/* Full Width Preview */}
          <div className="rounded-2xl overflow-hidden border border-gray-300 dark:border-gray-600">
            {/* Option A: Clean White */}
            {selectedLightMode === 'A' && (
              <div
                className="p-8"
                style={{
                  background: '#f9fafb', // gray-50
                }}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h3>
                  <p className="text-gray-500">Bliss Patisserie • Conakry</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockKPIs.map((kpi, i) => {
                    const Icon = kpi.icon
                    return (
                      <div
                        key={i}
                        className="rounded-xl p-5"
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e5e7eb', // gray-200
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${
                            kpi.color === 'emerald' ? 'bg-emerald-50' :
                            kpi.color === 'rose' ? 'bg-rose-50' :
                            kpi.color === 'amber' ? 'bg-amber-50' : 'bg-gray-100'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              kpi.color === 'emerald' ? 'text-emerald-600' :
                              kpi.color === 'rose' ? 'text-rose-600' :
                              kpi.color === 'amber' ? 'text-amber-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <span className="text-sm text-gray-500">{kpi.label}</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-center text-gray-400 text-sm mt-6">
                  Minimal gray-50 background with clean white cards
                </p>
              </div>
            )}

            {/* Option B: Warm Cream */}
            {selectedLightMode === 'B' && (
              <div
                className="p-8"
                style={{
                  background: 'linear-gradient(180deg, #fef7ed 0%, #fdf4e7 100%)', // warm cream
                }}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-amber-900 mb-1">Dashboard</h3>
                  <p className="text-amber-700/60">Bliss Patisserie • Conakry</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockKPIs.map((kpi, i) => {
                    const Icon = kpi.icon
                    return (
                      <div
                        key={i}
                        className="rounded-xl p-5"
                        style={{
                          background: 'rgba(255,255,255,0.8)',
                          border: '1px solid rgba(217,119,6,0.15)', // amber-600
                          boxShadow: '0 2px 8px rgba(217,119,6,0.08)',
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div style={{
                            background: kpi.color === 'emerald' ? '#d1fae5' :
                                        kpi.color === 'rose' ? '#ffe4e6' :
                                        kpi.color === 'amber' ? '#fef3c7' : '#fef3c7',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                          }}>
                            <Icon className={`w-5 h-5 ${
                              kpi.color === 'emerald' ? 'text-emerald-700' :
                              kpi.color === 'rose' ? 'text-rose-700' :
                              kpi.color === 'amber' ? 'text-amber-700' : 'text-amber-700'
                            }`} />
                          </div>
                          <span className="text-sm text-amber-800/70">{kpi.label}</span>
                        </div>
                        <p className="text-xl font-bold text-amber-900">{kpi.value}</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-center text-amber-600/60 text-sm mt-6">
                  Warm cream gradient with amber accents for a bakery feel
                </p>
              </div>
            )}

            {/* Option C: Soft Blue */}
            {selectedLightMode === 'C' && (
              <div
                className="p-8"
                style={{
                  background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)', // sky-50 to sky-100
                }}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-800 mb-1">Dashboard</h3>
                  <p className="text-slate-500">Bliss Patisserie • Conakry</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockKPIs.map((kpi, i) => {
                    const Icon = kpi.icon
                    return (
                      <div
                        key={i}
                        className="rounded-xl p-5"
                        style={{
                          background: 'rgba(255,255,255,0.9)',
                          border: '1px solid rgba(14,165,233,0.15)', // sky-500
                          boxShadow: '0 4px 12px rgba(14,165,233,0.08), 0 1px 2px rgba(0,0,0,0.04)',
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2 rounded-lg ${
                            kpi.color === 'emerald' ? 'bg-emerald-100' :
                            kpi.color === 'rose' ? 'bg-rose-100' :
                            kpi.color === 'amber' ? 'bg-amber-100' : 'bg-sky-100'
                          }`}>
                            <Icon className={`w-5 h-5 ${
                              kpi.color === 'emerald' ? 'text-emerald-600' :
                              kpi.color === 'rose' ? 'text-rose-600' :
                              kpi.color === 'amber' ? 'text-amber-600' : 'text-sky-600'
                            }`} />
                          </div>
                          <span className="text-sm text-slate-500">{kpi.label}</span>
                        </div>
                        <p className="text-xl font-bold text-slate-800">{kpi.value}</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-center text-sky-600/60 text-sm mt-6">
                  Soft sky-blue gradient for a professional, airy look
                </p>
              </div>
            )}

            {/* Option D: Warm Sand */}
            {selectedLightMode === 'D' && (
              <div
                className="p-8"
                style={{
                  background: '#fafaf9', // stone-50
                }}
              >
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-stone-800 mb-1">Dashboard</h3>
                  <p className="text-stone-500">Bliss Patisserie • Conakry</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {mockKPIs.map((kpi, i) => {
                    const Icon = kpi.icon
                    const borderColor = kpi.color === 'emerald' ? 'rgba(16,185,129,0.2)' :
                                       kpi.color === 'rose' ? 'rgba(244,63,94,0.2)' :
                                       kpi.color === 'amber' ? 'rgba(245,158,11,0.25)' : 'rgba(168,162,158,0.3)'
                    return (
                      <div
                        key={i}
                        className="rounded-xl p-5 transition-all hover:shadow-md"
                        style={{
                          background: '#ffffff',
                          border: `1px solid ${borderColor}`,
                          boxShadow: '0 2px 4px rgba(120,113,108,0.06)',
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div style={{
                            background: kpi.color === 'emerald' ? 'rgba(16,185,129,0.1)' :
                                        kpi.color === 'rose' ? 'rgba(244,63,94,0.1)' :
                                        kpi.color === 'amber' ? 'rgba(245,158,11,0.12)' : 'rgba(168,162,158,0.15)',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                          }}>
                            <Icon className={`w-5 h-5 ${
                              kpi.color === 'emerald' ? 'text-emerald-600' :
                              kpi.color === 'rose' ? 'text-rose-600' :
                              kpi.color === 'amber' ? 'text-amber-600' : 'text-stone-500'
                            }`} />
                          </div>
                          <span className="text-sm text-stone-500">{kpi.label}</span>
                        </div>
                        <p className="text-xl font-bold text-stone-800">{kpi.value}</p>
                      </div>
                    )
                  })}
                </div>
                <p className="text-center text-stone-400 text-sm mt-6">
                  Warm stone palette with colored accents matching KPIs
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
