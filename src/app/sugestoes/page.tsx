'use client'

import { useState } from 'react'
import Link from 'next/link'

type Sugestao = {
  time_casa: string
  time_fora: string
  gols_casa: number
  gols_fora: number
  justificativa: string
}

export default function SugestoesPage() {
  const [timeCasa, setTimeCasa] = useState('')
  const [timeFora, setTimeFora] = useState('')
  const [loading, setLoading] = useState(false)
  const [sugestao, setSugestao] = useState<Sugestao | null>(null)
  const [erro, setErro] = useState('')

  async function buscarSugestao(e: React.FormEvent) {
    e.preventDefault()
    if (!timeCasa.trim() || !timeFora.trim()) return
    setLoading(true)
    setErro('')
    setSugestao(null)

    try {
      const res = await fetch('/api/sugestao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_casa: timeCasa, time_fora: timeFora }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSugestao(data)
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao buscar sugestão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sugestões IA</h1>
          <Link href="/" className="text-green-700 hover:underline">Voltar</Link>
        </div>

        <form onSubmit={buscarSugestao} className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Pedir sugestão de placar</h2>
          <div className="flex gap-3 items-center mb-4">
            <input
              className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Time da casa (ex: Brasil)"
              value={timeCasa}
              onChange={(e) => setTimeCasa(e.target.value)}
              required
            />
            <span className="text-gray-400 font-bold">vs</span>
            <input
              className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Time visitante (ex: Argentina)"
              value={timeFora}
              onChange={(e) => setTimeFora(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white rounded-lg px-4 py-2 font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Consultando IA...' : 'Sugerir placar'}
          </button>
        </form>

        {erro && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{erro}</div>
        )}

        {sugestao && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Sugestão de placar</h3>
            <div className="flex items-center justify-center gap-6 text-4xl font-bold mb-6">
              <div className="text-center">
                <p className="text-base font-normal text-gray-500 mb-1">{sugestao.time_casa}</p>
                <span className="text-green-700">{sugestao.gols_casa}</span>
              </div>
              <span className="text-gray-300">x</span>
              <div className="text-center">
                <p className="text-base font-normal text-gray-500 mb-1">{sugestao.time_fora}</p>
                <span className="text-green-700">{sugestao.gols_fora}</span>
              </div>
            </div>
            <p className="text-gray-600 text-sm bg-gray-50 rounded-lg p-4">{sugestao.justificativa}</p>
          </div>
        )}
      </div>
    </main>
  )
}
