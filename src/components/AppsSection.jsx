import { useSettings } from '../context/SettingsContext'
import AppCard from './AppCard'

export default function AppsSection() {
  const { apps } = useSettings()

  return (
    <section id="apps" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Nossos{' '}
            <span className="bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
              Apps
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Escolha a ferramenta certa para o seu negócio. Cada app foi desenvolvido para resolver problemas reais.
          </p>
        </div>

        {apps.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-sm">Nenhum app cadastrado ainda.</p>
            <p className="text-xs mt-1">Use o ícone de configurações no canto inferior direito para adicionar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
