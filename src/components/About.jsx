import { useLanguage } from '../context/LanguageContext'

export default function About() {
  const { t } = useLanguage()

  const values = [
    { icon: '⚡', title: t('about_v1_title'), description: t('about_v1_desc') },
    { icon: '🔒', title: t('about_v2_title'), description: t('about_v2_desc') },
    { icon: '🎯', title: t('about_v3_title'), description: t('about_v3_desc') },
  ]

  return (
    <section id="sobre" className="py-24 px-6 bg-surface/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              {t('about_pre')}{' '}
              <span className="bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
                {t('about_accent')}
              </span>
              {t('about_post') && ` ${t('about_post')}`}
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">{t('about_p1')}</p>
            <p className="text-gray-400 text-lg leading-relaxed">{t('about_p2')}</p>
          </div>

          <div className="flex flex-col gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="flex items-start gap-4 bg-surface border border-border rounded-xl p-5 hover:border-accent-purple/40 transition-colors duration-200"
              >
                <span className="text-3xl">{value.icon}</span>
                <div>
                  <h3 className="text-white font-semibold mb-1">{value.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
