# SonicFlow v2.2 — Personal YouTube Music Player

A self-hosted YouTube music player built with PHP, MySQL, and the YouTube IFrame API. Search, queue, playlist management, lyrics, and more — all from your own server.

## Features

### Player Controls
- **Play / Pause / Next / Previous** with on-screen buttons or keyboard
- **Shuffle mode** — randomizes next track (`S` key)
- **Repeat modes** — off / repeat all / repeat one (`R` key)
- **Sleep timer** — auto-stop after 5/15/30/45/60/90 minutes
- **Draggable progress bar** — click or drag to seek anywhere in the track
- **Volume slider** with keyboard control (↑/↓ arrows)
- **Media Session API** — lock screen / OS notification controls (play, pause, next, prev, seek) with track artwork

### Search
- **Multi-source search** — tries Invidious → Piped → YouTube Data API (automatic fallback)
- **Debounced live suggestions** — history-based dropdown as you type
- **Search history** — stored locally, shown as dashboard chips
- **Infinite scroll** — loads more results automatically
- **Quick focus** — `Ctrl+K` / `Cmd+K` to focus search from anywhere
- **Clear button** — X icon appears when search field has text

### Queue
- **Drag & drop reorder** — grab the handle to rearrange
- **Play Next** — insert a track right after the current one
- **Auto-scroll** — queue scrolls to the active track
- **Duplicate prevention** — won't add the same track twice
- **Persistence** — queue, volume, shuffle, and repeat mode survive page refresh (localStorage)

### Playlists
- **Create / delete** playlists with track limits
- **Cover art** — auto-generated grid from first 4 track thumbnails
- **Export** — download as JSON file
- **Import** — upload a JSON file to recreate a playlist
- **Share** — copies a URL with playlist data encoded (no backend needed)

### Lyrics
- **Lyrics panel** — slides in from the right, auto-fetches from lrclib.net
- Toggle with button or `L` key
- Cleans "(Official Video)" and similar suffixes for better search accuracy

### UI/UX
- **Dark / Light theme** — toggle with button in header, saved to localStorage
- **Dynamic color theming** — ambient background glow shifts hue per track
- **Toast notifications** — elegant slide-in toasts (no native `alert()` / `confirm()`)
- **Mobile bottom sheet** — queue/playlists slide up on mobile
- **Image fallbacks** — broken thumbnails gracefully fade instead of showing broken icons
- **PWA support** — installable as app on phone/desktop

### Dashboard
- **Recent searches** — clickable chips for quick re-search
- **Recently played** — cards from your play history
- **For You** — personalized recommendations based on search history
- **More From Your Artists** — discover new tracks from artists you listen to

### Keyboard Shortcuts

| Key       | Action              |
| --------- | ------------------- |
| Space     | Play / Pause        |
| Shift+→   | Next track          |
| Shift+←   | Previous track      |
| →         | Seek +10s           |
| ←         | Seek -10s           |
| ↑         | Volume up           |
| ↓         | Volume down         |
| S         | Toggle shuffle      |
| R         | Toggle repeat       |
| L         | Toggle lyrics       |
| M         | Mute / Unmute       |
| Ctrl+K    | Focus search        |
| ?         | Show shortcuts      |
| Esc       | Close modals        |

---

## Requirements

- PHP 7.4+ with PDO MySQL
- MySQL 5.7+ / MariaDB 10.3+
- Apache with `mod_rewrite` (XAMPP works great)
- A YouTube Data API v3 key (optional — search works without it via Invidious/Piped)

## Installation

### 1. Database Setup

Create a MySQL database called `sonic` and import the schema:

```bash
mysql -u root -p sonic < sonic.sql
```

### 2. Configure Database

Edit `config/database.php` with your credentials:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'sonic');
define('DB_USER', 'root');
define('DB_PASS', '');
define('BASE_PATH', '/projects/sonicflow');
```

### 3. File Structure

```
sonicflow/
├── api/
│   ├── history.php        # Play history CRUD
│   ├── playlists.php      # Playlist CRUD
│   ├── settings.php       # API key management
│   └── tracks.php         # Track CRUD
├── config/
│   └── database.php       # DB connection & constants
├── includes/
│   └── auth.php           # Auth, CSRF, rate limiting
├── static/
│   ├── css/style.css      # All styles (dark + light themes)
│   ├── js/player.js       # Player logic (~2300 lines)
│   ├── icon-192.png       # PWA icon
│   └── icon-512.png       # PWA icon
├── .htaccess              # Security headers & rewrites
├── index.php              # Redirect to login/player
├── login.php              # Login page
├── register.php           # Registration page
├── logout.php             # Session logout
├── player.php             # Main player UI
├── manifest.json          # PWA manifest
├── sw.js                  # Service worker
└── sonic.sql              # Database schema
```

### 4. API Key (Optional)

Search works out of the box via free Invidious/Piped instances. For reliable fallback, add a YouTube Data API v3 key:

1. Get a key from [Google Cloud Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com)
2. Log in as admin
3. Click the key icon in the header
4. Paste and save

### 5. Admin Access

Promote a user to admin via MySQL:

```sql
UPDATE sf_users SET role = 'admin' WHERE username = 'yourname';
```

---

## Security

- CSRF token protection on all state-changing API requests
- Bcrypt password hashing
- Rate limiting on login (5 attempts per 15 minutes)
- Prepared statements (PDO) — no SQL injection
- XSS protection via output escaping (`htmlspecialchars`, `sfEsc`, `sfAttr`)
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`
- Config/includes directories blocked via `.htaccess`

## Notes

- **Equalizer** — not possible; YouTube's iframe API doesn't expose the audio stream
- **Lyrics** — fetched from lrclib.net (free, no API key). Not all songs available
- **Shared playlists** — base64-encoded in URL, no backend changes needed. Recipients must be logged in
- **PWA icons** — replace `static/icon-192.png` and `static/icon-512.png` with your own branding
