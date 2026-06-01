import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-700 to-green-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Bolão Copa 2026</h1>
          <p className="text-green-200 text-xl">Gerencie seus palpites da Copa do Mundo 2026</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/boloes" className="bg-white/10 hover:bg-white/20 rounded-2xl p-8 text-center transition-colors">
            <div className="text-4xl mb-4">🏆</div>
            <h2 className="text-2xl font-semibold mb-2">Bolões</h2>
            <p className="text-green-200">Crie e gerencie seus grupos de bolão</p>
          </Link>

          <Link href="/jogos" className="bg-white/10 hover:bg-white/20 rounded-2xl p-8 text-center transition-colors">
            <div className="text-4xl mb-4">⚽</div>
            <h2 className="text-2xl font-semibold mb-2">Jogos</h2>
            <p className="text-green-200">Veja todos os jogos e registre seus chutes</p>
          </Link>

          <Link href="/sugestoes" className="bg-white/10 hover:bg-white/20 rounded-2xl p-8 text-center transition-colors">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-2xl font-semibold mb-2">Sugestões IA</h2>
            <p className="text-green-200">Receba sugestões de palpites com IA</p>
          </Link>
        </div>
      </div>
    </main>
  )
}
