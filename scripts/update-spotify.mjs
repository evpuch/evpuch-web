// Fetches the current (or most recently played) Spotify track and writes it to
// a Gist. Runs in GitHub Actions on a schedule — never on Netlify — so it
// doesn't touch the site's build credits. Requires these env vars (GitHub
// repo secrets): SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET,
// SPOTIFY_REFRESH_TOKEN, GIST_ID, GIST_TOKEN (a PAT with the `gist` scope).

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REFRESH_TOKEN,
  GIST_ID,
  GIST_TOKEN,
} = process.env;

async function getAccessToken() {
  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

function shape(item, isPlaying) {
  return {
    isPlaying: !!isPlaying,
    title: item.name,
    artist: (item.artists || []).map((a) => a.name).join(', '),
    album: item.album?.name || '',
    albumArt: item.album?.images?.[0]?.url || '',
    url: item.external_urls?.spotify || '',
    updatedAt: new Date().toISOString(),
  };
}

async function getTrack(token) {
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  // 1) Currently playing?
  let r = await fetch('https://api.spotify.com/v1/me/player/currently-playing', auth);
  if (r.status === 200) {
    const d = await r.json();
    if (d && d.item) return shape(d.item, d.is_playing);
  }

  // 2) Fall back to most recently played
  r = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', auth);
  if (r.status === 200) {
    const d = await r.json();
    if (d.items && d.items.length) return shape(d.items[0].track, false);
  }

  return { isPlaying: false, title: null, updatedAt: new Date().toISOString() };
}

const token = await getAccessToken();
const track = await getTrack(token);

const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${GIST_TOKEN}`,
    Accept: 'application/vnd.github+json',
  },
  body: JSON.stringify({ files: { 'spotify.json': { content: JSON.stringify(track, null, 2) } } }),
});
if (!res.ok) throw new Error(`Gist update failed: ${res.status} ${await res.text()}`);

console.log('Updated:', track.title ? `${track.title} — ${track.artist}` : 'nothing playing');
