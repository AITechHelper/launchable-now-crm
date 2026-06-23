import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText'
const FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,nextPageToken'

interface Place {
  id?: string
  displayName?: { text?: string }
  nationalPhoneNumber?: string
  websiteUri?: string
  formattedAddress?: string
  rating?: number
  userRatingCount?: number
}

async function searchPlaces(query: string, apiKey: string, pageToken?: string) {
  const body: Record<string, unknown> = { textQuery: query, pageSize: 20 }
  if (pageToken) body.pageToken = pageToken

  const resp = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  })
  const data = await resp.json()
  if (data.error) throw new Error(data.error.message || 'Google Places error')
  return { places: (data.places || []) as Place[], nextPageToken: data.nextPageToken as string | undefined }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured.' }, { status: 500 })

  const { city, vertical } = await request.json()
  if (!city || !vertical) return NextResponse.json({ error: 'City and vertical required.' }, { status: 400 })

  const supabase = createServerClient()
  const encoder = new TextEncoder()
  const query = `${vertical} in ${city}`

  const stream = new ReadableStream({
    async start(controller) {
      function send(msg: string) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ log: msg })}\n\n`))
      }

      try {
        send(`Searching: "${query}"`)

        const allPlaces: Place[] = []
        let pageToken: string | undefined
        for (let page = 1; page <= 3; page++) {
          if (page > 1 && !pageToken) break
          const result = await searchPlaces(query, apiKey, pageToken)
          allPlaces.push(...result.places)
          pageToken = result.nextPageToken
          send(`  Page ${page}: ${result.places.length} results`)
          if (!result.places.length) break
        }

        send(`Total found: ${allPlaces.length} — saving to CRM…`)

        let saved = 0, dupes = 0, skipped = 0

        for (let i = 0; i < allPlaces.length; i++) {
          const place = allPlaces[i]
          const name = place.displayName?.text || 'Unknown'
          const phone = place.nationalPhoneNumber || ''
          const website = place.websiteUri || ''
          const address = place.formattedAddress || ''
          const placeId = place.id || ''

          if (!phone) {
            send(`  [${i + 1}] SKIP (no phone): ${name}`)
            skipped++
            continue
          }

          // Check for dupe by place_id
          const { data: existing } = await supabase
            .from('leads')
            .select('id')
            .eq('place_id', placeId)
            .maybeSingle()

          if (existing) {
            send(`  [${i + 1}] DUPE: ${name}`)
            dupes++
            continue
          }

          const { error } = await supabase.from('leads').insert({
            business_name: name,
            phone,
            address,
            city,
            niche: vertical,
            has_website: !!website,
            website_url: website,
            rating: place.rating ?? null,
            review_count: place.userRatingCount ?? null,
            place_id: placeId,
            status: 'new',
            source: 'lead_finder',
          })

          if (error) {
            send(`  [${i + 1}] ERROR: ${error.message}`)
          } else {
            const tag = website ? 'has website' : 'NO website'
            send(`  [${i + 1}] Saved (${tag}): ${name} — ${phone}`)
            saved++
          }
        }

        send(`✅ Done — ${saved} saved, ${dupes} dupes, ${skipped} skipped (no phone).`)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, saved, dupes, skipped })}\n\n`))
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
