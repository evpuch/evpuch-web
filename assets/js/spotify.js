// Reads the latest track from the Gist that the GitHub Action keeps updated,
// and renders it into the floating bubble. No backend / Netlify function — the
// Gist is public and served by GitHub.
//
// SETUP: paste the raw URL of your Gist's spotify.json file below. It looks like
//   https://gist.githubusercontent.com/<username>/<gist-id>/raw/spotify.json
const GIST_RAW_URL = 'https://gist.githubusercontent.com/evpuch/9657c60e3dc239fd5972dd83d780ced5/raw/spotify.json';

async function loadSpotify() {
  const el = document.getElementById('spotify-bubble');
  if (!el || !GIST_RAW_URL || GIST_RAW_URL.startsWith('REPLACE_')) return;

  try {
    const res = await fetch(GIST_RAW_URL + '?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return;
    const d = await res.json();
    if (!d || !d.title) return; // nothing to show yet

    el.querySelector('.sp-art').style.backgroundImage = d.albumArt ? `url("${d.albumArt}")` : '';
    el.querySelector('.sp-label').textContent = d.isPlaying ? 'Live from my Spotify' : 'Last played';
    el.querySelector('.sp-track').textContent = d.title;
    el.querySelector('.sp-artist').textContent = d.artist || '';
    el.href = d.url || '#';
    el.classList.toggle('playing', !!d.isPlaying);
    el.classList.add('visible');
  } catch (e) {
    /* leave the bubble hidden on any error */
  }
}

loadSpotify();
setInterval(loadSpotify, 60000); // re-check once a minute
