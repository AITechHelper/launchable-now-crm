import { NextRequest } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

const TEMPLATE_OWNER = 'AITechHelper'
const TEMPLATE_REPO = 'launchable-now-client-template'
const CLIENT_OWNER = 'AITechHelper'

// Raw GitHub URL base for template images
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(msg: string) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: msg })}\n\n`))
      }
      function error(msg: string) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
        controller.close()
      }

      try {
        // 1. Check env vars
        if (!process.env.GITHUB_TOKEN) return error('GITHUB_TOKEN not configured')
        if (!process.env.ANTHROPIC_API_KEY) return error('ANTHROPIC_API_KEY not configured')

        // 2. Fetch lead
        send('Fetching lead data…')
        const supabase = createServerClient()
        const { data: lead } = await supabase.from('leads').select('*').eq('id', id).single()
        if (!lead) return error('Lead not found')
        send(`  Lead: ${lead.business_name}`)

        // 2b. Fetch uploaded assets from Supabase storage
        const { data: storageFiles } = await supabase.storage
          .from('lead-assets')
          .list(`leads/${id}`, { limit: 20 })

        const assetUrls: string[] = (storageFiles || []).map((f: { name: string }) => {
          const { data: { publicUrl } } = supabase.storage
            .from('lead-assets')
            .getPublicUrl(`leads/${id}/${f.name}`)
          return publicUrl
        })

        const logoUrl = assetUrls[0] || null
        const photoUrls = assetUrls.slice(1)
        if (logoUrl) send(`  Found ${assetUrls.length} uploaded asset(s)`)
        else send(`  No uploaded assets — using stock photos`)

        // 3. Fetch template HTML
        send('Fetching website template…')
        const tplRes = await githubApi(`/repos/${TEMPLATE_OWNER}/${TEMPLATE_REPO}/contents/index.html`)
        if (!tplRes.ok) return error('Could not fetch template from GitHub')
        const templateHtml = Buffer.from(tplRes.data.content, 'base64').toString('utf8')
        send(`  Template loaded (${Math.round(templateHtml.length / 1024)}KB)`)

        // 4. Build context for Claude
        send('Sending to Claude to fill in placeholders…')
        const reviews = Array.isArray(lead.reviews) ? lead.reviews : []
        const reviewsText = reviews.map((r: { name: string; rating: number; text: string }) =>
          `- ${r.name} (${r.rating}★): "${r.text}"`
        ).join('\n')

        const imageBaseUrl = RAW_BASE

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
   - For any remaining stock photo slots, prepend: ${imageBaseUrl}/
     Example: src="AdobeStock_369759521.webp" → src="${imageBaseUrl}/AdobeStock_369759521.webp"
4. For [X]+ Years Serving — estimate based on research notes or omit the badge if unknown
5. Write real, compelling copy for all text placeholders. Don't leave any [PLACEHOLDER] in the output.
6. For services: use the actual services listed. Create realistic service cards with descriptions.
7. For FAQs: write 8 realistic FAQs relevant to their niche and city.
8. For service area cities: make up realistic nearby cities/suburbs based on their city.
9. If reviews are provided, use them. If not, write 3 realistic-sounding generic 5-star reviews.
10. Keep all the HTML structure, CSS, and JavaScript exactly as-is — only replace content.
11. The contact form action should stay as-is (it's a demo form).
12. Return ONLY the complete HTML — no markdown, no explanation, nothing else.`

        const client = new Anthropic()
        const response = await client.messages.create({
          model: 'claude-opus-4-8',
          max_tokens: 16000,
          messages: [{ role: 'user', content: prompt + '\n\nTEMPLATE HTML:\n' + templateHtml }],
        })

        const filledHtml = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
        if (!filledHtml.startsWith('<!DOCTYPE') && !filledHtml.startsWith('<html')) {
          return error('Claude returned unexpected output — not valid HTML')
        }
        send(`  ✓ HTML generated (${Math.round(filledHtml.length / 1024)}KB)`)

        // 5. Create GitHub repo
        const repoName = slugify(lead.business_name)
        send(`Creating GitHub repo: ${repoName}…`)

        const createRes = await githubApi(`/user/repos`, 'POST', {
          name: repoName,
          description: `Website for ${lead.business_name} — built by Launchable Now`,
          private: false,
          auto_init: false,
        })

        if (!createRes.ok && createRes.data.errors?.[0]?.message?.includes('already exists')) {
          send(`  Repo already exists — updating files…`)
        } else if (!createRes.ok) {
          return error(`Failed to create repo: ${createRes.data.message}`)
        } else {
          send(`  ✓ Repo created: github.com/${CLIENT_OWNER}/${repoName}`)
        }

        // Small delay for repo initialization
        await new Promise((r) => setTimeout(r, 1500))

        // 6. Push index.html
        send('Pushing index.html…')

        // Check if file exists first (for updates)
        const existingFile = await githubApi(`/repos/${CLIENT_OWNER}/${repoName}/contents/index.html`)
        const fileSha = existingFile.ok ? existingFile.data.sha : undefined

        const pushRes = await githubApi(`/repos/${CLIENT_OWNER}/${repoName}/contents/index.html`, 'PUT', {
          message: `Add website for ${lead.business_name}`,
          content: Buffer.from(filledHtml).toString('base64'),
          ...(fileSha ? { sha: fileSha } : {}),
        })

        if (!pushRes.ok) return error(`Failed to push HTML: ${pushRes.data.message}`)
        send('  ✓ index.html pushed')

        // 7. Enable GitHub Pages
        send('Enabling GitHub Pages…')
        const pagesRes = await githubApi(`/repos/${CLIENT_OWNER}/${repoName}/pages`, 'POST', {
          source: { branch: 'main', path: '/' },
        })

        let siteUrl = `https://${CLIENT_OWNER.toLowerCase()}.github.io/${repoName}`
        if (!pagesRes.ok && pagesRes.status !== 409) {
          send(`  Warning: Could not enable Pages automatically (${pagesRes.data.message})`)
          send(`  Enable manually: repo Settings → Pages → Deploy from main branch`)
        } else {
          send(`  ✓ GitHub Pages enabled`)
        }

        send(`\n✅ Done! Site will be live in ~1 minute at:`)
        send(`   ${siteUrl}`)
        send(`   GitHub: https://github.com/${CLIENT_OWNER}/${repoName}`)

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          done: true,
          siteUrl,
          repoUrl: `https://github.com/${CLIENT_OWNER}/${repoName}`,
        })}\n\n`))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
