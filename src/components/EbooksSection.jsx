import { useSettings } from '../context/SettingsContext'

const PLATFORM_BADGE = {
  hotmart: { label: 'Hotmart', bg: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  kiwify: { label: 'Kiwify', bg: 'bg-green-500/15 text-green-400 border-green-500/20' },
  direto: { label: 'Venda Direta', bg: 'bg-teal-500/15 text-teal-400 border-teal-500/20' },
}

export default function EbooksSection() {
  const { ebooks } = useSettings()
  if (!ebooks?.length) return null

  return (
    <section id="ebooks" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold tracking-widest text-accent-purple uppercase mb-4">
            Conhecimento
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Nossos{' '}
            <span className="bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
              Ebooks
            </span>
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
            Conteúdo prático e direto ao ponto para impulsionar o seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ebooks.map((ebook) => {
            const badge = PLATFORM_BADGE[ebook.platform] ?? PLATFORM_BADGE.hotmart
            return (
              <div key={ebook.id}
                className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col hover:border-accent-purple/40 transition-all duration-300 group">
                {/* Cover */}
                <div className="aspect-[3/4] bg-background flex items-center justify-center overflow-hidden">
                  {ebook.cover
                    ? <img src={ebook.cover} alt={ebook.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="flex flex-col items-center gap-3 text-gray-700">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="text-xs">Sem capa</span>
                      </div>
                  }
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-5 gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-white font-bold text-base leading-snug flex-1">{ebook.title}</h3>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${badge.bg}`}>
                      {badge.label}
                    </span>
                  </div>

                  {ebook.description && (
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{ebook.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                    {ebook.price
                      ? <span className="text-white font-bold text-lg">{ebook.price}</span>
                      : <span className="text-gray-500 text-sm">Consulte o valor</span>
                    }
                    <a
                      href={ebook.buyUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 transition-opacity"
                    >
                      Comprar
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
