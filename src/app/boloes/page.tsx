'use client'

import { useEffect, useState } from 'react'
import { supabase, Bolao, Participante } from '@/lib/supabase'
import Link from 'next/link'

export default function BoloesPage() {
  const [boloes, setBoloes] = useState<Bolao[]>([])
  const [participantes, setParticipantes] = useState<Record<string, Participante[]>>({})
  const [loading, setLoading] = useState(true)
  const [nomeBolao, setNomeBolao] = useState('')
  const [descricao, setDescricao] = useState('')
  const [criando, setCriando] = useState(false)
  const [nomeParticipante, setNomeParticipante] = useState<Record<string, string>>({})
  const [emailParticipante, setEmailParticipante] = useState<Record<string, string>>({})
  const [adicionando, setAdicionando] = useState<string | null>(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data: bs } = await supabase.from('boloes').select('*').order('criado_em', { ascending: false })
    setBoloes(bs ?? [])
    if (bs && bs.length > 0) {
      const { data: ps } = await supabase.from('participantes').select('*').in('bolao_id', bs.map(b => b.id))
      const mapa: Record<string, Participante[]> = {}
      for (const p of ps ?? []) {
        if (!mapa[p.bolao_id]) mapa[p.bolao_id] = []
        mapa[p.bolao_id].push(p)
      }
      setParticipantes(mapa)
    }
    setLoading(false)
  }

  async function criarBolao(e: React.FormEvent) {
    e.preventDefault()
    if (!nomeBolao.trim()) return
    setCriando(true)
    await supabase.from('boloes').insert({ nome: nomeBolao, descricao: descricao || null })
    setNomeBolao('')
    setDescricao('')
    await carregar()
    setCriando(false)
  }

  async function adicionarParticipante(bolaoId: string) {
    const nome = nomeParticipante[bolaoId]?.trim()
    if (!nome) return
    setAdicionando(bolaoId)
    await supabase.from('participantes').insert({
      bolao_id: bolaoId,
      nome,
      email: emailParticipante[bolaoId]?.trim() || null,
    })
    setNomeParticipante(prev => ({ ...prev, [bolaoId]: '' }))
    setEmailParticipante(prev => ({ ...prev, [bolaoId]: '' }))
    await carregar()
    setAdicionando(null)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bolões</h1>
          <Link href="/" className="text-green-700 hover:underline text-sm">← Voltar</Link>
        </div>

        {/* Criar bolão */}
        <form onSubmit={criarBolao} className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h2 className="text-base font-semibold mb-3 text-gray-700">Criar novo bolão</h2>
          <div className="flex flex-col gap-2">
            <input
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Nome do bolão"
              value={nomeBolao}
              onChange={e => setNomeBolao(e.target.value)}
              required
            />
            <input
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Descrição (opcional)"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
            />
            <button
              type="submit"
              disabled={criando}
              className="bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              {criando ? 'Criando...' : 'Criar Bolão'}
            </button>
          </div>
        </form>

        {/* Lista de bolões */}
        {loading ? (
          <p className="text-gray-500 text-sm">Carregando...</p>
        ) : boloes.length === 0 ? (
          <p className="text-gray-400 text-center py-8 text-sm">Nenhum bolão criado ainda.</p>
        ) : (
          <div className="space-y-4">
            {boloes.map(b => {
              const ps = participantes[b.id] ?? []
              return (
                <div key={b.id} className="bg-white rounded-xl shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{b.nome}</h3>
                      {b.descricao && <p className="text-gray-500 text-sm">{b.descricao}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {ps.length} participante{ps.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Link href="/jogos" className="text-xs text-green-700 hover:underline">
                      Ver jogos →
                    </Link>
                  </div>

                  {/* Participantes */}
                  {ps.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {ps.map(p => (
                        <span key={p.id} className="bg-green-50 text-green-800 text-xs px-2 py-1 rounded-full">
                          {p.nome}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Adicionar participante */}
                  <div className="flex gap-2 mt-2">
                    <input
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Nome do participante"
                      value={nomeParticipante[b.id] ?? ''}
                      onChange={e => setNomeParticipante(prev => ({ ...prev, [b.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && adicionarParticipante(b.id)}
                    />
                    <input
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Email (opcional)"
                      value={emailParticipante[b.id] ?? ''}
                      onChange={e => setEmailParticipante(prev => ({ ...prev, [b.id]: e.target.value }))}
                    />
                    <button
                      onClick={() => adicionarParticipante(b.id)}
                      disabled={adicionando === b.id}
                      className="bg-green-700 text-white rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {adicionando === b.id ? '...' : '+ Adicionar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
