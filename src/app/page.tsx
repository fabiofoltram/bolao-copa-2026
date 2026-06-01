'use client'

import { useState } from 'react'
import AbaJogos from '@/components/AbaJogos'
import AbaBoloes from '@/components/AbaBoloes'

export default function Home() {
  const [aba, setAba] = useState<'boloes' | 'jogos'>('boloes')

  return (
    <div className="min-h-screen bg-green-900 flex flex-col">
      {/* Header */}
      <header className="bg-green-950 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚽</span>
            <h1 className="text-white font-bold text-xl tracking-tight">Bolão Copa 2026</h1>
          </div>
          <nav className="flex gap-1">
            <button
              onClick={() => setAba('boloes')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                aba === 'boloes'
                  ? 'bg-white text-green-900'
                  : 'text-green-200 hover:bg-green-800'
              }`}
            >
              🏆 Bolões
            </button>
            <button
              onClick={() => setAba('jogos')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                aba === 'jogos'
                  ? 'bg-white text-green-900'
                  : 'text-green-200 hover:bg-green-800'
              }`}
            >
              📋 Tabela de Jogos
            </button>
          </nav>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {aba === 'boloes' ? <AbaBoloes /> : <AbaJogos />}
      </main>
    </div>
  )
}
