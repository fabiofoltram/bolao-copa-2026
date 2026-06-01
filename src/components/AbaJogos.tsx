'use client'

import { useEffect, useState } from 'react'
import { supabase, Jogo, faseLabel, formatarData } from '@/lib/supabase'

const FASES: Jogo['fase'][] = ['grupos', 'oitavas', 'quartas', 'semis', 'terceiro_lugar', 'final']

export default function AbaJogos() {
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroFase, setFiltroFase] = useState<Jogo['fase']>('grupos')
  const [filtroGrupo, setFiltroGrupo] = useState<string>('Todos')
  const [grupos, setGrupos] = useState<string[]>([])

  useEffect(() => {
    supabase
      .from('jogos')
      .select('*, time_casa:times!time_casa_id(*, grupo:grupos(nome)), time_fora:times!time_fora_id(*)')
      .order('data_hora', { ascending: true })
      .then(({ data }) => {
        const js = (data as Jogo[]) ?? []
        setJogos(js)
        // Extrair grupos únicos do time da casa
        const gs = [...new Set(js
          .filter(j => j.fase === 'grupos')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map(j => (j.time_casa as any)?.grupo?.nome)
          .filter(Boolean)
        )].sort()
        setGrupos(gs)
        setLoading(false)
      })
  }, [])

  const jogosFiltrados = jogos
    .filter(j => j.fase === filtroFase)
    .filter(j => {
      if (filtroFase !== 'grupos' || filtroGrupo === 'Todos') return true
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (j.time_casa as any)?.grupo?.nome === filtroGrupo
    })

  return (
    <div>
      <h2 className="text-white font-bold text-xl mb-4">Tabela de Jogos</h2>

      {/* Filtro de fase */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {FASES.map(f => (
          <button
            key={f}
            onClick={() => { setFiltroFase(f); setFiltroGrupo('Todos') }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filtroFase === f
                ? 'bg-white text-green-900'
                : 'bg-green-800 text-green-100 hover:bg-green-700'
            }`}
          >
            {faseLabel(f)}
          </button>
        ))}
      </div>

      {/* Filtro de grupo (só na fase de grupos) */}
      {filtroFase === 'grupos' && grupos.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {['Todos', ...grupos].map(g => (
            <button
              key={g}
              onClick={() => setFiltroGrupo(g)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filtroGrupo === g
                  ? 'bg-yellow-400 text-yellow-900'
                  : 'bg-green-800 text-green-200 hover:bg-green-700'
              }`}
            >
              {g === 'Todos' ? 'Todos os grupos' : `Grupo ${g}`}
            </button>
          ))}
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <p className="text-green-200 text-sm text-center py-8">Carregando jogos...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {jogosFiltrados.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Nenhum jogo encontrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-900 text-green-100">
                  <th className="px-4 py-3 text-left font-medium text-xs">Data</th>
                  <th className="px-4 py-3 text-right font-medium text-xs">Time</th>
                  <th className="px-4 py-3 text-center font-medium text-xs w-24">Placar</th>
                  <th className="px-4 py-3 text-left font-medium text-xs">Time</th>
                  <th className="px-4 py-3 text-center font-medium text-xs hidden sm:table-cell">Status</th>
                </tr>
              </thead>
              <tbody>
                {jogosFiltrados.map((jogo, i) => {
                  const temResultado = jogo.gols_casa !== null && jogo.gols_fora !== null
                  return (
                    <tr key={jogo.id} className={`border-t ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50 transition-colors`}>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {jogo.data_hora ? formatarData(jogo.data_hora) : '–'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-gray-800">{jogo.time_casa?.nome}</span>
                        <span className="text-gray-400 text-xs ml-1">({jogo.time_casa?.codigo})</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {temResultado ? (
                          <span className="font-bold text-green-700 text-base">
                            {jogo.gols_casa} – {jogo.gols_fora}
                          </span>
                        ) : (
                          <span className="text-gray-300 font-medium">vs</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-800">{jogo.time_fora?.nome}</span>
                        <span className="text-gray-400 text-xs ml-1">({jogo.time_fora?.codigo})</span>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        {jogo.encerrado ? (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Encerrado</span>
                        ) : temResultado ? (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Ao vivo</span>
                        ) : (
                          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Agendado</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
