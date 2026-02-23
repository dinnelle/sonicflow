# SonicFlow v2.0 — Upgrade Instructions

## What's New (All Features Added)

### Player Controls
- **Shuffle mode** — randomizes next track (button + press `S`)
- **Repeat modes** — off / repeat all / repeat one (button + press `R`)
- **Sleep timer** — auto-stop after 5/15/30/45/60/90 minutes
- **Seek ±10s** — arrow keys skip forward/back within a track
- **Volume keys** — up/down arrows adjust volume

### Lyrics
- **Lyrics panel** — slides in from the right, auto-fetches from lrclib.net
- Toggle with button in player bar or now-playing hero, or press `L`

### Search Improvements
- **Debounced live search** — suggestions appear as you type (300ms delay)
- **Search history** — stored locally, shown in dropdown + dashboard chips
- **Infinite scroll** — automatically loads more results as you scroll down
- **"Back to dashboard"** link in search results header
- **"Add All to Queue"** button below search results

### Queue Improvements
- **Drag & drop reorder** — grab the dot handle to rearrange queue order
- **Duplicate prevention** — won't add the same track twice

### Playlist Improvements
- **Cover art thumbnails** — auto-generated grid from first 4 track thumbnails
- **Export playlist** — downloads as JSON file
- **Import playlist** — upload a JSON file to recreate a playlist
- **Share playlist** — copies a URL with playlist data encoded (no backend needed)

### UI/UX
- **Toast notifications** — elegant slide-in toasts replace all `alert()` / `confirm()` calls
- **Dynamic color theming** — ambient background glow shifts hue per track
- **Dark / Light theme toggle** — sun/moon button in header, preference saved to localStorage
- **Mobile bottom sheet** — queue/playlists slide up from bottom on mobile (< 1024px)
- **Keyboard shortcuts modal** — press `?` to see all shortcuts
- **PWA support** — installable as app on phone/desktop

### All Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Space | Play / Pause |
| Shift+→ | Next track |
| Shift+← | Previous track |
| → | Seek +10s |
| ← | Seek -10s |
| ↑ | Volume up |
| ↓ | Volume down |
| S | Toggle shuffle |
| R | Toggle repeat |
| L | Toggle lyrics |
| M | Mute / Unmute |
| T | Toggle dark / light |
| ? | Show shortcuts |
| Esc | Close modals |

---

## Installation (Replace Files)

### Files to REPLACE (overwrite your existing ones):
```
player.php              → your root/player.php
static/js/player.js     → your root/static/js/player.js
static/css/style.css    → your root/static/css/style.css
```

### Files to ADD (new files):
```
manifest.json           → your root/manifest.json
sw.js                   → your root/sw.js
static/icon-192.png     → your root/static/icon-192.png
static/icon-512.png     → your root/static/icon-512.png
```

### Files NOT changed (keep as-is):
```
index.php
login.php
register.php
logout.php
settings.php
includes/auth.php
config/database.php
api/playlists.php
api/tracks.php
api/history.php
api/save-key.php
api/settings.php
setup.sql
.htaccess
```

---

## Notes

### What's NOT included (and why):
- **Equalizer** — YouTube's iframe API doesn't expose the audio stream to Web Audio API. This is a YouTube limitation, not possible without downloading audio.
- **Multi-user playlist collaboration** — Requires significant backend work (invite system, permissions, real-time sync). GoDaddy shared hosting doesn't support WebSockets. Planned for future.
- **Smooth page transitions** — Login/register/player are separate PHP pages. Would need a full SPA rewrite.

### PWA Icons:
The included icons are simple generated PNGs. For a polished look, replace `static/icon-192.png` and `static/icon-512.png` with your own branded icons.

### Lyrics:
Lyrics are fetched from **lrclib.net** (free, no API key needed). Not all songs have lyrics available. The system cleans common suffixes like "(Official Video)" from titles before searching.

### Share Playlist:
Uses base64-encoded data in the URL (no backend changes needed). Shared links work as long as the recipient has an account and is logged in. The playlist data is loaded into their queue.
