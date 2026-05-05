export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-purple/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] bg-accent-blue/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6">
          Soluções{' '}
          <span className="bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
            inovadoras
          </span>{' '}
          para o seu negócio
        </h1>

        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          A Bitzen Software desenvolve aplicações web de alta qualidade,
          projetadas para aumentar sua produtividade e simplificar processos.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#apps"
            className="px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 transition-opacity duration-200 shadow-lg shadow-accent-purple/25"
          >
            Ver nossos apps
          </a>
          <a
            href="#sobre"
            className="px-8 py-4 rounded-xl font-semibold text-gray-300 bg-surface border border-border hover:border-accent-purple/50 hover:text-white transition-all duration-200"
          >
            Sobre a empresa
          </a>
        </div>
      </div>
    </section>
  )
}
