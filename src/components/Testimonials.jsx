import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([])
  const [form, setForm] = useState({ name: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    supabase
      .from('testimonials')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTestimonials(data || [])
        setLoading(false)
      })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    await supabase.from('testimonials').insert({ name: form.name, message: form.message })
    setSent(true)
  }

  return (
    <section id="testemunhos" className="py-24 px-6 bg-surface/20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            {t('test_pre')}{' '}
            <span className="bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
              {t('test_accent')}
            </span>
          </h2>
          <p className="text-gray-400 text-lg">{t('test_subtitle')}</p>
        </div>

        {!loading && testimonials.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {testimonials.map(t_ => (
              <div key={t_.id} className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-accent-purple/40 transition-colors duration-300">
                <svg className="w-6 h-6 text-accent-purple/50 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-gray-300 text-sm leading-relaxed flex-1">"{t_.message}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {t_.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-white text-sm font-medium">{t_.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="max-w-lg mx-auto">
          <h3 className="text-white text-xl font-semibold text-center mb-6">{t('test_form_title')}</h3>
          {sent ? (
            <div className="bg-surface border border-green-500/30 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">🙏</div>
              <h4 className="text-white font-semibold text-lg mb-2">{t('test_thanks_title')}</h4>
              <p className="text-gray-400 text-sm">{t('test_thanks_desc')}</p>
              <button onClick={() => { setSent(false); setForm({ name: '', message: '' }) }}
                className="mt-6 text-accent-blue text-sm hover:underline">
                {t('test_send_another')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4">
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">{t('test_name')}</label>
                <input required value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={t('test_name_ph')}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors text-sm" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">{t('test_comment')}</label>
                <textarea required rows={4} value={form.message}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  placeholder={t('test_comment_ph')}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors text-sm resize-none" />
              </div>
              <button type="submit"
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 transition-opacity">
                {t('test_submit')}
              </button>
              <p className="text-center text-gray-600 text-xs">{t('test_pending_note')}</p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
