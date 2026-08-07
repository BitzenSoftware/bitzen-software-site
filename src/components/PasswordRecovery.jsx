import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Supabase recovery links land on the site with the token in the URL hash. The
// JS client parses it, opens a short-lived session and fires PASSWORD_RECOVERY.
// Without something listening for that event the link appears to do nothing,
// which is exactly how it looked before this component existed.
export default function PasswordRecovery() {
  const [open, setOpen] = useState(false)
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Covers a reload where the hash is still present but the event already fired.
    if (window.location.hash.includes('type=recovery')) setOpen(true)

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setOpen(true)
    })
    return () => sub?.subscription?.unsubscribe()
  }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (pass.length < 8) return setError('A senha precisa de pelo menos 8 caracteres.')
    if (pass !== confirm) return setError('As senhas não coincidem.')

    setBusy(true)
    const { error: err } = await supabase.auth.updateUser({ password: pass })
    setBusy(false)
    if (err) return setError(err.message)

    setDone(true)
    // Drop the recovery token from the address bar once it has been used.
    window.history.replaceState(null, '', window.location.pathname)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-6">
        {done ? (
          <>
            <h2 className="text-white text-lg font-bold mb-1">Senha alterada</h2>
            <p className="text-gray-500 text-sm mb-5">
              Já pode entrar no painel com a nova senha.
            </p>
            <button onClick={() => setOpen(false)}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 transition-opacity">
              Fechar
            </button>
          </>
        ) : (
          <>
            <h2 className="text-white text-lg font-bold mb-1">Definir nova senha</h2>
            <p className="text-gray-500 text-sm mb-5">Mínimo de 8 caracteres.</p>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <input type="password" autoComplete="new-password" required value={pass}
                onChange={(e) => setPass(e.target.value)} placeholder="Nova senha"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors" />
              <input type="password" autoComplete="new-password" required value={confirm}
                onChange={(e) => setConfirm(e.target.value)} placeholder="Repetir a nova senha"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors" />
              {error && (
                <p className="text-red-400 text-xs text-center bg-red-400/10 border border-red-400/20 rounded-lg py-2">
                  {error}
                </p>
              )}
              <button type="submit" disabled={busy}
                className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 transition-opacity disabled:opacity-50">
                {busy ? 'A gravar…' : 'Gravar nova senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
