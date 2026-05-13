import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const { text, groupId } = await req.json()
    if (!text?.trim()) return Response.json({ error: 'text is required' }, { status: 400, headers: CORS })

    const clientId = Deno.env.get('LINKEDIN_CLIENT_ID')!
    const clientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET')!
    const refreshToken = Deno.env.get('LINKEDIN_REFRESH_TOKEN')!
    const personId = Deno.env.get('LINKEDIN_PERSON_ID')!

    // Get fresh access token
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
    if (!tokenRes.ok) throw new Error(`Token refresh failed: ${await tokenRes.text()}`)
    const { access_token } = await tokenRes.json()

    // Build post body — group uses containerEntity
    const postBody: Record<string, unknown> = {
      author: `urn:li:person:${personId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': groupId ? 'CONTAINER' : 'PUBLIC',
      },
    }
    if (groupId) postBody.containerEntity = `urn:li:group:${groupId}`

    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postBody),
    })

    if (!postRes.ok) throw new Error(`LinkedIn post failed (${postRes.status}): ${await postRes.text()}`)

    const postId = postRes.headers.get('x-restli-id') || 'unknown'
    return Response.json({ success: true, postId, destination: groupId ? `group:${groupId}` : 'feed' }, { headers: CORS })

  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500, headers: CORS }
    )
  }
})
