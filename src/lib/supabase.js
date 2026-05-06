import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_KEY

if (!url || !key) {
  console.error('[Supabase] Variáveis de ambiente não encontradas:', { url: !!url, key: !!key })
}

// Strip any whitespace/newlines that may have been injected via env vars
const cleanKey = key ? key.trim() : ''
const cleanUrl = url ? url.trim() : ''

export const supabase = createClient(cleanUrl, cleanKey)
export const supabaseInfo = { url: cleanUrl, keyPrefix: cleanKey.slice(0, 20), keyLength: cleanKey.length }
