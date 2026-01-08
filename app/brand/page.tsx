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

export default function BrandShowcasePage() {
  const [selectedPalette, setSelectedPalette] = useState<PaletteName>('terracotta')

  const palettes = Object.entries(colorPalettes) as [PaletteName, ColorPalette][]

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
      </main>
    </div>
  )
}
