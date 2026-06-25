import { task } from '@trigger.dev/sdk/v3'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const TEMPLATE_OWNER = 'AITechHelper'
const TEMPLATE_REPO = 'launchable-now-client-template'
const CLIENT_OWNER = 'AITechHelper'
const RAW_BASE = `https://raw.githubusercontent.com/${TEMPLATE_OWNER}/${TEMPLATE_REPO}/main`

function slugify(name: string) {
  return 'client-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function githubApi(path: string, method = 'GET', body?: unknown) {
  const token = process.env.GITHUB_TOKEN
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { ok: res.ok, status: res.status, data: await res.json() }
}

export const generateSiteTask = task({
  id: 'generate-site',
  maxDuration: 600, // 10 minutes
  run: async (payload: { leadId: string }) => {
    const { leadId } = payload

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    async function setStatus(status: string, extra?: Record<string, string>) {
      await supabase.from('leads').update({ generation_status: status, ...extra }).eq('id', leadId)
    }

    try {
      await setStatus('generating')

      // Fetch lead
      const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single()
      if (!lead) { await setStatus('error'); return }

      // Fetch uploaded assets
      const { data: storageFiles } = await supabase.storage
        .from('lead-assets')
        .list(`leads/${leadId}`, { limit: 20 })

      const assetUrls: string[] = (storageFiles || []).map((f: { name: string }) => {
        const { data: { publicUrl } } = supabase.storage
          .from('lead-assets')
          .getPublicUrl(`leads/${leadId}/${f.name}`)
        return publicUrl
      })

      const logoUrl = assetUrls[0] || null
      const photoUrls = assetUrls.slice(1)

      // Fetch template
      const tplRes = await githubApi(`/repos/${TEMPLATE_OWNER}/${TEMPLATE_REPO}/contents/index.html`)
      if (!tplRes.ok) { await setStatus('error'); return }
      const templateHtml = Buffer.from(tplRes.data.content, 'base64').toString('utf8')

      // Build prompt
      const reviews = Array.isArray(lead.reviews) ? lead.reviews : []
      const reviewsText = reviews.map((r: { name: string; rating: number; text: string }) =>
        `- ${r.name} (${r.rating}★): "${r.text}"`
      ).join('\n')

      const prompt = `You are filling in a website template for a local business client.

CLIENT DATA:
- Business Name: ${lead.business_name}
- Phone: ${lead.phone || 'not provided'}
- City: ${lead.city || 'not provided'}
- Niche/Service Type: ${lead.niche || 'not provided'}
- Address: ${lead.address || 'not provided'}
- Tagline: ${lead.tagline || 'not provided'}
- Services: ${lead.services || 'not provided'}
- Hours: ${lead.hours || 'not provided'}
- Owner: ${lead.owner_name || 'not provided'}
- Google Maps: ${lead.google_maps_url || ''}
- Facebook: ${lead.facebook_url || ''}
- Instagram: ${lead.instagram_url || ''}
- Yelp: ${lead.yelp_url || ''}
- Primary Brand Color: ${lead.primary_color || '#22c55e'}
- Secondary Brand Color: ${lead.secondary_color || '#166534'}
- Research Notes: ${lead.research_notes || 'none'}
- Reviews:
${reviewsText || 'No reviews provided'}

UPLOADED ASSETS:
${logoUrl ? `- Logo/primary image: ${logoUrl}` : '- No logo uploaded — leave logo.png as-is or remove the img tag'}
${photoUrls.length > 0 ? `- Additional photos:\n${photoUrls.map((u, i) => `  Photo ${i + 1}: ${u}`).join('\n')}` : '- No additional photos uploaded'}

INSTRUCTIONS:
1. Replace ALL [PLACEHOLDER] values in the HTML with real content for this client
2. Update the CSS :root variables at the top:
   - --primary should be set to ${lead.primary_color || '#22c55e'}
   - --primary-dark should be a darker version (~20% darker)
   - --primary-light should be a lighter version (~20% lighter)
   - --primary-glow should be rgba version of primary at 0.45 opacity
   - --accent and --accent-bright: choose a complementary accent color based on their brand
3. For ALL logo img tags (src="logo.png"), replace with: ${logoUrl || 'logo.png'}
4. For image src attributes that use stock photos (AdobeStock_*.webp):
   - If additional photos were provided above, use them in order to replace the stock photos
   - For any remaining stock photo slots, prepend: ${RAW_BASE}/
5. For [X]+ Years Serving — estimate based on research notes or omit if unknown
6. Write real, compelling copy for all text placeholders. Don't leave any [PLACEHOLDER] in the output.
7. For services: use the actual services listed. Create realistic service cards with descriptions.
8. For FAQs: write 8 realistic FAQs relevant to their niche and city.
9. For service area cities: make up realistic nearby cities/suburbs based on their city.
10. If reviews are provided, use them. If not, write 3 realistic-sounding generic 5-star reviews.
11. Keep all the HTML structure, CSS, and JavaScript exactly as-is — only replace content.
12. The contact form action should stay as-is (it's a demo form).
13. Return ONLY the complete HTML — no markdown, no explanation, nothing else.`

      // Stream from Claude
      const client = new Anthropic()
      let rawHtml = ''
      const stream = client.messages.stream({
        model: 'claude-opus-4-8',
        max_tokens: 32000,
        messages: [{ role: 'user', content: prompt + '\n\nTEMPLATE HTML:\n' + templateHtml }],
      })
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          rawHtml += chunk.delta.text
        }
      }

      const filledHtml = rawHtml.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
      if (!filledHtml.startsWith('<!DOCTYPE') && !filledHtml.startsWith('<html')) {
        await setStatus('error')
        return
      }

      const repoName = slugify(lead.business_name)

      // GitHub backup (best effort, 8s timeout)
      const githubTimeout = new Promise<void>((resolve) => setTimeout(resolve, 8000))
      const githubPush = (async () => {
        try {
          const createRes = await githubApi(`/user/repos`, 'POST', {
            name: repoName,
            description: `Website for ${lead.business_name} — built by Launchable Now`,
            private: false,
            auto_init: false,
          })
          const repoReady = createRes.ok || createRes.data.errors?.[0]?.message?.includes('already exists')
          if (repoReady) {
            await new Promise((r) => setTimeout(r, 1500))
            const existingFile = await githubApi(`/repos/${CLIENT_OWNER}/${repoName}/contents/index.html`)
            const fileSha = existingFile.ok ? existingFile.data.sha : undefined
            await githubApi(`/repos/${CLIENT_OWNER}/${repoName}/contents/index.html`, 'PUT', {
              message: `Add website for ${lead.business_name}`,
              content: Buffer.from(filledHtml).toString('base64'),
              ...(fileSha ? { sha: fileSha } : {}),
            })
          }
        } catch { /* ignore */ }
      })()
      await Promise.race([githubPush, githubTimeout])

      // Deploy to Vercel
      const vercelToken = process.env.VERCEL_TOKEN
      if (!vercelToken) { await setStatus('error'); return }

      const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: { Authorization: `Bearer ${vercelToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: repoName,
          files: [{ file: 'index.html', data: filledHtml, encoding: 'utf-8' }],
          projectSettings: { framework: null },
          target: 'production',
        }),
      })

      const deployData = await deployRes.json()
      if (!deployRes.ok) { await setStatus('error'); return }

      // Poll for ready
      const deploymentId = deployData.id
      let siteUrl = `https://${deployData.url}`
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 3000))
        const statusRes = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
          headers: { Authorization: `Bearer ${vercelToken}` },
        })
        const statusData = await statusRes.json()
        if (statusData.readyState === 'READY' || statusData.state === 'READY') {
          siteUrl = `https://${statusData.url}`
          break
        }
        if (statusData.readyState === 'ERROR' || statusData.state === 'ERROR') {
          await setStatus('error')
          return
        }
      }

      // Save result
      await setStatus('done', { site_url: siteUrl })

    } catch {
      await setStatus('error')
    }
  },
})
