'use client'

import { useEffect, useState } from 'react'
import { supabase, Bolao } from '@/lib/supabase'
import Link from 'next/link'

export default function BoloesPage() {
  const [boloes, setBoloes] = useState<Bolao[]>([])
  const [loading, setLoading] = useState(true)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const { data } = await supabase.from('boloes').select('*').order('criado_em', { ascending: false })
    setBoloes(data ?? [])
    setLoading(false)
  }

  async function criarBolao(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setCriando(true)
    await supabase.from('boloes').insert({ nome, descricao: descricao || null })
    setNome('')
    setDescricao('')
    await carregar()
    setCriando(false)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bolões</h1>
          <Link href="/" className="text-green-700 hover:underline">Voltar</Link>
        </div>

        <form onSubmit={criarBolao} className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Criar novo bolão</h2>
          <div className="flex flex-col gap-3">
            <input
              className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Nome do bolão"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
            <input
              className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Descrição (opcional)"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
            <button
              type="submit"
              disabled={criando}
              className="bg-green-700 text-white rounded-lg px-4 py-2 font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              {criando ? 'Criando...' : 'Criar Bolão'}
            </button>
          </div>
        </form>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : boloes.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Nenhum bolão criado ainda.</p>
        ) : (
          <div className="space-y-4">
            {boloes.map((b) => (
              <div key={b.id} className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-lg text-gray-900">{b.nome}</h3>
                {b.descricao && <p className="text-gray-500 text-sm mt-1">{b.descricao}</p>}
                <p className="text-xs text-gray-400 mt-2">
                  Criado em {new Date(b.criado_em).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
