import { useSettings } from '../context/SettingsContext'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default function Blog() {
  const { blogPosts } = useSettings()

  return (
    <section id="blog" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Blog &{' '}
            <span className="bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
              Novidades
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Fique por dentro das últimas atualizações, dicas e novidades da Bitzen Software.
          </p>
        </div>

        {blogPosts.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-sm">Nenhuma postagem ainda.</p>
            <p className="text-xs mt-1">Use as configurações para adicionar posts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-accent-purple/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent-purple/10 group"
              >
                <div className="text-xs text-gray-500 font-medium">{formatDate(post.date)}</div>
                <h3 className="text-white font-semibold text-lg leading-snug group-hover:text-accent-blue transition-colors duration-200">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed flex-1">{post.excerpt}</p>
                <span className="text-accent-blue text-sm font-medium">Ler mais →</span>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
