const cx = (...c) => c.filter(Boolean).join(' ')

export function Button({ variant = 'primary', size = 'md', className, ...p }) {
  return (
    <button
      {...p}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm',
        variant === 'primary' && 'bg-gradient-to-r from-accent-purple to-accent-blue text-white hover:opacity-90',
        variant === 'secondary' && 'bg-background border border-border text-gray-400 hover:text-white',
        variant === 'ghost' && 'text-gray-500 hover:text-accent-blue hover:bg-surface',
        variant === 'danger' && 'text-red-400 hover:bg-red-400/10',
        className,
      )}
    />
  )
}

export function Field({ label, children, hint, className }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-gray-400 text-xs font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-gray-600 text-xs">{hint}</span>}
    </label>
  )
}

const inputCls =
  'w-full bg-background border border-border rounded-xl px-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors'

export function Input({ className, ...p }) {
  return <input {...p} className={cx(inputCls, 'h-10', className)} />
}

export function Textarea({ className, ...p }) {
  return <textarea {...p} className={cx(inputCls, 'py-2.5 leading-relaxed resize-none', className)} />
}

export function Select({ className, ...p }) {
  return <select {...p} className={cx(inputCls, 'h-10 pr-8', className)} />
}

export function Card({ children, className }) {
  return <div className={cx('rounded-2xl border border-border bg-surface', className)}>{children}</div>
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent-purple" />
    </div>
  )
}

export function Empty({ title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <p className="text-white font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-gray-500 text-sm">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

const STATUS_STYLE = {
  rascunho: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  enviado: 'bg-accent-blue/15 text-accent-blue border-accent-blue/20',
  aprovado: 'bg-green-500/15 text-green-400 border-green-500/20',
  recusado: 'bg-red-500/15 text-red-400 border-red-500/20',
}

export function Badge({ status, children }) {
  return (
    <span className={cx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', STATUS_STYLE[status])}>
      {children}
    </span>
  )
}

export function Tabs({ items, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cx(
            'py-2 px-3 rounded-xl text-xs font-semibold transition-all border',
            value === item.id
              ? 'bg-gradient-to-r from-accent-purple to-accent-blue text-white border-transparent'
              : 'bg-background border-border text-gray-400 hover:text-white',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function AddButton({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 rounded-xl text-sm font-medium text-gray-500 border border-dashed border-border hover:border-accent-purple/50 hover:text-accent-purple transition-all duration-200 flex items-center justify-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  )
}
