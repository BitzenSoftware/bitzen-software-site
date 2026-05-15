import { useSettings } from '../context/SettingsContext'
import { useLanguage } from '../context/LanguageContext'
import AppCard from './AppCard'

export default function AppsSection() {
  const { apps } = useSettings()
  const { t } = useLanguage()

  return (
    <section id="apps" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            {t('apps_pre')}{' '}
            <span className="bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
              {t('apps_accent')}
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            {t('apps_subtitle')}
          </p>
        </div>

        {apps.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-sm">{t('apps_empty')}</p>
            <p className="text-xs mt-1">{t('apps_empty_hint')}</p>
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
