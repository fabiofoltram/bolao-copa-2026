'use client'

import { useEffect, useState } from 'react'
import { supabase, Jogo, Bolao, Participante } from '@/lib/supabase'
import Link from 'next/link'

type JogoComTimes = Jogo & { chute?: { gols_casa: number; gols_fora: number } }

export default function JogosPage() {
  const [jogos, setJogos] = useState<JogoComTimes[]>([])
  const [boloes, setBoloes] = useState<Bolao[]>([])
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [bolaoId, setBolaoId] = useState('')
  const [participanteId, setParticipanteId] = useState('')
  const [loading, setLoading] = useState(true)
  const [sugerindo, setSugerindo] = useState<number | null>(null)
  const [salvando, setSalvando] = useState<number | null>(null)
  const [placar, setPlacar] = useState<Record<number, { casa: string; fora: string }>>({})
  const [feedback, setFeedback] = useState<Record<number, string>>({})
  const [filtroFase, setFiltroFase] = useState('grupos')

  useEffect(() => {
    Promise.all([
      supabase.from('boloes').select('*').order('criado_em', { ascending: false }),
      supabase.from('jogos')
        .select('*, time_casa:times!time_casa_id(*), time_fora:times!time_fora_id(*)')
        .order('data_hora', { ascending: true }),
    ]).then(([{ data: bs }, { data: js }]) => {
      setBoloes(bs ?? [])
      setJogos((js as JogoComTimes[]) ?? [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!bolaoId) { setParticipantes([]); setParticipanteId(''); return }
    supabase.from('participantes').select('*').eq('bolao_id', bolaoId).then(({ data }) => {
      setParticipantes(data ?? [])
      setParticipanteId('')
    })
  }, [bolaoId])

  useEffect(() => {
    if (!participanteId) return
    supabase.from('chutes').select('*').eq('participante_id', participanteId).then(({ data }) => {
      const mapa: Record<number, { casa: string; fora: string }> = {}
      for (const c of data ?? []) {
        mapa[c.jogo_id] = { casa: String(c.gols_casa), fora: String(c.gols_fora) }
      }
      setPlacar(mapa)
    })
  }, [participanteId])

  async function sugerir(jogo: JogoComTimes) {
    const nomeCasa = jogo.time_casa?.nome
    const nomeFora = jogo.time_fora?.nome
    if (!nomeCasa || !nomeFora) return
    setSugerindo(jogo.id)
    try {
      const res = await fetch('/api/sugestao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_casa: nomeCasa, time_fora: nomeFora }),
      })
      const data = await res.json()
      if (data.gols_casa !== undefined) {
        setPlacar(prev => ({ ...prev, [jogo.id]: { casa: String(data.gols_casa), fora: String(data.gols_fora) } }))
        setFeedback(prev => ({ ...prev, [jogo.id]: `IA: ${data.justificativa}` }))
      }
    } catch {
      setFeedback(prev => ({ ...prev, [jogo.id]: 'Erro ao buscar sugestão.' }))
    } finally {
      setSugerindo(null)
    }
  }

  async function salvarChute(jogo: JogoComTimes) {
    if (!participanteId) { alert('Selecione um participante primeiro.'); return }
    const p = placar[jogo.id]
    if (!p || p.casa === '' || p.fora === '') { alert('Preencha o placar.'); return }
    setSalvando(jogo.id)
    const { error } = await supabase.from('chutes').upsert({
      participante_id: participanteId,
      jogo_id: jogo.id,
      gols_casa: Number(p.casa),
      gols_fora: Number(p.fora),
    }, { onConflict: 'participante_id,jogo_id' })
    setFeedback(prev => ({ ...prev, [jogo.id]: error ? 'Erro ao salvar.' : 'Chute salvo!' }))
    setSalvando(null)
  }

  const jogosFiltrados = jogos.filter(j => j.fase === filtroFase)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Jogos</h1>
          <Link href="/" className="text-green-700 hover:underline text-sm">← Voltar</Link>
        </div>

        {/* Seleção de bolão/participante */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <select
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            value={bolaoId}
            onChange={e => setBolaoId(e.target.value)}
          >
            <option value="">Selecione um bolão</option>
            {boloes.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
          </select>
          <select
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
            value={participanteId}
            onChange={e => setParticipanteId(e.target.value)}
            disabled={!bolaoId}
          >
            <option value="">Selecione seu nome</option>
            {participantes.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          {bolaoId && participantes.length === 0 && (
            <Link href="/boloes" className="text-sm text-green-700 hover:underline self-center whitespace-nowrap">
              Adicionar participante →
            </Link>
          )}
        </div>

        {/* Filtro de fase */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['grupos', 'oitavas', 'quartas', 'semis', 'terceiro_lugar', 'final'].map(f => (
            <button
              key={f}
              onClick={() => setFiltroFase(f)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filtroFase === f ? 'bg-green-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}
            >
              {f === 'grupos' ? 'Fase de Grupos' : f === 'terceiro_lugar' ? '3º Lugar' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Lista de jogos */}
        {loading ? (
          <p className="text-gray-500">Carregando jogos...</p>
        ) : jogosFiltrados.length === 0 ? (
          <p className="text-gray-400 text-center py-16">Nenhum jogo nesta fase.</p>
        ) : (
          <div className="space-y-3">
            {jogosFiltrados.map(jogo => {
              const p = placar[jogo.id]
              const fb = feedback[jogo.id]
              const iaSugerindo = sugerindo === jogo.id
              const iaSalvando = salvando === jogo.id
              const dataFormatada = jogo.data_hora
                ? new Date(jogo.data_hora).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                : 'A definir'

              return (
                <div key={jogo.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400">{dataFormatada}</span>
                    {jogo.encerrado && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Encerrado</span>
                    )}
                  </div>

                  {/* Times e placar */}
                  <div className="flex items-center gap-3">
                    <span className="flex-1 text-right font-semibold text-gray-800">{jogo.time_casa?.nome ?? '?'}</span>

                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={99}
                        className="w-12 text-center border-2 rounded-lg py-1 text-lg font-bold focus:outline-none focus:border-green-500"
                        value={p?.casa ?? ''}
                        onChange={e => setPlacar(prev => ({ ...prev, [jogo.id]: { ...prev[jogo.id], casa: e.target.value } }))}
                        placeholder="–"
                        disabled={jogo.encerrado}
                      />
                      <span className="text-gray-400 font-bold">x</span>
                      <input
                        type="number"
                        min={0}
                        max={99}
                        className="w-12 text-center border-2 rounded-lg py-1 text-lg font-bold focus:outline-none focus:border-green-500"
                        value={p?.fora ?? ''}
                        onChange={e => setPlacar(prev => ({ ...prev, [jogo.id]: { ...prev[jogo.id], fora: e.target.value } }))}
                        placeholder="–"
                        disabled={jogo.encerrado}
                      />
                    </div>

                    <span className="flex-1 font-semibold text-gray-800">{jogo.time_fora?.nome ?? '?'}</span>
                  </div>

                  {/* Ações */}
                  {!jogo.encerrado && (
                    <div className="flex gap-2 mt-3 justify-end">
                      <button
                        onClick={() => sugerir(jogo)}
                        disabled={iaSugerindo}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50 transition-colors"
                      >
                        {iaSugerindo ? '⏳ Consultando...' : '🤖 Sugerir IA'}
                      </button>
                      <button
                        onClick={() => salvarChute(jogo)}
                        disabled={iaSalvando || !participanteId}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-40 transition-colors"
                      >
                        {iaSalvando ? 'Salvando...' : '💾 Salvar chute'}
                      </button>
                    </div>
                  )}

                  {/* Feedback */}
                  {fb && (
                    <p className={`mt-2 text-xs px-3 py-2 rounded-lg ${fb.startsWith('IA:') ? 'bg-purple-50 text-purple-700' : fb === 'Chute salvo!' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {fb}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
