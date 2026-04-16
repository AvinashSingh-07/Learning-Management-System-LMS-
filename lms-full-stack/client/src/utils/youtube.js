
export function extractYoutubeVideoId(input) {
  if (input == null) return null
  const url = String(input).trim()
  if (!url) return null

  const short = url.match(/youtu\.be\/([^?&#/]+)/)
  if (short) return short[1]

  const embed = url.match(/youtube\.com\/embed\/([^?&#/]+)/)
  if (embed) return embed[1]

  const shorts = url.match(/youtube\.com\/shorts\/([^?&#/]+)/)
  if (shorts) return shorts[1]

  const vParam = url.match(/[?&]v=([^?&#]+)/)
  if (vParam) return vParam[1]

  const last = url.split('/').pop()?.split('?')[0]?.split('&')[0]
  if (last && /^[a-zA-Z0-9_-]{6,}$/.test(last)) return last

  return null
}
