export function normalizeToEmbed(raw: string): string | null {
  try {
    // allow plain URLs
    const u = new URL(raw.trim());
    const host = u.hostname.replace(/^www\./, "");

    // YouTube watch URL -> embed
    if (host.includes("youtube.com")) {
      // support /watch?v=ID or /shorts/ID
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}?rel=0&modestbranding=1`;
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts[0] === 'shorts' && parts[1]) return `https://www.youtube.com/embed/${parts[1]}?rel=0&modestbranding=1`;
      if (u.pathname.includes('/embed/')) return raw;
      return null;
    }

    // youtu.be short links
    if (host === 'youtu.be') {
      const id = u.pathname.replace('/', '');
      if (id) return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
      return null;
    }

    // Vimeo
    if (host.includes('vimeo.com')) {
      const parts = u.pathname.split('/').filter(Boolean);
      const id = parts[parts.length - 1];
      if (id && /^[0-9]+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
      if (u.pathname.includes('/video/')) return raw;
      return null;
    }

    // already an embed URL (pass-through)
    if (raw.includes('/embed/') || raw.includes('player.vimeo.com')) return raw;

    return null;
  } catch (e) {
    return null;
  }
}

export const ALLOWED_EMBED_HOSTS = ["youtube.com", "youtu.be", "youtube-nocookie.com", "vimeo.com", "player.vimeo.com"];

export function isAllowedEmbed(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    return ALLOWED_EMBED_HOSTS.some((h) => host.includes(h));
  } catch (e) {
    return false;
  }
}

export function getYoutubeId(raw: string): string | null {
  try {
    const u = new URL(raw);
    if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '');
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/').filter(Boolean);
      const idx = parts.indexOf('embed');
      if (idx >= 0 && parts[idx+1]) return parts[idx+1];
      if (parts[0] === 'shorts' && parts[1]) return parts[1];
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function youtubeThumbnailForId(id: string, quality: 'hq' | 'max' = 'hq') {
  if (quality === 'max') return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export async function fetchVimeoThumbnail(rawUrl: string): Promise<string | null> {
  try {
    const endpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(rawUrl)}`;
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const json = await res.json();
    return json.thumbnail_url || null;
  } catch (e) {
    return null;
  }
}
