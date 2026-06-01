import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Jogo = {
  id: number
  time_casa_id: number
  time_fora_id: number
  data_hora: string
  fase: 'grupos' | 'oitavas' | 'quartas' | 'semis' | 'terceiro_lugar' | 'final'
  gols_casa: number | null
  gols_fora: number | null
  encerrado: boolean
  time_casa?: Time
  time_fora?: Time
}

export type Time = {
  id: number
  nome: string
  codigo: string
  grupo_id: number | null
  bandeira_url: string | null
}

export type Bolao = {
  id: string
  nome: string
  descricao: string | null
  criado_em: string
}

export type Participante = {
  id: string
  bolao_id: string
  nome: string
  email: string | null
}

export type Chute = {
  id: string
  participante_id: string
  jogo_id: number
  gols_casa: number
  gols_fora: number
  criado_em: string
}
