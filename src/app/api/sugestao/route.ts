import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const { time_casa, time_fora } = await req.json()

  if (!time_casa || !time_fora) {
    return NextResponse.json({ error: 'Informe os dois times' }, { status: 400 })
  }

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Sugira um placar para o jogo entre ${time_casa} e ${time_fora} na Copa do Mundo 2026.
Responda APENAS com JSON neste formato exato, sem markdown:
{"time_casa":"${time_casa}","time_fora":"${time_fora}","gols_casa":2,"gols_fora":1,"justificativa":"breve explicação em português"}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const json = JSON.parse(text)
    return NextResponse.json(json)
  } catch {
    return NextResponse.json({ error: 'Erro ao interpretar resposta da IA' }, { status: 500 })
  }
}
