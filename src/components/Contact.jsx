import { useState } from 'react'
import { useSettings } from '../context/SettingsContext'
import { useLanguage } from '../context/LanguageContext'

export default function Contact() {
  const { contactEmail } = useSettings()
  const { t } = useLanguage()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const subject = encodeURIComponent(`Contato de ${form.name}`)
    const body = encodeURIComponent(`Nome: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)
    window.open(`mailto:${contactEmail}?subject=${subject}&body=${body}`)
    setSent(true)
  }

  return (
    <section id="contato" className="py-24 px-6 bg-surface/30">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            {t('contact_pre')}{' '}
            <span className="bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
              {t('contact_accent')}
            </span>
          </h2>
          <p className="text-gray-400 text-lg">{t('contact_subtitle')}</p>
        </div>

        {sent ? (
          <div className="bg-surface border border-green-500/30 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-white font-semibold text-xl mb-2">{t('contact_ready_title')}</h3>
            <p className="text-gray-400">{t('contact_ready_desc')}</p>
            <button onClick={() => setSent(false)} className="mt-6 text-accent-blue text-sm hover:underline">
              {t('contact_send_another')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-8 flex flex-col gap-5">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2" htmlFor="name">{t('contact_name')}</label>
              <input id="name" name="name" type="text" required value={form.name} onChange={handleChange}
                placeholder={t('contact_name_ph')}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors duration-200 text-sm" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2" htmlFor="email">{t('contact_email_label')}</label>
              <input id="email" name="email" type="email" required value={form.email} onChange={handleChange}
                placeholder={t('contact_email_ph')}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors duration-200 text-sm" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2" htmlFor="message">{t('contact_msg')}</label>
              <textarea id="message" name="message" required rows={5} value={form.message} onChange={handleChange}
                placeholder={t('contact_msg_ph')}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors duration-200 text-sm resize-none" />
            </div>
            <button type="submit"
              className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 transition-opacity duration-200 shadow-lg shadow-accent-purple/25">
              {t('contact_submit')}
            </button>
            <p className="text-center text-gray-500 text-xs">
              {t('contact_or')}{' '}
              <a href={`mailto:${contactEmail}`} className="text-accent-blue hover:underline">
                {contactEmail}
              </a>
            </p>
          </form>
        )}
      </div>
    </section>
  )
}
