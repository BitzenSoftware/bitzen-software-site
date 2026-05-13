import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const { from, to } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Build date filter
    let url = `${supabaseUrl}/rest/v1/linkedin_posts?select=*&order=published_at.desc`
    if (from) url += `&published_at=gte.${from}`
    if (to)   url += `&published_at=lte.${to}`

    const postsRes = await fetch(url, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
    const posts = await postsRes.json()

    // Try to fetch LinkedIn engagement for each post with r_member_social scope
    const clientId = Deno.env.get('LINKEDIN_CLIENT_ID')!
    const clientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET')!
    const refreshToken = Deno.env.get('LINKEDIN_REFRESH_TOKEN')!

    let accessToken: string | null = null
    try {
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
      if (tokenRes.ok) {
        const t = await tokenRes.json()
        accessToken = t.access_token
      }
    } catch { /* token fetch failed */ }

    // Attempt to fetch engagement for each post
    const enriched = await Promise.all(posts.map(async (post: Record<string, unknown>) => {
      if (!accessToken || !post.post_id) return post

      try {
        const shareUrn = encodeURIComponent(post.post_id as string)
        const statsRes = await fetch(
          `https://api.linkedin.com/v2/socialActions/${shareUrn}?fields=numComments,numLikes`,
          { headers: { Authorization: `Bearer ${accessToken}`, 'X-Restli-Protocol-Version': '2.0.0' } }
        )
        if (statsRes.ok) {
          const stats = await statsRes.json()
          // Update in DB
          await fetch(`${supabaseUrl}/rest/v1/linkedin_posts?id=eq.${post.id}`, {
            method: 'PATCH',
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({
              likes: stats.numLikes || 0,
              comments: stats.numComments || 0,
            }),
          })
          return { ...post, likes: stats.numLikes || 0, comments: stats.numComments || 0 }
        }
      } catch { /* ignore per-post errors */ }

      return post
    }))

    return Response.json({ posts: enriched }, { headers: CORS })

  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500, headers: CORS }
    )
  }
})
