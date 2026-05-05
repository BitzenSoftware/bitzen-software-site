export default function AppCard({ app }) {
  return (
    <div className="group relative bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-accent-purple/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent-purple/10">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-background border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
          <img
            src={app.logo}
            alt={`Logo ${app.name}`}
            className="w-full h-full object-contain p-2"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.parentElement.innerHTML = `<span class="text-2xl font-bold text-accent-purple">${app.name.charAt(0)}</span>`
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-semibold text-lg leading-tight">{app.name}</h3>
          </div>
          <span className="inline-block text-xs font-medium text-accent-blue bg-accent-blue/10 border border-accent-blue/20 rounded-full px-2 py-0.5">
            {app.badge}
          </span>
        </div>
      </div>

      <p className="text-gray-400 text-sm leading-relaxed flex-1">{app.description}</p>

      <a
        href={app.buyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full text-center px-4 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 transition-opacity duration-200 mt-auto"
      >
        Comprar / Saber mais →
      </a>
    </div>
  )
}
