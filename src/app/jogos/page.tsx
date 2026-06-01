'use client'

import { useEffect, useState } from 'react'
import { supabase, Jogo } from '@/lib/supabase'
import Link from 'next/link'

export default function JogosPage() {
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('jogos')
      .select('*, time_casa:times!time_casa_id(*), time_fora:times!time_fora_id(*)')
      .order('data_hora', { ascending: true })
      .then(({ data }) => {
        setJogos((data as Jogo[]) ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Jogos</h1>
          <Link href="/" className="text-green-700 hover:underline">Voltar</Link>
        </div>

        {loading ? (
          <p className="text-gray-500">Carregando jogos...</p>
        ) : jogos.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">Nenhum jogo cadastrado ainda.</p>
            <p className="text-sm mt-2">Os jogos serão adicionados em breve.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jogos.map((jogo) => (
              <div key={jogo.id} className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <span className="font-semibold text-lg">{jogo.time_casa?.nome ?? '?'}</span>
                  <span className="text-gray-400 text-sm">vs</span>
                  <span className="font-semibold text-lg">{jogo.time_fora?.nome ?? '?'}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {jogo.data_hora ? new Date(jogo.data_hora).toLocaleString('pt-BR') : 'Data a definir'}
                  </p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{jogo.fase}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
