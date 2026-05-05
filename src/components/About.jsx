export default function About() {
  const values = [
    {
      icon: '⚡',
      title: 'Performance',
      description: 'Apps rápidos, leves e otimizados para a melhor experiência do usuário.',
    },
    {
      icon: '🔒',
      title: 'Segurança',
      description: 'Desenvolvemos com as melhores práticas de segurança e privacidade.',
    },
    {
      icon: '🎯',
      title: 'Foco no usuário',
      description: 'Interfaces intuitivas, projetadas para facilitar o dia a dia de quem usa.',
    },
  ]

  return (
    <section id="sobre" className="py-24 px-6 bg-surface/30">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              Sobre a{' '}
              <span className="bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
                Bitzen Software
              </span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-6">
              A Bitzen Software é uma empresa dedicada ao desenvolvimento de aplicações web inovadoras.
              Nosso objetivo é criar ferramentas que realmente fazem a diferença na rotina de empresas e profissionais.
            </p>
            <p className="text-gray-400 text-lg leading-relaxed">
              Com foco em qualidade, performance e usabilidade, entregamos soluções que combinam tecnologia
              de ponta com uma experiência de uso impecável.
            </p>
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
