import { useState } from 'react'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const CONTACT_EMAIL = 'contato@bitzensoftware.com'

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const subject = encodeURIComponent(`Contato de ${form.name}`)
    const body = encodeURIComponent(`Nome: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)
    window.open(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`)
    setSent(true)
  }

  return (
    <section id="contato" className="py-24 px-6 bg-surface/30">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Entre em{' '}
            <span className="bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
              Contato
            </span>
          </h2>
          <p className="text-gray-400 text-lg">
            Tem alguma dúvida ou precisa de suporte? Fale com a gente!
          </p>
        </div>

        {sent ? (
          <div className="bg-surface border border-green-500/30 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-white font-semibold text-xl mb-2">Mensagem preparada!</h3>
            <p className="text-gray-400">Seu cliente de email foi aberto. Envie a mensagem por lá.</p>
            <button
              onClick={() => setSent(false)}
              className="mt-6 text-accent-blue text-sm hover:underline"
            >
              Enviar outra mensagem
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-8 flex flex-col gap-5">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2" htmlFor="name">
                Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Seu nome completo"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors duration-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors duration-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2" htmlFor="message">
                Mensagem
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={form.message}
                onChange={handleChange}
                placeholder="Descreva sua dúvida ou mensagem..."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors duration-200 text-sm resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 transition-opacity duration-200 shadow-lg shadow-accent-purple/25"
            >
              Enviar mensagem
            </button>

            <p className="text-center text-gray-500 text-xs">
              Ou envie direto para{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent-blue hover:underline">
                {CONTACT_EMAIL}
              </a>
            </p>
          </form>
        )}
      </div>
    </section>
  )
}
