import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

  const { dump, imageUrls, businessName } = await request.json()

  if (!dump && (!imageUrls || imageUrls.length === 0)) {
    return NextResponse.json({ error: 'No content to process' }, { status: 400 })
  }

  const imageContent: Anthropic.ImageBlockParam[] = (imageUrls || []).map((url: string) => ({
    type: 'image' as const,
    source: { type: 'url' as const, url },
  }))

  const prompt = `You are helping build a website for a local business called "${businessName || 'this business'}".

The user has dumped raw research below — links, copy-pasted text, notes, reviews, URLs, whatever they found. There may also be images attached (logos, photos, screenshots of their Facebook/website/truck etc).

Extract everything you can into the JSON structure below. For fields you can't determine, use null. For colors, look at logos/images and pick the dominant brand color as a hex code.

Respond ONLY with valid JSON — no markdown, no explanation, just the JSON object.

{
  "business_name": "string or null",
  "phone": "string or null",
  "email": "string or null",
  "address": "string or null",
  "city": "string or null",
  "owner_name": "string or null",
  "tagline": "string or null — their slogan or a great one-liner you'd write for them",
  "services": "string or null — comma separated list of services they offer",
  "hours": "string or null — formatted business hours",
  "google_maps_url": "string or null",
  "facebook_url": "string or null",
  "instagram_url": "string or null",
  "yelp_url": "string or null",
  "website_url": "string or null — their existing website if they have one",
  "primary_color": "hex color or null — dominant brand color from logo/images",
  "secondary_color": "hex color or null — secondary brand color",
  "reviews": [
    { "name": "string", "rating": number, "text": "string" }
  ],
  "research_notes": "string or null — anything useful you found that doesn't fit above: years in business, awards, service area, certifications, unique selling points, etc"
}

RAW RESEARCH DUMP:
${dump || '(no text provided)'}`

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          ...imageContent,
          { type: 'text', text: prompt },
        ],
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const extracted = JSON.parse(text.trim())
    return NextResponse.json({ extracted })
  } catch {
    return NextResponse.json({ error: 'AI returned invalid JSON', raw: text }, { status: 500 })
  }
}
