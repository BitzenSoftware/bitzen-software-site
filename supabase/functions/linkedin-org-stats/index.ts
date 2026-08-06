import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Marketing APIs are versioned per month and reject unknown values.
const LINKEDIN_VERSION = '202607'
const REST = 'https://api.linkedin.com/rest'

function liHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Linkedin-Version': LINKEDIN_VERSION,
    'X-Restli-Protocol-Version': '2.0.0',
    'Content-Type': 'application/json',
  }
}

// Every LinkedIn call goes through here so a failure is reported, never swallowed.
async function liGet(url: string, token: string) {
  const res = await fetch(url, { headers: liHeaders(token) })
  const body = await res.text()
  if (!res.ok) {
    return { ok: false as const, error: { status: res.status, body: body.slice(0, 400) } }
  }
  try {
    return { ok: true as const, data: JSON.parse(body) }
  } catch {
    return { ok: false as const, error: { status: res.status, body: 'unparseable JSON' } }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const diagnostics: Record<string, unknown> = { linkedin_version: LINKEDIN_VERSION }

  try {
    const orgId = Deno.env.get('LINKEDIN_ORG_ID')
    if (!orgId) {
      return Response.json(
        { error: 'LINKEDIN_ORG_ID not set', diagnostics },
        { status: 500, headers: CORS }
      )
    }
    const orgUrn = `urn:li:organization:${orgId}`
    diagnostics.organization = orgUrn

    // --- access token -------------------------------------------------------
    const clientId = Deno.env.get('LINKEDIN_CLIENT_ID')!
    const clientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET')!
    const refreshToken = Deno.env.get('LINKEDIN_REFRESH_TOKEN')!

    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })
    const tokenBody = await tokenRes.text()
    if (!tokenRes.ok) {
      diagnostics.token = { ok: false, status: tokenRes.status, body: tokenBody.slice(0, 300) }
      return Response.json({ error: 'token refresh failed', diagnostics }, { status: 502, headers: CORS })
    }
    const token = JSON.parse(tokenBody)
    const accessToken: string = token.access_token
    // rw_organization_admin must appear here, or every call below returns 403.
    diagnostics.token = { ok: true, scope: token.scope ?? null, expires_in: token.expires_in ?? null }
    diagnostics.has_org_admin_scope = String(token.scope ?? '').includes('rw_organization_admin')

    const encOrg = encodeURIComponent(orgUrn)

    // --- audience demographics (the ICP signal) -----------------------------
    const followers = await liGet(
      `${REST}/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${encOrg}`,
      accessToken
    )
    if (!followers.ok) diagnostics.follower_stats_error = followers.error

    // --- lifetime share statistics -----------------------------------------
    const lifetime = await liGet(
      `${REST}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encOrg}`,
      accessToken
    )
    if (!lifetime.ok) diagnostics.lifetime_stats_error = lifetime.error

    // --- per-post statistics for posts we published as the organization -----
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const postsRes = await fetch(
      `${supabaseUrl}/rest/v1/linkedin_posts?select=id,post_id,text_preview,published_at&destination=eq.org&order=published_at.desc&limit=100`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
    )
    const orgPosts: Array<Record<string, unknown>> = await postsRes.json()
    diagnostics.org_posts_in_db = Array.isArray(orgPosts) ? orgPosts.length : 0

    // The endpoint takes shares and ugcPosts as separate params — split by URN type.
    const ids = (Array.isArray(orgPosts) ? orgPosts : [])
      .map((p) => String(p.post_id ?? ''))
      .filter((u) => u.startsWith('urn:li:'))
    const shareUrns = ids.filter((u) => u.startsWith('urn:li:share:'))
    const ugcUrns = ids.filter((u) => u.startsWith('urn:li:ugcPost:'))

    const perPost: unknown[] = []
    for (const [param, urns] of [['shares', shareUrns], ['ugcPosts', ugcUrns]] as const) {
      if (!urns.length) continue
      const list = `List(${urns.map(encodeURIComponent).join(',')})`
      const r = await liGet(
        `${REST}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encOrg}&${param}=${list}`,
        accessToken
      )
      if (r.ok) perPost.push(...(r.data.elements ?? []))
      else diagnostics[`${param}_stats_error`] = r.error
    }

    return Response.json(
      {
        organization: orgUrn,
        // Posts with no impressions are omitted by LinkedIn — absent means zero.
        followers: followers.ok ? followers.data.elements?.[0] ?? null : null,
        lifetime: lifetime.ok ? lifetime.data.elements?.[0] ?? null : null,
        per_post: perPost,
        diagnostics,
      },
      { headers: CORS }
    )

  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Unknown error', diagnostics },
      { status: 500, headers: CORS }
    )
  }
})
