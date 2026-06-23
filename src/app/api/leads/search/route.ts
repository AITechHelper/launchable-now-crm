import { NextRequest } from 'next/server'
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

interface Filters {
  website: 'any' | 'none' | 'has'
  minReviews: number
  maxReviews: number
  requirePhone: boolean
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

function applyFilters(place: Place, filters: Filters): string | null {
  const rc = place.userRatingCount ?? 0
  const hasWebsite = !!place.websiteUri
  const hasPhone = !!place.nationalPhoneNumber

  if (filters.requirePhone && !hasPhone) return 'no phone'
  if (filters.website === 'none' && hasWebsite) return 'has website'
  if (filters.website === 'has' && !hasWebsite) return 'no website'
  if (rc < filters.minReviews) return `too few reviews (${rc})`
  if (filters.maxReviews > 0 && rc > filters.maxReviews) return `too many reviews (${rc})`
  return null
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return new Response(
      `data: ${JSON.stringify({ error: 'GOOGLE_PLACES_API_KEY not configured.' })}\n\n`,
      { headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  const body = await request.json()
  const { city, vertical } = body
  if (!city || !vertical) {
    return new Response(
      `data: ${JSON.stringify({ error: 'City and vertical required.' })}\n\n`,
      { headers: { 'Content-Type': 'text/event-stream' } }
    )
  }

  const filters: Filters = {
    website:      body.website      ?? 'any',
    minReviews:   body.minReviews   ?? 0,
    maxReviews:   body.maxReviews   ?? 0,
    requirePhone: body.requirePhone ?? false,
  }

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
        if (filters.website !== 'any') send(`  Filter: ${filters.website === 'none' ? 'No website only' : 'Has website only'}`)
        if (filters.minReviews > 0) send(`  Filter: min ${filters.minReviews} reviews`)
        if (filters.maxReviews > 0) send(`  Filter: max ${filters.maxReviews} reviews`)
        if (filters.requirePhone) send(`  Filter: phone required`)

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

        send(`Found ${allPlaces.length} total — applying filters…`)

        let saved = 0, dupes = 0, skipped = 0

        for (let i = 0; i < allPlaces.length; i++) {
          const place = allPlaces[i]
          const name = place.displayName?.text || 'Unknown'
          const placeId = place.id || ''

          const skipReason = applyFilters(place, filters)
          if (skipReason) {
            send(`  [${i + 1}] SKIP (${skipReason}): ${name}`)
            skipped++
            continue
          }

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

          const website = place.websiteUri || ''
          const { error } = await supabase.from('leads').insert({
            business_name: name,
            phone:         place.nationalPhoneNumber || '',
            address:       place.formattedAddress || '',
            city,
            niche:         vertical,
            has_website:   !!website,
            website_url:   website,
            rating:        place.rating ?? null,
            review_count:  place.userRatingCount ?? null,
            place_id:      placeId,
            status:        'new',
            source:        'lead_finder',
          })

          if (error) {
            send(`  [${i + 1}] ERROR: ${error.message}`)
          } else {
            const tag = website ? 'has website' : 'NO website'
            send(`  [${i + 1}] Saved (${tag}): ${name} — ${place.nationalPhoneNumber || 'no phone'}`)
            saved++
          }
        }

        send(`✅ Done — ${saved} saved, ${dupes} dupes, ${skipped} filtered/skipped.`)
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
