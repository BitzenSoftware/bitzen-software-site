import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const { text: rawText, groupId, agentId } = await req.json()
    if (!rawText?.trim()) return Response.json({ error: 'text is required' }, { status: 400, headers: CORS })

    // Strip markdown formatting that LinkedIn renders as plain text
    const text = rawText
      .replace(/\*\*(.+?)\*\*/g, '$1')   // **bold**
      .replace(/\*(.+?)\*/g, '$1')        // *italic*
      .replace(/__(.+?)__/g, '$1')        // __underline__
      .replace(/_(.+?)_/g, '$1')          // _italic_
      .replace(/#{1,6}\s+/g, '')          // # headings
      .replace(/`(.+?)`/g, '$1')          // `code`
      .trim()

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
    const destination = groupId ? `group:${groupId}` : 'feed'

    // Save to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    await fetch(`${supabaseUrl}/rest/v1/linkedin_posts`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        post_id: postId,
        text_preview: text.slice(0, 300),
        agent_id: agentId,
        destination,
      }),
    })

    return Response.json({ success: true, postId, destination }, { headers: CORS })

  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500, headers: CORS }
    )
  }
})
