'use client'

import { useEffect, useState } from 'react'
import { supabase, Bolao, Participante, Jogo, Chute, formatarData } from '@/lib/supabase'

type BolaoComParticipantes = Bolao & { participantes: Participante[] }

export default function AbaBoloes() {
  const [boloes, setBoloes] = useState<BolaoComParticipantes[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)

  // Form criar bolão
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [criando, setCriando] = useState(false)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const [{ data: bs }, { data: ps }] = await Promise.all([
      supabase.from('boloes').select('*').order('criado_em', { ascending: false }),
      supabase.from('participantes').select('*'),
    ])
    const lista = (bs ?? []).map(b => ({
      ...b,
      participantes: (ps ?? []).filter(p => p.bolao_id === b.id),
    }))
    setBoloes(lista)
    setLoading(false)
  }

  async function criarBolao(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    setCriando(true)
    await supabase.from('boloes').insert({
      nome, descricao: descricao || null, valor: Number(valor) || 0,
    })
    setNome(''); setDescricao(''); setValor('')
    setMostrarForm(false)
    await carregar()
    setCriando(false)
  }

  if (loading) return <p className="text-green-200 text-sm py-8 text-center">Carregando bolões...</p>

  return (
    <div className="space-y-6">
      {/* Botão + Form criar bolão */}
      <div>
        {!mostrarForm ? (
          <button
            onClick={() => setMostrarForm(true)}
            className="bg-white text-green-900 font-semibold px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors text-sm shadow"
          >
            + Criar novo bolão
          </button>
        ) : (
          <form onSubmit={criarBolao} className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
            <h2 className="font-bold text-green-900 text-base">Novo Bolão</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="border rounded-lg px-3 py-2 text-sm col-span-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Nome do bolão *"
                value={nome}
                onChange={e => setNome(e.target.value)}
                required
              />
              <input
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Descrição (opcional)"
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Valor total (R$)"
                value={valor}
                onChange={e => setValor(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={criando}
                className="bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                {criando ? 'Criando...' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="border rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Lista de bolões */}
      {boloes.length === 0 ? (
        <div className="text-center py-16 text-green-300">
          <p className="text-4xl mb-3">🏆</p>
          <p className="text-lg font-medium">Nenhum bolão criado ainda.</p>
          <p className="text-sm">Clique em &quot;Criar novo bolão&quot; para começar.</p>
        </div>
      ) : (
        boloes.map(b => <BolaoCard key={b.id} bolao={b} onAtualizar={carregar} />)
      )}
    </div>
  )
}

function BolaoCard({ bolao, onAtualizar }: { bolao: BolaoComParticipantes; onAtualizar: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [participanteId, setParticipanteId] = useState('')
  const [jogos, setJogos] = useState<Jogo[]>([])
  const [chutes, setChutes] = useState<Chute[]>([])
  const [carregando, setCarregando] = useState(false)
  const [filtroFase, setFiltroFase] = useState<string>('grupos')

  // Form participante
  const [nomeP, setNomeP] = useState('')
  const [emailP, setEmailP] = useState('')
  const [adicionando, setAdicionando] = useState(false)

  useEffect(() => {
    if (aberto && jogos.length === 0) carregarJogos()
  }, [aberto])

  useEffect(() => {
    if (participanteId) carregarChutes()
  }, [participanteId])

  async function carregarJogos() {
    setCarregando(true)
    const { data } = await supabase
      .from('jogos')
      .select('*, time_casa:times!time_casa_id(*), time_fora:times!time_fora_id(*)')
      .order('data_hora', { ascending: true })
    setJogos((data as Jogo[]) ?? [])
    setCarregando(false)
  }

  async function carregarChutes() {
    if (!participanteId) return
    const { data } = await supabase.from('chutes').select('*').eq('participante_id', participanteId)
    setChutes(data ?? [])
  }

  async function adicionarParticipante(e: React.FormEvent) {
    e.preventDefault()
    if (!nomeP.trim()) return
    setAdicionando(true)
    await supabase.from('participantes').insert({ bolao_id: bolao.id, nome: nomeP, email: emailP || null })
    setNomeP(''); setEmailP('')
    await onAtualizar()
    setAdicionando(false)
  }

  const fases = [
    { key: 'grupos', label: 'Grupos' },
    { key: 'oitavas', label: 'Oitavas' },
    { key: 'quartas', label: 'Quartas' },
    { key: 'semis', label: 'Semis' },
    { key: 'terceiro_lugar', label: '3º Lugar' },
    { key: 'final', label: 'Final' },
  ]

  const jogosFiltrados = jogos.filter(j => j.fase === filtroFase)

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Cabeçalho do bolão */}
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900">{bolao.nome}</h2>
            {bolao.valor > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                R$ {bolao.valor.toFixed(2)}
              </span>
            )}
          </div>
          {bolao.descricao && <p className="text-gray-500 text-sm mt-0.5">{bolao.descricao}</p>}
          <p className="text-gray-400 text-xs mt-1">{bolao.participantes.length} participante{bolao.participantes.length !== 1 ? 's' : ''}</p>
        </div>
        <span className="text-gray-400 text-lg">{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <div className="border-t">
          {/* Participantes */}
          <div className="px-5 py-4 bg-gray-50 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Participantes</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {bolao.participantes.map(p => (
                <button
                  key={p.id}
                  onClick={() => setParticipanteId(p.id === participanteId ? '' : p.id)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
                    participanteId === p.id
                      ? 'bg-green-700 text-white border-green-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
                  }`}
                >
                  {p.nome}
                </button>
              ))}
            </div>
            <form onSubmit={adicionarParticipante} className="flex gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Novo participante"
                value={nomeP}
                onChange={e => setNomeP(e.target.value)}
              />
              <input
                className="flex-1 border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Email (opcional)"
                value={emailP}
                onChange={e => setEmailP(e.target.value)}
              />
              <button
                type="submit"
                disabled={adicionando || !nomeP.trim()}
                className="bg-green-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                {adicionando ? '...' : 'Adicionar'}
              </button>
            </form>
            {participanteId && (
              <p className="text-green-700 text-xs mt-2 font-medium">
                ✓ Mostrando palpites de: {bolao.participantes.find(p => p.id === participanteId)?.nome}
              </p>
            )}
          </div>

          {/* Filtro de fase */}
          <div className="px-5 pt-4 pb-2 flex gap-1.5 flex-wrap">
            {fases.map(f => (
              <button
                key={f.key}
                onClick={() => setFiltroFase(f.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filtroFase === f.key
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Jogos */}
          <div className="px-5 pb-5 space-y-2 mt-2">
            {carregando ? (
              <p className="text-gray-400 text-sm text-center py-4">Carregando jogos...</p>
            ) : jogosFiltrados.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">Nenhum jogo nesta fase.</p>
            ) : (
              jogosFiltrados.map(jogo => (
                <JogoRow
                  key={jogo.id}
                  jogo={jogo}
                  participanteId={participanteId}
                  chuteInicial={chutes.find(c => c.jogo_id === jogo.id)}
                  onChuteSalvo={carregarChutes}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function JogoRow({
  jogo,
  participanteId,
  chuteInicial,
  onChuteSalvo,
}: {
  jogo: Jogo
  participanteId: string
  chuteInicial?: Chute
  onChuteSalvo: () => void
}) {
  const [casa, setCasa] = useState(chuteInicial ? String(chuteInicial.gols_casa) : '')
  const [fora, setFora] = useState(chuteInicial ? String(chuteInicial.gols_fora) : '')
  const [sugerindo, setSugerindo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [dica, setDica] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (chuteInicial) {
      setCasa(String(chuteInicial.gols_casa))
      setFora(String(chuteInicial.gols_fora))
    }
  }, [chuteInicial])

  async function sugerir() {
    const nomeCasa = jogo.time_casa?.nome
    const nomeFora = jogo.time_fora?.nome
    if (!nomeCasa || !nomeFora) return
    setSugerindo(true)
    setDica('')
    try {
      const res = await fetch('/api/sugestao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_casa: nomeCasa, time_fora: nomeFora }),
      })
      const data = await res.json()
      if (data.gols_casa !== undefined) {
        setCasa(String(data.gols_casa))
        setFora(String(data.gols_fora))
        setDica(data.justificativa)
      }
    } finally {
      setSugerindo(false)
    }
  }

  async function salvar() {
    if (!participanteId) { setStatus('Selecione um participante acima.'); return }
    if (casa === '' || fora === '') { setStatus('Preencha o placar.'); return }
    setSalvando(true)
    const { error } = await supabase.from('chutes').upsert(
      { participante_id: participanteId, jogo_id: jogo.id, gols_casa: Number(casa), gols_fora: Number(fora) },
      { onConflict: 'participante_id,jogo_id' }
    )
    setStatus(error ? 'Erro ao salvar.' : '✓ Salvo!')
    if (!error) onChuteSalvo()
    setSalvando(false)
  }

  const temChute = chuteInicial !== undefined
  const temResultado = jogo.gols_casa !== null && jogo.gols_fora !== null

  return (
    <div className="border rounded-xl p-3 bg-white hover:border-green-300 transition-colors">
      {/* Data */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">{jogo.data_hora ? formatarData(jogo.data_hora) : 'Data a definir'}</span>
        <div className="flex items-center gap-2">
          {temChute && <span className="text-xs text-green-600 font-medium">✓ palpite enviado</span>}
          {jogo.encerrado && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Encerrado</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Time casa */}
        <span className="flex-1 text-right font-semibold text-sm text-gray-800 leading-tight">
          {jogo.time_casa?.nome ?? '?'}
          <span className="block text-xs font-normal text-gray-400">{jogo.time_casa?.codigo}</span>
        </span>

        {/* Placar resultado real */}
        {temResultado ? (
          <div className="flex items-center gap-1 px-3">
            <span className="text-lg font-bold text-green-700">{jogo.gols_casa}</span>
            <span className="text-gray-300 mx-0.5">–</span>
            <span className="text-lg font-bold text-green-700">{jogo.gols_fora}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="number" min={0} max={99}
              value={casa}
              onChange={e => setCasa(e.target.value)}
              disabled={jogo.encerrado}
              className="w-11 text-center border-2 rounded-lg py-1 text-base font-bold focus:outline-none focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="–"
            />
            <span className="text-gray-300 font-bold">x</span>
            <input
              type="number" min={0} max={99}
              value={fora}
              onChange={e => setFora(e.target.value)}
              disabled={jogo.encerrado}
              className="w-11 text-center border-2 rounded-lg py-1 text-base font-bold focus:outline-none focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="–"
            />
          </div>
        )}

        {/* Time fora */}
        <span className="flex-1 font-semibold text-sm text-gray-800 leading-tight">
          {jogo.time_fora?.nome ?? '?'}
          <span className="block text-xs font-normal text-gray-400">{jogo.time_fora?.codigo}</span>
        </span>
      </div>

      {/* Palpite salvo (vs resultado) */}
      {temChute && temResultado && (
        <div className="mt-2 text-xs text-center text-gray-500">
          Seu palpite: <strong>{chuteInicial!.gols_casa} x {chuteInicial!.gols_fora}</strong>
        </div>
      )}
      {temChute && !temResultado && (
        <div className="mt-1 text-xs text-center text-gray-400">
          Palpite atual: {chuteInicial!.gols_casa} x {chuteInicial!.gols_fora}
        </div>
      )}

      {/* Ações */}
      {!jogo.encerrado && !temResultado && (
        <div className="flex gap-2 mt-2 justify-end">
          <button
            onClick={sugerir}
            disabled={sugerindo}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50 transition-colors"
          >
            {sugerindo ? '⏳' : '🤖'} {sugerindo ? 'Consultando...' : 'Sugerir IA'}
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 disabled:opacity-40 transition-colors"
          >
            {salvando ? '...' : '💾 Salvar'}
          </button>
        </div>
      )}

      {/* Dica IA */}
      {dica && (
        <p className="mt-2 text-xs bg-purple-50 text-purple-700 rounded-lg px-3 py-2">{dica}</p>
      )}

      {/* Status */}
      {status && (
        <p className={`mt-1 text-xs text-center ${status.startsWith('✓') ? 'text-green-600' : 'text-red-500'}`}>
          {status}
        </p>
      )}
    </div>
  )
}
