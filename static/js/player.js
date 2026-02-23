// ═══════════════════════════════════════════════════════
// SONICFLOW PLAYER v2.1 — Quota-Free Edition
// ═══════════════════════════════════════════════════════

// ─── State ───
let sfPlayer,
  sfReady = false;
let sfQueue = [],
  sfQIdx = -1;
let sfPlaylists = [];
let sfProgressTimer;
let sfView = "grid";
let sfSearchCache = [];
let sfPlModalTrack = null;
let sfIsPlaying = false;

// Playback modes
let sfShuffleOn = false;
let sfRepeatMode = "none"; // 'none' | 'all' | 'one'

// Sleep timer
let sfSleepTimeout = null;
let sfSleepCountdown = null;
let sfSleepSecondsLeft = 0;

// Search / infinite scroll
let sfNextPageToken = null;
let sfCurrentQuery = "";
let sfSearchLoading = false;
let sfInvPage = 1;

// Lyrics
let sfLyricsVisible = false;
let sfCurrentLyrics = null;

// Drag & drop
let sfDragSrcIdx = null;

// Mobile sheet
let sfSheetOpen = false;

// ─── Invidious/Piped Search (No API Key, No Quota) ───
const SF_INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://invidious.jing.rocks",
  "https://iv.datura.network",
  "https://invidious.privacyredirect.com",
];
const SF_PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://api.piped.yt",
];

async function sfInvidiousSearch(query, maxResults = 20) {
  // Try Invidious instances first
  for (const base of SF_INVIDIOUS_INSTANCES) {
    try {
      const r = await fetch(
        base +
          "/api/v1/search?q=" +
          encodeURIComponent(query) +
          "&type=video&sort_by=relevance&page=" +
          sfInvPage,
        { signal: AbortSignal.timeout(6000) },
      );
      if (!r.ok) continue;
      const items = await r.json();
      if (!Array.isArray(items) || !items.length) continue;
      return items
        .filter((i) => i.type === "video")
        .slice(0, maxResults)
        .map((i) => ({
          v: i.videoId,
          t: sfEsc(i.title || ""),
          c: sfEsc(i.author || ""),
          th:
            i.videoThumbnails && i.videoThumbnails.length
              ? i.videoThumbnails.find((t) => t.quality === "default")?.url ||
                i.videoThumbnails[0].url ||
                ""
              : "",
          thHQ:
            i.videoThumbnails && i.videoThumbnails.length
              ? i.videoThumbnails.find((t) => t.quality === "medium")?.url ||
                i.videoThumbnails[0].url ||
                ""
              : "",
        }));
    } catch (e) {
      continue;
    }
  }
  // Fallback: try Piped instances (still free, no quota)
  for (const base of SF_PIPED_INSTANCES) {
    try {
      const r = await fetch(
        base + "/search?q=" + encodeURIComponent(query) + "&filter=videos",
        { signal: AbortSignal.timeout(6000) },
      );
      if (!r.ok) continue;
      const d = await r.json();
      if (!d.items?.length) continue;
      return d.items
        .filter((i) => i.url)
        .slice(0, maxResults)
        .map((i) => {
          const vid = (i.url || "").replace("/watch?v=", "");
          return {
            v: vid,
            t: sfEsc(i.title || ""),
            c: sfEsc(i.uploaderName || i.uploader || ""),
            th: "https://i.ytimg.com/vi/" + vid + "/default.jpg",
            thHQ:
              i.thumbnail || "https://i.ytimg.com/vi/" + vid + "/mqdefault.jpg",
          };
        });
    } catch (e) {
      continue;
    }
  }
  // NO YouTube API fallback — quota protection
  return [];
}

// ─── Helpers ───
const sfEl = (id) => document.getElementById(id);
const sfH = () => ({
  "Content-Type": "application/json",
  "X-CSRF-Token": SF_CSRF,
});

function sfEsc(s) {
  if (!s) return "";
  const div = document.createElement("div");
  div.textContent = s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return div.innerHTML;
}

function sfFmt(s) {
  if (!s || isNaN(s)) return "0:00";
  return Math.floor(s / 60) + ":" + (Math.floor(s % 60) + "").padStart(2, "0");
}

// Safe attribute escaper for onclick handlers
function sfAttr(s) {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&#39;")
    .replace(/"/g, "&quot;")
    .replace(/`/g, "&#96;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ═══════════════════════════════════
//  TOAST NOTIFICATION SYSTEM
// ═══════════════════════════════════
function sfToast(msg, type = "info", duration = 3000) {
  const container = sfEl("sfToastWrap");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "sf-toast sf-toast--" + type;

  const icons = {
    success:
      '<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    error:
      '<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>',
    info: '<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>',
    warn: '<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/></svg>',
  };

  toast.innerHTML = (icons[type] || icons.info) + "<span>" + msg + "</span>";
  container.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add("sf-toast--visible");
    });
  });

  setTimeout(() => {
    toast.classList.remove("sf-toast--visible");
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 300);
  }, duration);
}

// ═══════════════════════════════════
//  TOAST-BASED CONFIRM (replaces native confirm())
// ═══════════════════════════════════
function sfConfirm(msg) {
  return new Promise((resolve) => {
    const container = sfEl("sfToastWrap");
    if (!container) {
      resolve(false);
      return;
    }
    const toast = document.createElement("div");
    toast.className = "sf-toast sf-toast--warn sf-toast--confirm";
    toast.innerHTML =
      '<svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/></svg>' +
      "<div class='sf-confirm-body'><span>" +
      msg +
      "</span>" +
      "<div class='sf-confirm-actions'>" +
      "<button class='sf-confirm-yes'>Yes</button>" +
      "<button class='sf-confirm-no'>Cancel</button>" +
      "</div></div>";

    toast.querySelector(".sf-confirm-yes").onclick = () => {
      toast.classList.remove("sf-toast--visible");
      setTimeout(() => toast.remove(), 300);
      resolve(true);
    };
    toast.querySelector(".sf-confirm-no").onclick = () => {
      toast.classList.remove("sf-toast--visible");
      setTimeout(() => toast.remove(), 300);
      resolve(false);
    };

    container.appendChild(toast);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add("sf-toast--visible"));
    });
  });
}

// ═══════════════════════════════════
//  YOUTUBE IFRAME API
// ═══════════════════════════════════
const sfScriptTag = document.createElement("script");
sfScriptTag.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(sfScriptTag);

function onYouTubeIframeAPIReady() {
  sfPlayer = new YT.Player("ytp", {
    width: 200,
    height: 200,
    playerVars: {
      autoplay: 1,
      controls: 0,
      playsinline: 1,
      rel: 0,
      modestbranding: 1,
    },
    events: {
      onReady: () => {
        sfReady = true;
        sfPlayer.setVolume(80);
      },
      onStateChange: (e) => {
        const st = e.data;
        if (st === 1) {
          sfIsPlaying = true;
          sfShowPause(true);
          sfStartProgressTimer();
          sfEl("sfDisc").classList.add("vinyl-spinning");
          sfEl("sfPPBtn").classList.add("playing-pulse");
          sfUpdateNowPlaying(true);
        } else if (st === 2) {
          sfIsPlaying = false;
          sfShowPause(false);
          sfStopProgressTimer();
          sfEl("sfDisc").classList.remove("vinyl-spinning");
          sfEl("sfPPBtn").classList.remove("playing-pulse");
          sfUpdateNowPlaying(false);
        } else if (st === 0) {
          sfIsPlaying = false;
          sfShowPause(false);
          sfStopProgressTimer();
          sfEl("sfDisc").classList.remove("vinyl-spinning");
          sfEl("sfPPBtn").classList.remove("playing-pulse");
          sfUpdateNowPlaying(false);
          sfAutoNext();
        }
      },
      onError: (e) => {
        const reasons = {
          2: "Invalid video",
          5: "Player error",
          100: "Video not found",
          101: "Playback restricted",
          150: "Playback restricted",
        };
        const msg = reasons[e.data] || "Can't play this track";
        sfToast(msg + " — skipping...", "warn");
        sfIsPlaying = false;
        sfShowPause(false);
        sfStopProgressTimer();
        sfEl("sfDisc").classList.remove("vinyl-spinning");
        sfEl("sfPPBtn").classList.remove("playing-pulse");
        sfUpdateNowPlaying(false);
        setTimeout(sfAutoNext, 1500);
      },
    },
  });
}

// ═══════════════════════════════════
//  ADMIN: SAVE API KEY
// ═══════════════════════════════════
async function sfAdminSaveKey() {
  const k = sfEl("adminKeyIn").value.trim();
  const msgEl = sfEl("adminKeyMsg");
  try {
    const r = await fetch(SF_BASE + "/api/settings.php", {
      method: "POST",
      headers: sfH(),
      body: JSON.stringify({ key: "yt_api_key", value: k }),
    });
    const d = await r.json();
    if (d.ok) {
      msgEl.className =
        "text-xs p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      msgEl.textContent =
        "API key saved! (Used only for IFrame player, not search)";
      msgEl.classList.remove("hidden");
      const banner = sfEl("noKeyBanner");
      if (banner) banner.remove();
      sfToast("API key saved", "success");
    } else throw new Error(d.error);
  } catch (e) {
    msgEl.className =
      "text-xs p-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20";
    msgEl.textContent = "Error: " + e.message;
    msgEl.classList.remove("hidden");
    sfToast("Failed to save API key", "error");
  }
}

// ═══════════════════════════════════
//  SEARCH (Debounce + History + Infinite Scroll)
// ═══════════════════════════════════
let sfDebounceTimer = null;

function sfInitSearch() {
  const input = sfEl("sfSearchIn");
  if (!input) return;

  input.addEventListener("input", () => {
    clearTimeout(sfDebounceTimer);
    const q = input.value.trim();
    if (q.length < 2) {
      sfHideSuggestions();
      return;
    }
    sfDebounceTimer = setTimeout(() => sfShowSuggestions(q), 300);
  });

  input.addEventListener("focus", () => {
    const q = input.value.trim();
    if (q.length >= 2) sfShowSuggestions(q);
    else sfShowRecentSearches();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sfHideSuggestions();
      sfDoSearch();
    }
    if (e.key === "Escape") sfHideSuggestions();
  });

  document.addEventListener("click", (e) => {
    const wrap = sfEl("sfSearchWrap");
    if (wrap && !wrap.contains(e.target)) sfHideSuggestions();
  });
}

function sfShowSuggestions(q) {
  const dd = sfEl("sfSuggestDrop");
  if (!dd) return;
  const hist = sfGetSearchHistory()
    .filter((h) => h.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 5);
  if (!hist.length) {
    sfHideSuggestions();
    return;
  }

  dd.innerHTML = hist
    .map(
      (h) =>
        "<button class=\"sf-suggest-item\" onclick=\"sfEl('sfSearchIn').value='" +
        sfAttr(h) +
        "';sfHideSuggestions();sfDoSearch()\">" +
        '<svg class="w-3.5 h-3.5 text-white/20 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
        '<span class="truncate">' +
        sfEsc(h) +
        "</span></button>",
    )
    .join("");
  dd.classList.remove("hidden");
}

function sfShowRecentSearches() {
  const dd = sfEl("sfSuggestDrop");
  if (!dd) return;
  const hist = sfGetSearchHistory().slice(0, 8);
  if (!hist.length) return;

  dd.innerHTML =
    '<div class="flex items-center justify-between px-3 py-1.5"><span class="text-[10px] text-white/20 uppercase tracking-wider font-medium">Recent Searches</span><button onclick="sfClearSearchHistory()" class="text-[10px] text-white/20 hover:text-red-400 transition-colors">Clear</button></div>' +
    hist
      .map(
        (h) =>
          "<button class=\"sf-suggest-item\" onclick=\"sfEl('sfSearchIn').value='" +
          sfAttr(h) +
          "';sfHideSuggestions();sfDoSearch()\">" +
          '<svg class="w-3.5 h-3.5 text-white/20 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>' +
          '<span class="truncate">' +
          sfEsc(h) +
          "</span></button>",
      )
      .join("");
  dd.classList.remove("hidden");
}

function sfHideSuggestions() {
  const dd = sfEl("sfSuggestDrop");
  if (dd) dd.classList.add("hidden");
}

function sfGetSearchHistory() {
  try {
    return JSON.parse(localStorage.getItem("sf_search_hist") || "[]");
  } catch {
    return [];
  }
}

function sfSaveSearchTerm(q) {
  let hist = sfGetSearchHistory().filter((h) => h !== q);
  hist.unshift(q);
  hist = hist.slice(0, 30);
  try {
    localStorage.setItem("sf_search_hist", JSON.stringify(hist));
  } catch {}
}

function sfClearSearchHistory() {
  try {
    localStorage.removeItem("sf_search_hist");
  } catch {}
  sfHideSuggestions();
  sfToast("Search history cleared", "info");
  const sec = sfEl("sfRecentSearchSec");
  if (sec) sec.classList.add("hidden");
}

async function sfDoSearch() {
  const q = sfEl("sfSearchIn").value.trim();
  if (!q) return;

  sfHideSuggestions();
  sfSaveSearchTerm(q);
  sfCurrentQuery = q;
  sfInvPage = 1;
  sfSearchCache = [];
  sfShowSearchView();

  const el = sfEl("sfResults");
  el.innerHTML =
    '<div class="flex items-center justify-center py-20"><div class="sf-spinner mx-auto"></div></div>';

  try {
    const results = await sfInvidiousSearch(q + " music", 20);
    if (!results.length) {
      el.innerHTML =
        '<div class="flex flex-col items-center justify-center py-20"><p class="text-white/20 text-sm">No results found</p><p class="text-white/10 text-xs mt-1">Try different keywords or check your connection</p></div>';
      return;
    }

    sfSearchCache = results;
    sfNextPageToken = "more";
    sfEl("sfResCount").textContent = sfSearchCache.length + " results";
    sfRenderResults();
  } catch (err) {
    el.innerHTML =
      '<div class="flex items-center justify-center py-20 text-red-400/60 text-sm">' +
      sfEsc(err.message) +
      "</div>";
  }
}

async function sfLoadMoreResults() {
  if (sfSearchLoading || !sfNextPageToken || !sfCurrentQuery) return;
  sfSearchLoading = true;

  const loader = sfEl("sfLoadMore");
  if (loader)
    loader.innerHTML =
      '<div class="sf-spinner mx-auto" style="width:20px;height:20px;border-width:2px"></div>';

  try {
    sfInvPage++;
    const newItems = await sfInvidiousSearch(sfCurrentQuery + " music", 20);
    if (!newItems.length) {
      sfNextPageToken = null;
    } else {
      const existingIds = new Set(sfSearchCache.map((i) => i.v));
      const unique = newItems.filter((i) => !existingIds.has(i.v));
      if (!unique.length) sfNextPageToken = null;
      else {
        sfSearchCache = sfSearchCache.concat(unique);
        // Cap at 100 to prevent memory bloat
        if (sfSearchCache.length >= 100) sfNextPageToken = null;
      }
    }
    sfEl("sfResCount").textContent = sfSearchCache.length + " results";
    sfRenderResults();
  } catch (e) {
    sfToast("Failed to load more results", "error");
  }
  sfSearchLoading = false;
}

// Infinite scroll observer
let sfScrollObserver = null;
function sfSetupInfiniteScroll() {
  if (sfScrollObserver) sfScrollObserver.disconnect();
  const sentinel = sfEl("sfLoadMore");
  if (!sentinel || !sfNextPageToken) return;

  sfScrollObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) sfLoadMoreResults();
    },
    { rootMargin: "200px" },
  );
  sfScrollObserver.observe(sentinel);
}

// ═══════════════════════════════════
//  VIEW TOGGLE
// ═══════════════════════════════════
function sfSetView(v) {
  sfView = v;
  sfEl("sfViewGrid").className =
    "p-1.5 rounded transition-all " +
    (v === "grid"
      ? "text-accent-400 bg-accent-500/10"
      : "text-white/30 hover:text-white/50");
  sfEl("sfViewList").className =
    "p-1.5 rounded transition-all " +
    (v === "list"
      ? "text-accent-400 bg-accent-500/10"
      : "text-white/30 hover:text-white/50");
  if (sfSearchCache.length) sfRenderResults();
}

// ═══════════════════════════════════
//  SAFE HTML BUILDERS
// ═══════════════════════════════════
function sfBuildCardHTML(v, t, c, th, thHQ) {
  var sv = sfAttr(v),
    st = sfAttr(t),
    sc = sfAttr(c),
    sth = sfAttr(th);
  var displayT = sfEsc(t),
    displayC = sfEsc(c);
  if (!thHQ) thHQ = th;
  var sthHQ = sfAttr(thHQ);

  return (
    '<div class="sf-card" onclick="sfPlayNow(\'' +
    sv +
    "','" +
    st +
    "','" +
    sc +
    "','" +
    sth +
    "')\">" +
    '<img src="' +
    sfAttr(thHQ) +
    '" class="sf-card-thumb" loading="lazy" alt="">' +
    '<div class="sf-card-body">' +
    '<p class="text-[13px] font-medium text-white/80 leading-snug line-clamp-2 mb-1">' +
    displayT +
    "</p>" +
    '<p class="text-[11px] text-white/25 truncate">' +
    displayC +
    "</p>" +
    '<div class="sf-card-actions flex gap-1.5 mt-2.5">' +
    "<button onclick=\"event.stopPropagation();sfPlayNow('" +
    sv +
    "','" +
    st +
    "','" +
    sc +
    "','" +
    sth +
    '\')" class="flex-1 flex items-center justify-center gap-1.5 bg-accent-500/15 text-accent-400 text-[11px] font-medium py-1.5 rounded-lg hover:bg-accent-500/25 transition-all">' +
    '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Play</button>' +
    "<button onclick=\"event.stopPropagation();sfAddQ('" +
    sv +
    "','" +
    st +
    "','" +
    sc +
    "','" +
    sth +
    '\')" class="w-8 h-8 flex items-center justify-center bg-white/5 text-white/30 rounded-lg hover:text-cyan-400 hover:bg-cyan-500/10 transition-all" title="Add to queue">' +
    '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14"/></svg></button>' +
    "<button onclick=\"event.stopPropagation();sfShowPlModal('" +
    sv +
    "','" +
    st +
    "','" +
    sc +
    "','" +
    sth +
    '\')" class="w-8 h-8 flex items-center justify-center bg-white/5 text-white/30 rounded-lg hover:text-accent-400 hover:bg-accent-500/10 transition-all" title="Add to playlist">' +
    '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>' +
    "</div></div></div>"
  );
}

function sfBuildRowHTML(v, t, c, th) {
  var sv = sfAttr(v),
    st = sfAttr(t),
    sc = sfAttr(c),
    sth = sfAttr(th);
  var displayT = sfEsc(t),
    displayC = sfEsc(c);

  return (
    '<div class="sf-row" onclick="sfPlayNow(\'' +
    sv +
    "','" +
    st +
    "','" +
    sc +
    "','" +
    sth +
    "')\">" +
    '<img src="' +
    sfAttr(th) +
    '" class="w-11 h-11 rounded-lg object-cover border border-white/5 flex-shrink-0" loading="lazy">' +
    '<div class="min-w-0 flex-1">' +
    '<p class="text-sm text-white/80 truncate">' +
    displayT +
    "</p>" +
    '<p class="text-[11px] text-white/25 truncate">' +
    displayC +
    "</p></div>" +
    '<div class="sf-row-actions flex gap-1">' +
    "<button onclick=\"event.stopPropagation();sfAddQ('" +
    sv +
    "','" +
    st +
    "','" +
    sc +
    "','" +
    sth +
    '\')" class="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all" title="Queue">' +
    '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14"/></svg></button>' +
    "<button onclick=\"event.stopPropagation();sfShowPlModal('" +
    sv +
    "','" +
    st +
    "','" +
    sc +
    "','" +
    sth +
    '\')" class="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/30 hover:text-accent-400 hover:bg-accent-500/10 transition-all" title="Playlist">' +
    '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>' +
    "</div></div>"
  );
}

// ═══════════════════════════════════
//  RENDER RESULTS
// ═══════════════════════════════════
function sfRenderResults() {
  const el = sfEl("sfResults");
  let html = "";

  if (sfView === "grid") {
    html =
      '<div class="sf-grid">' +
      sfSearchCache
        .map((r) => sfBuildCardHTML(r.v, r.t, r.c, r.th, r.thHQ))
        .join("") +
      "</div>";
  } else {
    html =
      '<div class="space-y-1">' +
      sfSearchCache.map((r) => sfBuildRowHTML(r.v, r.t, r.c, r.th)).join("") +
      "</div>";
  }

  html += '<div class="flex items-center justify-center gap-3 mt-4 mb-2">';
  html +=
    '<button onclick="sfAddAllToQueue()" class="sf-btn-subtle"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14"/></svg>Add All to Queue</button>';
  html += "</div>";
  if (sfNextPageToken) {
    html +=
      '<div id="sfLoadMore" class="flex justify-center py-4"><button onclick="sfLoadMoreResults()" class="sf-btn-subtle">Load More</button></div>';
  }

  el.innerHTML = html;
  sfSetupInfiniteScroll();
}

function sfAddAllToQueue() {
  if (!sfSearchCache.length) return;
  let added = 0;
  sfSearchCache.forEach((r) => {
    if (!sfQueue.some((x) => x.v === r.v)) {
      sfQueue.push({ v: r.v, t: r.t, c: r.c, th: r.th });
      added++;
    }
  });
  sfRenderQ();
  sfToast(added + " tracks added to queue", "success");
}

// ═══════════════════════════════════
//  QUEUE (with Drag & Drop)
// ═══════════════════════════════════
function sfAddQ(v, t, c, th) {
  // Decode HTML entities back for storage
  t = sfDecodeAttr(t);
  c = sfDecodeAttr(c);
  th = sfDecodeAttr(th);
  if (sfQueue.some((x) => x.v === v)) {
    sfToast("Already in queue", "info");
    return;
  }
  sfQueue.push({ v, t, c, th });
  sfRenderQ();
  sfToast("Added to queue", "success");
}

function sfDecodeAttr(s) {
  if (!s) return "";
  var ta = document.createElement("textarea");
  ta.innerHTML = s;
  return ta.value;
}

function sfPlayNow(v, t, c, th) {
  t = sfDecodeAttr(t);
  c = sfDecodeAttr(c);
  th = sfDecodeAttr(th);
  const i = sfQueue.findIndex((x) => x.v === v);
  if (i >= 0) sfQIdx = i;
  else {
    sfQueue.push({ v, t, c, th });
    sfQIdx = sfQueue.length - 1;
  }
  sfRenderQ();
  sfLoadTrack(sfQIdx);
}

function sfLoadTrack(i) {
  if (!sfReady || i < 0 || i >= sfQueue.length) return;
  sfQIdx = i;
  const tr = sfQueue[i];
  sfPlayer.loadVideoById({ videoId: tr.v, startSeconds: 0 });
  sfEl("sfTitle").textContent = tr.t;
  sfEl("sfArtist").textContent = tr.c;
  sfRenderQ();
  sfShowNowPlaying(tr);
  sfRecordHistory(tr.v, tr.t, tr.c, tr.th);
  sfApplyDynamicTheme(tr.v);
  sfCurrentLyrics = null;
  if (sfLyricsVisible) sfFetchLyrics(tr.t, tr.c);
}

function sfClearQueue() {
  sfQueue = [];
  sfQIdx = -1;
  sfRenderQ();
  if (sfPlayer && sfReady) sfPlayer.stopVideo();
  sfEl("sfTitle").textContent = "No track selected";
  sfEl("sfArtist").textContent = "—";
  sfEl("sfProg").style.width = "0%";
  sfEl("sfThumb").style.left = "0%";
  sfEl("sfTime").textContent = "0:00 / 0:00";
  sfHideNowPlaying();
  sfShowPause(false);
  sfResetDynamicTheme();
}

function sfRemoveQ(i) {
  sfQueue.splice(i, 1);
  if (!sfQueue.length) {
    sfClearQueue();
    return;
  }
  if (i < sfQIdx) sfQIdx--;
  else if (i === sfQIdx) {
    sfQIdx = Math.min(sfQIdx, sfQueue.length - 1);
    sfLoadTrack(sfQIdx);
  }
  sfRenderQ();
}

function sfRenderQ() {
  const el = sfEl("sfQueueEl");
  sfEl("sfQCount").textContent =
    sfQueue.length + " track" + (sfQueue.length !== 1 ? "s" : "");
  if (!sfQueue.length) {
    el.className = "flex-1 overflow-y-auto sf-scroll space-y-1";
    el.innerHTML =
      '<div class="flex flex-col items-center justify-center h-full sf-empty-state">' +
      '<div class="sf-empty-icon sf-empty-icon--sm">' +
      '<svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/>' +
      "</svg></div>" +
      '<p class="text-xs text-white/15">Queue is empty</p></div>';
    return;
  }
  el.className = "flex-1 overflow-y-auto sf-scroll space-y-1";
  el.innerHTML = sfQueue
    .map(
      (x, i) =>
        '<div class="sf-queue-item ' +
        (i === sfQIdx ? "sf-queue-item--active" : "") +
        '" draggable="true" ondragstart="sfDragStart(event,' +
        i +
        ')" ondragover="sfDragOver(event,' +
        i +
        ')" ondragend="sfDragEnd(event)" onclick="sfLoadTrack(' +
        i +
        ')">' +
        '<span class="sf-queue-drag" title="Drag to reorder">' +
        '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 6h2v2H8zm6 0h2v2h-2zM8 11h2v2H8zm6 0h2v2h-2zM8 16h2v2H8zm6 0h2v2h-2z"/></svg></span>' +
        '<span class="sf-queue-num ' +
        (i === sfQIdx ? "sf-queue-num--active" : "") +
        '">' +
        (i === sfQIdx
          ? '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'
          : i + 1) +
        "</span>" +
        '<img src="' +
        sfAttr(x.th) +
        '" class="sf-queue-thumb">' +
        '<div class="min-w-0 flex-1">' +
        '<p class="sf-queue-title ' +
        (i === sfQIdx ? "sf-queue-title--active" : "") +
        '">' +
        sfEsc(x.t) +
        "</p>" +
        '<p class="sf-queue-artist">' +
        sfEsc(x.c) +
        "</p></div>" +
        '<button onclick="event.stopPropagation();sfRemoveQ(' +
        i +
        ')" class="sf-queue-remove" title="Remove">' +
        '<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>' +
        "</button></div>",
    )
    .join("");
}

// Drag & Drop
function sfDragStart(e, i) {
  sfDragSrcIdx = i;
  e.dataTransfer.effectAllowed = "move";
  e.currentTarget.classList.add("sf-queue-item--dragging");
}
function sfDragOver(e, i) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  if (sfDragSrcIdx === null || sfDragSrcIdx === i) return;
  const item = sfQueue.splice(sfDragSrcIdx, 1)[0];
  sfQueue.splice(i, 0, item);
  if (sfQIdx === sfDragSrcIdx) sfQIdx = i;
  else if (sfDragSrcIdx < sfQIdx && i >= sfQIdx) sfQIdx--;
  else if (sfDragSrcIdx > sfQIdx && i <= sfQIdx) sfQIdx++;
  sfDragSrcIdx = i;
  sfRenderQ();
}
function sfDragEnd(e) {
  sfDragSrcIdx = null;
  document
    .querySelectorAll(".sf-queue-item--dragging")
    .forEach((el) => el.classList.remove("sf-queue-item--dragging"));
}

// ═══════════════════════════════════
//  PLAYBACK
// ═══════════════════════════════════
function sfToggle() {
  if (!sfReady) return;
  const s = sfPlayer.getPlayerState();
  if (s === 1) sfPlayer.pauseVideo();
  else if (s === 2 || s === 5) sfPlayer.playVideo();
  else if (s === -1 && sfQIdx >= 0) sfLoadTrack(sfQIdx);
}

function sfAutoNext() {
  if (sfRepeatMode === "one") {
    sfLoadTrack(sfQIdx);
    return;
  }
  if (sfShuffleOn && sfQueue.length > 1) {
    let next;
    do {
      next = Math.floor(Math.random() * sfQueue.length);
    } while (next === sfQIdx);
    sfLoadTrack(next);
    return;
  }
  if (sfQIdx < sfQueue.length - 1) sfLoadTrack(sfQIdx + 1);
  else if (sfRepeatMode === "all" && sfQueue.length > 0) sfLoadTrack(0);
}

function sfNext() {
  if (sfShuffleOn && sfQueue.length > 1) {
    let next;
    do {
      next = Math.floor(Math.random() * sfQueue.length);
    } while (next === sfQIdx);
    sfLoadTrack(next);
    return;
  }
  if (sfQIdx < sfQueue.length - 1) sfLoadTrack(sfQIdx + 1);
  else if (sfRepeatMode === "all" && sfQueue.length > 0) sfLoadTrack(0);
}

function sfPrev() {
  if (!sfReady) return;
  if (sfPlayer.getCurrentTime() > 3) sfPlayer.seekTo(0, true);
  else if (sfQIdx > 0) sfLoadTrack(sfQIdx - 1);
  else if (sfRepeatMode === "all" && sfQueue.length > 0)
    sfLoadTrack(sfQueue.length - 1);
}

function sfShowPause(p) {
  sfEl("sfIcoPlay").classList.toggle("hidden", p);
  sfEl("sfIcoPause").classList.toggle("hidden", !p);
}

function sfToggleShuffle() {
  sfShuffleOn = !sfShuffleOn;
  const btn = sfEl("sfShuffleBtn");
  if (btn) btn.classList.toggle("sf-ctrl-btn--active", sfShuffleOn);
  sfToast(sfShuffleOn ? "Shuffle on" : "Shuffle off", "info");
}

function sfToggleRepeat() {
  const modes = ["none", "all", "one"];
  const labels = ["Repeat off", "Repeat all", "Repeat one"];
  sfRepeatMode = modes[(modes.indexOf(sfRepeatMode) + 1) % 3];
  const btn = sfEl("sfRepeatBtn");
  const ico = sfEl("sfRepeatIco");
  if (btn) {
    btn.classList.toggle("sf-ctrl-btn--active", sfRepeatMode !== "none");
    btn.classList.toggle("sf-ctrl-btn--one", sfRepeatMode === "one");
  }
  if (ico) ico.setAttribute("data-mode", sfRepeatMode);
  sfToast(labels[modes.indexOf(sfRepeatMode)], "info");
}

// Progress
function sfStartProgressTimer() {
  sfStopProgressTimer();
  sfProgressTimer = setInterval(() => {
    const c = sfPlayer.getCurrentTime() || 0,
      d = sfPlayer.getDuration() || 0;
    if (d) {
      const p = (c / d) * 100 + "%";
      sfEl("sfProg").style.width = p;
      sfEl("sfThumb").style.left = p;
      sfEl("sfTime").textContent = sfFmt(c) + " / " + sfFmt(d);
    }
  }, 400);
}
function sfStopProgressTimer() {
  clearInterval(sfProgressTimer);
}
function sfSeek(e) {
  if (!sfReady) return;
  const r = e.currentTarget.getBoundingClientRect();
  sfPlayer.seekTo(
    ((e.clientX - r.left) / r.width) * sfPlayer.getDuration(),
    true,
  );
}

// ═══════════════════════════════════
//  TABS
// ═══════════════════════════════════
function sfSwitchTab(tab) {
  const isQ = tab === "queue";
  sfEl("sfPanelQ").classList.toggle("hidden", !isQ);
  sfEl("sfPanelPl").classList.toggle("hidden", isQ);
  sfEl("sfTabQ").classList.toggle("sf-sidebar-tab--active", isQ);
  sfEl("sfTabPl").classList.toggle("sf-sidebar-tab--active", !isQ);
  if (!isQ) sfLoadPl();
}

// ═══════════════════════════════════
//  PLAYLISTS
// ═══════════════════════════════════
async function sfLoadPl() {
  try {
    const r = await fetch(SF_BASE + "/api/playlists.php");
    if (!r.ok) throw new Error("Failed to load");
    sfPlaylists = await r.json();
    sfRenderPl();
  } catch (e) {
    sfEl("sfPlEl").innerHTML =
      '<div class="text-center text-xs text-red-400/50 py-4">Failed to load playlists</div>';
  }
}

function sfToggleAccordion(id) {
  const el = document.getElementById("sfAcc_" + id);
  if (!el) return;
  const wasOpen = el.classList.contains("sf-accordion--open");
  document
    .querySelectorAll(".sf-accordion--open")
    .forEach((a) => a.classList.remove("sf-accordion--open"));
  if (!wasOpen) el.classList.add("sf-accordion--open");
}

function sfGenCoverArt(tracks) {
  if (!tracks.length)
    return '<div class="sf-pl-cover sf-pl-cover--empty"><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"/></svg></div>';
  const thumbs = tracks.slice(0, 4).map((t) => {
    const url = (t.thumbnail || "")
      .replace("default.jpg", "mqdefault.jpg")
      .replace("/default.", "/mqdefault.");
    return (
      '<img src="' + sfAttr(url) + '" class="sf-pl-cover-img" loading="lazy">'
    );
  });
  const count = thumbs.length;
  return (
    '<div class="sf-pl-cover sf-pl-cover--' +
    (count >= 4 ? "4" : count) +
    '">' +
    thumbs.join("") +
    "</div>"
  );
}

function sfRenderPl() {
  const el = sfEl("sfPlEl");
  if (!sfPlaylists.length) {
    el.className = "flex-1 overflow-y-auto sf-scroll space-y-1.5";
    el.innerHTML =
      '<div class="flex flex-col items-center justify-center h-full sf-empty-state">' +
      '<div class="sf-empty-icon sf-empty-icon--sm"><svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"/></svg></div>' +
      '<p class="text-xs text-white/15">No playlists yet</p></div>';
    return;
  }
  el.className = "flex-1 overflow-y-auto sf-scroll space-y-1.5";
  el.innerHTML = sfPlaylists
    .map(
      (pl, idx) =>
        '<div id="sfAcc_' +
        pl.id +
        '" class="sf-accordion ' +
        (idx === 0 ? "sf-accordion--open" : "") +
        '">' +
        '<div class="sf-accordion-header" onclick="sfToggleAccordion(' +
        pl.id +
        ')">' +
        sfGenCoverArt(pl.tracks) +
        '<div class="sf-accordion-info">' +
        '<div class="sf-accordion-name">' +
        sfEsc(pl.name) +
        "</div>" +
        '<div class="sf-accordion-count">' +
        pl.tracks.length +
        " track" +
        (pl.tracks.length !== 1 ? "s" : "") +
        "</div></div>" +
        '<div class="sf-accordion-actions" onclick="event.stopPropagation()">' +
        '<button onclick="sfPlayAll(' +
        pl.id +
        ')" class="sf-accordion-action" title="Play all"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>' +
        '<button onclick="sfExportPlaylist(' +
        pl.id +
        ')" class="sf-accordion-action" title="Export"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg></button>' +
        '<button onclick="sfSharePlaylist(' +
        pl.id +
        ')" class="sf-accordion-action" title="Share"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"/></svg></button>' +
        '<button onclick="sfDeletePl(' +
        pl.id +
        ')" class="sf-accordion-action sf-accordion-action--danger" title="Delete"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg></button></div>' +
        '<svg class="sf-accordion-chevron" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg></div>' +
        '<div class="sf-accordion-body"><div class="sf-accordion-content">' +
        (pl.tracks.length
          ? pl.tracks
              .map(
                (tr, ti) =>
                  '<div class="sf-accordion-track" onclick="sfPlayNow(\'' +
                  sfAttr(tr.video_id) +
                  "','" +
                  sfAttr(tr.title) +
                  "','" +
                  sfAttr(tr.channel) +
                  "','" +
                  sfAttr(tr.thumbnail) +
                  "')\">" +
                  '<span class="sf-accordion-track-num">' +
                  (ti + 1) +
                  "</span>" +
                  '<img src="' +
                  sfAttr(tr.thumbnail) +
                  '" class="w-7 h-7 rounded object-cover border border-white/5 flex-shrink-0">' +
                  '<span class="sf-accordion-track-title">' +
                  sfEsc(tr.title) +
                  "</span>" +
                  '<button onclick="event.stopPropagation();sfRemoveTrack(' +
                  tr.id +
                  ')" class="sf-accordion-track-remove" title="Remove track">' +
                  '<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg></button></div>',
              )
              .join("")
          : '<div class="sf-accordion-empty">No tracks yet — search &amp; add some!</div>') +
        "</div></div></div>",
    )
    .join("");
}

async function sfCreatePl() {
  const name = sfEl("sfNewPl").value.trim();
  if (!name) return;
  try {
    const r = await fetch(SF_BASE + "/api/playlists.php", {
      method: "POST",
      headers: sfH(),
      body: JSON.stringify({ name }),
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error);
    sfEl("sfNewPl").value = "";
    sfLoadPl();
    sfToast('Playlist "' + sfEsc(name) + '" created', "success");
  } catch (e) {
    sfToast("Failed to create playlist: " + e.message, "error");
  }
}

async function sfDeletePl(id) {
  const ok = await sfConfirm("Delete this playlist?");
  if (!ok) return;
  try {
    await fetch(SF_BASE + "/api/playlists.php?id=" + id, {
      method: "DELETE",
      headers: sfH(),
    });
    sfLoadPl();
    sfToast("Playlist deleted", "info");
  } catch (e) {
    sfToast("Failed to delete playlist", "error");
  }
}

async function sfRemoveTrack(trackId) {
  try {
    await fetch(SF_BASE + "/api/tracks.php?id=" + trackId, {
      method: "DELETE",
      headers: sfH(),
    });
    sfLoadPl();
    sfToast("Track removed", "info");
  } catch (e) {
    sfToast("Failed to remove track", "error");
  }
}

function sfPlayAll(plId) {
  const pl = sfPlaylists.find((p) => p.id === plId);
  if (!pl || !pl.tracks.length) return;
  sfQueue = pl.tracks.map((t) => ({
    v: t.video_id,
    t: t.title,
    c: t.channel,
    th: t.thumbnail,
  }));
  sfQIdx = -1;
  sfRenderQ();
  sfLoadTrack(0);
  sfSwitchTab("queue");
  sfToast('Playing "' + sfEsc(pl.name) + '"', "success");
}

function sfExportPlaylist(plId) {
  const pl = sfPlaylists.find((p) => p.id === plId);
  if (!pl) return;
  const data = {
    name: pl.name,
    tracks: pl.tracks.map((t) => ({
      video_id: t.video_id,
      title: t.title,
      channel: t.channel,
      thumbnail: t.thumbnail,
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download =
    "sonicflow-" + pl.name.replace(/[^a-z0-9]/gi, "-").toLowerCase() + ".json";
  a.click();
  URL.revokeObjectURL(a.href);
  sfToast("Playlist exported", "success");
}

function sfImportPlaylist() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.name || !Array.isArray(data.tracks))
        throw new Error("Invalid format");

      const r = await fetch(SF_BASE + "/api/playlists.php", {
        method: "POST",
        headers: sfH(),
        body: JSON.stringify({ name: data.name }),
      });
      const pl = await r.json();
      if (pl.error) throw new Error(pl.error);

      for (const tr of data.tracks) {
        await fetch(SF_BASE + "/api/tracks.php", {
          method: "POST",
          headers: sfH(),
          body: JSON.stringify({
            playlist_id: pl.id,
            video_id: tr.video_id,
            title: tr.title,
            channel: tr.channel,
            thumbnail: tr.thumbnail,
          }),
        });
      }
      sfLoadPl();
      sfToast(
        'Imported "' +
          sfEsc(data.name) +
          '" with ' +
          data.tracks.length +
          " tracks",
        "success",
      );
    } catch (err) {
      sfToast("Import failed: " + err.message, "error");
    }
  };
  input.click();
}

function sfSharePlaylist(plId) {
  const pl = sfPlaylists.find((p) => p.id === plId);
  if (!pl) return;
  const shareData = {
    n: pl.name,
    t: pl.tracks.map((t) => ({
      v: t.video_id,
      t: t.title,
      c: t.channel,
      th: t.thumbnail,
    })),
  };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(shareData))));
  const shareUrl =
    window.location.origin + SF_BASE + "/player.php?shared=" + encoded;

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => sfToast("Share link copied!", "success"));
  } else {
    const ta = document.createElement("textarea");
    ta.value = shareUrl;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    sfToast("Share link copied!", "success");
  }
}

function sfCheckSharedPlaylist() {
  const params = new URLSearchParams(window.location.search);
  const shared = params.get("shared");
  if (!shared) return;

  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(shared))));
    if (data.n && Array.isArray(data.t) && data.t.length) {
      sfQueue = data.t.map((t) => ({ v: t.v, t: t.t, c: t.c, th: t.th }));
      sfQIdx = -1;
      sfRenderQ();
      sfLoadTrack(0);
      sfToast("Loaded shared playlist: " + sfEsc(data.n), "success");
      window.history.replaceState({}, "", window.location.pathname);
    }
  } catch (e) {
    console.log("Invalid shared playlist");
  }
}

// ═══════════════════════════════════
//  ADD TO PLAYLIST MODAL
// ═══════════════════════════════════
function sfShowPlModal(v, t, c, th) {
  v = sfDecodeAttr(v);
  t = sfDecodeAttr(t);
  c = sfDecodeAttr(c);
  th = sfDecodeAttr(th);
  sfPlModalTrack = { v, t, c, th };
  sfLoadPl().then(() => {
    const el = sfEl("sfPlModalList");
    if (!sfPlaylists.length) {
      el.innerHTML =
        '<p class="text-xs text-white/20 text-center py-3">Create a playlist first (go to Playlists tab)</p>';
    } else {
      el.innerHTML = sfPlaylists
        .map(
          (pl) =>
            '<button onclick="sfSaveTrackTo(' +
            pl.id +
            ')" class="w-full text-left px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-white/90 hover:bg-white/5 transition-all flex items-center gap-2">' +
            '<svg class="w-3.5 h-3.5 text-accent-400/40" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>' +
            sfEsc(pl.name) +
            '<span class="text-[10px] text-white/15 ml-auto">' +
            pl.tracks.length +
            " tracks</span></button>",
        )
        .join("");
    }
    sfEl("sfPlModal").classList.remove("hidden");
    sfEl("sfPlModal").classList.add("flex");
  });
}

async function sfSaveTrackTo(plId) {
  if (!sfPlModalTrack) return;
  const tr = sfPlModalTrack;
  try {
    const r = await fetch(SF_BASE + "/api/tracks.php", {
      method: "POST",
      headers: sfH(),
      body: JSON.stringify({
        playlist_id: plId,
        video_id: tr.v,
        title: tr.t,
        channel: tr.c,
        thumbnail: tr.th,
      }),
    });
    const d = await r.json();
    sfEl("sfPlModal").classList.add("hidden");
    sfEl("sfPlModal").classList.remove("flex");
    sfPlModalTrack = null;
    if (d.error) sfToast(d.error, "error");
    else sfToast("Added to playlist", "success");
  } catch (e) {
    sfToast("Failed to add to playlist", "error");
  }
}

function sfShowPlModalCurrent() {
  if (sfQIdx < 0 || !sfQueue[sfQIdx]) return;
  const tr = sfQueue[sfQIdx];
  sfShowPlModal(tr.v, tr.t, tr.c, tr.th);
}

// ═══════════════════════════════════
//  NOW PLAYING HERO
// ═══════════════════════════════════
function sfShowNowPlaying(track) {
  const np = sfEl("sfNowPlaying");
  if (!np) return;
  const thHQ = (track.th || "")
    .replace("default.jpg", "hqdefault.jpg")
    .replace("/default.", "/hqdefault.");
  sfEl("sfNpImg").src = thHQ;
  sfEl("sfNpTitle").textContent = track.t;
  sfEl("sfNpArtist").textContent = track.c;
  sfEl("sfNpBg").style.backgroundImage = "url(" + thHQ + ")";
  np.classList.remove("hidden");
}

function sfHideNowPlaying() {
  const np = sfEl("sfNowPlaying");
  if (np) np.classList.add("hidden");
}

function sfUpdateNowPlaying(playing) {
  const vis = sfEl("sfVisualizer");
  const art = sfEl("sfNpArt");
  const icoPlay = sfEl("sfNpIcoPlay");
  const icoPause = sfEl("sfNpIcoPause");
  if (!vis || !art) return;
  if (playing) {
    vis.classList.add("sf-visualizer--active");
    art.classList.add("sf-np-art--playing");
    if (icoPlay) icoPlay.classList.add("hidden");
    if (icoPause) icoPause.classList.remove("hidden");
  } else {
    vis.classList.remove("sf-visualizer--active");
    art.classList.remove("sf-np-art--playing");
    if (icoPlay) icoPlay.classList.remove("hidden");
    if (icoPause) icoPause.classList.add("hidden");
  }
}

// ═══════════════════════════════════
//  DYNAMIC COLOR THEME
// ═══════════════════════════════════
function sfApplyDynamicTheme(videoId) {
  if (!videoId) return;
  let hash = 0;
  for (let i = 0; i < videoId.length; i++) {
    hash = videoId.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = Math.abs(hash) % 360;
  document.documentElement.style.setProperty("--sf-dyn-hue", hue);
  document.documentElement.classList.add("sf-dynamic-theme");
}

function sfResetDynamicTheme() {
  document.documentElement.classList.remove("sf-dynamic-theme");
}

// ═══════════════════════════════════
//  LYRICS
// ═══════════════════════════════════
function sfToggleLyrics() {
  sfLyricsVisible = !sfLyricsVisible;
  const panel = sfEl("sfLyricsPanel");
  const btn = sfEl("sfLyricsBtn");
  if (!panel) return;

  if (sfLyricsVisible) {
    panel.classList.remove("hidden");
    if (btn) btn.classList.add("sf-ctrl-btn--active");
    if (sfQIdx >= 0 && sfQueue[sfQIdx] && !sfCurrentLyrics) {
      sfFetchLyrics(sfQueue[sfQIdx].t, sfQueue[sfQIdx].c);
    }
  } else {
    panel.classList.add("hidden");
    if (btn) btn.classList.remove("sf-ctrl-btn--active");
  }
}

async function sfFetchLyrics(title, artist) {
  const panel = sfEl("sfLyricsContent");
  if (!panel) return;
  panel.innerHTML =
    '<div class="flex items-center justify-center py-10"><div class="sf-spinner mx-auto" style="width:20px;height:20px;border-width:2px"></div></div>';

  const cleanTitle = title
    .replace(
      /\s*[\(\[]?(official|lyrics|audio|video|hd|hq|mv|feat\.?|ft\.?).*$/gi,
      "",
    )
    .trim();
  const cleanArtist = artist
    .replace(/\s*[-–]?\s*(topic|vevo|official)$/gi, "")
    .trim();

  try {
    const r = await fetch(
      "https://lrclib.net/api/search?q=" +
        encodeURIComponent(cleanTitle + " " + cleanArtist),
    );
    if (!r.ok) throw new Error("API error");
    const data = await r.json();

    if (Array.isArray(data) && data.length > 0 && data[0].plainLyrics) {
      sfCurrentLyrics = data[0].plainLyrics;
      panel.innerHTML =
        '<pre class="sf-lyrics-text">' + sfEsc(sfCurrentLyrics) + "</pre>";
    } else {
      sfCurrentLyrics = null;
      panel.innerHTML =
        '<div class="text-center py-10"><p class="text-white/20 text-sm">Lyrics not found</p><p class="text-white/10 text-xs mt-1">Try a different track</p></div>';
    }
  } catch (e) {
    sfCurrentLyrics = null;
    panel.innerHTML =
      '<div class="text-center py-10"><p class="text-white/20 text-sm">Could not load lyrics</p></div>';
  }
}

// ═══════════════════════════════════
//  SLEEP TIMER
// ═══════════════════════════════════
function sfShowSleepModal() {
  sfEl("sfSleepModal").classList.remove("hidden");
  sfEl("sfSleepModal").classList.add("flex");
  sfUpdateSleepDisplay();
}
function sfCloseSleepModal() {
  sfEl("sfSleepModal").classList.add("hidden");
  sfEl("sfSleepModal").classList.remove("flex");
}
function sfSetSleep(minutes) {
  sfCancelSleep();
  if (minutes === 0) return;
  sfSleepSecondsLeft = minutes * 60;
  sfSleepCountdown = setInterval(() => {
    sfSleepSecondsLeft--;
    sfUpdateSleepDisplay();
    sfUpdateSleepBadge();
    if (sfSleepSecondsLeft <= 0) {
      sfCancelSleep();
      if (sfPlayer && sfReady) sfPlayer.pauseVideo();
      sfToast("Sleep timer ended — goodnight!", "info", 5000);
    }
  }, 1000);
  sfUpdateSleepBadge();
  sfCloseSleepModal();
  sfToast("Sleep timer set: " + minutes + " min", "success");
}
function sfCancelSleep() {
  clearInterval(sfSleepCountdown);
  sfSleepCountdown = null;
  sfSleepSecondsLeft = 0;
  sfUpdateSleepBadge();
  sfUpdateSleepDisplay();
}
function sfUpdateSleepDisplay() {
  const el = sfEl("sfSleepStatus");
  if (!el) return;
  if (sfSleepSecondsLeft > 0) {
    const m = Math.floor(sfSleepSecondsLeft / 60);
    const s = sfSleepSecondsLeft % 60;
    el.innerHTML =
      '<span class="text-accent-400">' +
      m +
      ":" +
      (s + "").padStart(2, "0") +
      '</span> remaining <button onclick="sfCancelSleep();sfUpdateSleepDisplay()" class="text-red-400/60 hover:text-red-400 ml-2 text-[11px] underline">Cancel</button>';
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}
function sfUpdateSleepBadge() {
  const badge = sfEl("sfSleepBadge");
  if (!badge) return;
  badge.classList.toggle("hidden", sfSleepSecondsLeft <= 0);
}

// ═══════════════════════════════════
//  KEYBOARD SHORTCUTS
// ═══════════════════════════════════
function sfShowShortcuts() {
  sfEl("sfShortcutsModal").classList.remove("hidden");
  sfEl("sfShortcutsModal").classList.add("flex");
}
function sfHideShortcuts() {
  sfEl("sfShortcutsModal").classList.add("hidden");
  sfEl("sfShortcutsModal").classList.remove("flex");
}

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  switch (e.code) {
    case "Space":
      e.preventDefault();
      sfToggle();
      break;
    case "ArrowRight":
      if (e.shiftKey) sfNext();
      else if (sfReady) sfPlayer.seekTo(sfPlayer.getCurrentTime() + 10, true);
      break;
    case "ArrowLeft":
      if (e.shiftKey) sfPrev();
      else if (sfReady)
        sfPlayer.seekTo(Math.max(0, sfPlayer.getCurrentTime() - 10), true);
      break;
    case "ArrowUp":
      e.preventDefault();
      if (sfReady) {
        const v = Math.min(100, sfPlayer.getVolume() + 5);
        sfPlayer.setVolume(v);
        sfEl("sfVol").value = v;
      }
      break;
    case "ArrowDown":
      e.preventDefault();
      if (sfReady) {
        const v = Math.max(0, sfPlayer.getVolume() - 5);
        sfPlayer.setVolume(v);
        sfEl("sfVol").value = v;
      }
      break;
    case "KeyS":
      sfToggleShuffle();
      break;
    case "KeyR":
      sfToggleRepeat();
      break;
    case "KeyL":
      sfToggleLyrics();
      break;
    case "KeyM":
      if (sfReady) {
        if (sfPlayer.isMuted()) {
          sfPlayer.unMute();
          sfToast("Unmuted", "info");
        } else {
          sfPlayer.mute();
          sfToast("Muted", "info");
        }
      }
      break;
    case "Slash":
      if (e.shiftKey) {
        e.preventDefault();
        sfShowShortcuts();
      }
      break;
    case "Escape":
      sfHideShortcuts();
      sfCloseSleepModal();
      break;
  }
});

// ═══════════════════════════════════
//  VIEW MANAGEMENT
// ═══════════════════════════════════
function sfShowSearchView() {
  const results = sfEl("sfResults");
  const dash = sfEl("sfDashboard");
  const sh = sfEl("sfSearchHeader");
  if (results) results.classList.remove("hidden");
  if (dash) dash.classList.add("hidden");
  if (sh) sh.classList.remove("hidden");
}
function sfShowDashView() {
  const results = sfEl("sfResults");
  const dash = sfEl("sfDashboard");
  const sh = sfEl("sfSearchHeader");
  if (results) results.classList.add("hidden");
  if (dash) dash.classList.remove("hidden");
  if (sh) sh.classList.add("hidden");
}

// ═══════════════════════════════════
//  RECORD PLAY HISTORY
// ═══════════════════════════════════
async function sfRecordHistory(v, t, c, th) {
  try {
    await fetch(SF_BASE + "/api/history.php", {
      method: "POST",
      headers: sfH(),
      body: JSON.stringify({
        video_id: v,
        title: t,
        channel: c,
        thumbnail: th,
      }),
    });
  } catch (e) {}
}

// ═══════════════════════════════════
//  ZERO-QUOTA RECOMMENDATION ENGINE
//  Uses Invidious/Piped ONLY — no YouTube API
// ═══════════════════════════════════

let sfForYouCache = [];
let sfArtistMixCache = [];

function sfShowRecSkeleton(gridId, count) {
  var grid = sfEl(gridId);
  if (!grid) return;
  var html = "";
  for (var i = 0; i < (count || 6); i++) {
    html +=
      '<div class="sf-rec-skeleton-card"><div class="sf-skel-thumb"></div><div class="sf-skel-line"></div><div class="sf-skel-line sf-skel-line--short"></div></div>';
  }
  grid.className = "sf-rec-skeleton";
  grid.innerHTML = html;
}

// Search via Invidious/Piped only (no quota)
async function sfFreeSearch(query, maxResults) {
  var savedPage = sfInvPage;
  sfInvPage = 1;
  try {
    var results = await sfInvidiousSearch(query, maxResults || 6);
    return results.filter(function (r) {
      return r.v;
    });
  } catch (e) {
    return [];
  } finally {
    sfInvPage = savedPage;
  }
}

function sfShuffleArr(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}
function sfDedupeVids(results) {
  var seen = {};
  return results.filter(function (r) {
    if (seen[r.v]) return false;
    seen[r.v] = true;
    return true;
  });
}

// "For You" — based on search history (zero quota)
async function sfLoadForYou() {
  var searchHist = sfGetSearchHistory();
  if (!searchHist.length) return false;
  var sec = sfEl("sfForYouSection"),
    grid = sfEl("sfForYouGrid"),
    badge = sfEl("sfForYouBadge");
  if (!sec || !grid) return false;
  sec.classList.remove("hidden");

  var picks = sfShuffleArr(searchHist).slice(0, 3);
  if (badge) badge.textContent = picks.join(" · ");

  sfShowRecSkeleton("sfForYouGrid", 6);
  var flavors = [
    "new 2025",
    "best",
    "top",
    "mix",
    "vibes",
    "playlist",
    "hits",
    "latest",
  ];
  var flavor = flavors[Math.floor(Math.random() * flavors.length)];
  try {
    var results = await Promise.all(
      picks.map(function (q) {
        return sfFreeSearch(q + " " + flavor, 6);
      }),
    );
    var all = [];
    results.forEach(function (r) {
      all = all.concat(r);
    });
    sfForYouCache = sfShuffleArr(sfDedupeVids(all)).slice(0, 10);
    if (sfForYouCache.length) {
      grid.className = "sf-grid";
      grid.innerHTML = sfForYouCache
        .map(function (r) {
          return sfBuildCardHTML(r.v, r.t, r.c, r.th, r.thHQ);
        })
        .join("");
      return true;
    }
    sec.classList.add("hidden");
    return false;
  } catch (e) {
    sec.classList.add("hidden");
    return false;
  }
}

async function sfRefreshForYou() {
  var btn = document.querySelector('[onclick="sfRefreshForYou()"]');
  if (btn) btn.classList.add("sf-refreshing");
  sfToast("Finding fresh tracks...", "info");
  await sfLoadForYou();
  if (btn) btn.classList.remove("sf-refreshing");
}

// "More From Your Artists" — based on play history DB (zero quota)
async function sfLoadArtistMix() {
  var sec = sfEl("sfArtistMixSection"),
    grid = sfEl("sfArtistMixGrid");
  if (!sec || !grid) return false;
  try {
    var r = await fetch(SF_BASE + "/api/history.php?limit=10");
    if (!r.ok) return false;
    var history = await r.json();
    if (!Array.isArray(history) || history.length < 2) return false;
    var artists = [],
      seen = {};
    history.forEach(function (h) {
      var a = (h.channel || "")
        .replace(/\s*[-–]?\s*(Topic|VEVO|Official)$/gi, "")
        .trim();
      var k = a.toLowerCase();
      if (a && !seen[k]) {
        seen[k] = true;
        artists.push(a);
      }
    });
    if (!artists.length) return false;
    sec.classList.remove("hidden");
    sfShowRecSkeleton("sfArtistMixGrid", 6);
    var picks = sfShuffleArr(artists).slice(0, Math.min(2, artists.length));
    var results = await Promise.all(
      picks.map(function (a) {
        return sfFreeSearch(a + " songs", 5);
      }),
    );
    var all = [];
    results.forEach(function (r) {
      all = all.concat(r);
    });
    var histIds = {};
    history.forEach(function (h) {
      histIds[h.video_id] = true;
    });
    sfArtistMixCache = sfShuffleArr(
      sfDedupeVids(all).filter(function (r) {
        return !histIds[r.v];
      }),
    ).slice(0, 8);
    if (sfArtistMixCache.length) {
      grid.className = "sf-grid";
      grid.innerHTML = sfArtistMixCache
        .map(function (r) {
          return sfBuildCardHTML(r.v, r.t, r.c, r.th, r.thHQ);
        })
        .join("");
      return true;
    }
    sec.classList.add("hidden");
    return false;
  } catch (e) {
    sec.classList.add("hidden");
    return false;
  }
}

// ═══════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════
async function sfLoadDashboard() {
  let hasContent = false;

  // Recent searches (local, no API calls)
  const searchHist = sfGetSearchHistory().slice(0, 8);
  if (searchHist.length) {
    hasContent = true;
    const secS = sfEl("sfRecentSearchSec");
    const gridS = sfEl("sfRecentSearchGrid");
    if (secS) secS.classList.remove("hidden");
    if (gridS) {
      gridS.innerHTML = searchHist
        .map(
          (q) =>
            "<button onclick=\"sfEl('sfSearchIn').value='" +
            sfAttr(q) +
            '\';sfDoSearch()" class="sf-search-chip">' +
            '<svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.3-4.3"/></svg>' +
            sfEsc(q) +
            "</button>",
        )
        .join("");
    }
  }

  // Recently played from DB (1 lightweight API call, no search quota)
  try {
    const r = await fetch(SF_BASE + "/api/history.php?limit=10");
    if (r.ok) {
      const history = await r.json();
      if (Array.isArray(history) && history.length) {
        hasContent = true;
        var sec = sfEl("sfRecentSection");
        var grid = sfEl("sfRecentGrid");
        if (sec) sec.classList.remove("hidden");
        if (grid) {
          grid.innerHTML = history
            .map(function (h) {
              var th = h.thumbnail || "";
              var thHQ = th
                .replace("default.jpg", "mqdefault.jpg")
                .replace("/default.", "/mqdefault.");
              var sv = sfAttr(h.video_id),
                st = sfAttr(h.title),
                sc = sfAttr(h.channel),
                sth = sfAttr(th);
              return (
                '<div class="sf-card sf-card--history" id="sfHist_' +
                h.video_id +
                '">' +
                '<div class="relative">' +
                '<img src="' +
                sfAttr(thHQ) +
                '" class="sf-card-thumb cursor-pointer" loading="lazy" alt="" onclick="sfPlayNow(\'' +
                sv +
                "','" +
                st +
                "','" +
                sc +
                "','" +
                sth +
                "')\">" +
                "<button onclick=\"sfDeleteHistory('" +
                sv +
                '\')" class="sf-card-remove" title="Remove from history">' +
                '<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg></button></div>' +
                '<div class="sf-card-body cursor-pointer" onclick="sfPlayNow(\'' +
                sv +
                "','" +
                st +
                "','" +
                sc +
                "','" +
                sth +
                "')\">" +
                '<p class="text-[13px] font-medium text-white/80 leading-snug line-clamp-2 mb-1">' +
                sfEsc(h.title) +
                "</p>" +
                '<p class="text-[11px] text-white/25 truncate">' +
                sfEsc(h.channel) +
                "</p>" +
                '<div class="sf-card-actions flex gap-1.5 mt-2.5">' +
                "<button onclick=\"event.stopPropagation();sfPlayNow('" +
                sv +
                "','" +
                st +
                "','" +
                sc +
                "','" +
                sth +
                '\')" class="flex-1 flex items-center justify-center gap-1.5 bg-accent-500/15 text-accent-400 text-[11px] font-medium py-1.5 rounded-lg hover:bg-accent-500/25 transition-all">' +
                '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>Play</button>' +
                "<button onclick=\"event.stopPropagation();sfAddQ('" +
                sv +
                "','" +
                st +
                "','" +
                sc +
                "','" +
                sth +
                '\')" class="w-8 h-8 flex items-center justify-center bg-white/5 text-white/30 rounded-lg hover:text-cyan-400 hover:bg-cyan-500/10 transition-all" title="Add to queue">' +
                '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14m-7-7h14"/></svg></button>' +
                "</div></div></div>"
              );
            })
            .join("");
        }
      }
    }
  } catch (e) {}

  // Recommendations via Invidious/Piped (zero YouTube quota)
  var searchHistForRecs = sfGetSearchHistory();
  if (searchHistForRecs.length) {
    var forYouOk = await sfLoadForYou();
    if (forYouOk) hasContent = true;
  }
  var artistOk = await sfLoadArtistMix();
  if (artistOk) hasContent = true;

  var loader = sfEl("sfDashLoading");
  if (loader) loader.classList.add("hidden");

  if (!hasContent) {
    var empty = sfEl("sfDashEmpty");
    if (empty) empty.classList.remove("hidden");
  }
}

// ═══════════════════════════════════
//  DELETE HISTORY
// ═══════════════════════════════════
async function sfDeleteHistory(videoId) {
  try {
    await fetch(
      SF_BASE + "/api/history.php?video_id=" + encodeURIComponent(videoId),
      { method: "DELETE", headers: sfH() },
    );
    var el = document.getElementById("sfHist_" + videoId);
    if (el) {
      el.style.transition = "opacity 0.2s, transform 0.2s";
      el.style.opacity = "0";
      el.style.transform = "scale(0.95)";
      setTimeout(function () {
        el.remove();
        var grid = sfEl("sfRecentGrid");
        if (grid && !grid.children.length) {
          var sec = sfEl("sfRecentSection");
          if (sec) sec.classList.add("hidden");
        }
      }, 200);
    }
    sfToast("Removed from history", "info");
  } catch (e) {}
}

async function sfClearHistory() {
  var ok = await sfConfirm("Clear all play history?");
  if (!ok) return;
  try {
    await fetch(SF_BASE + "/api/history.php", {
      method: "DELETE",
      headers: sfH(),
    });
    var sec = sfEl("sfRecentSection");
    if (sec) sec.classList.add("hidden");
    sfToast("History cleared", "info");
  } catch (e) {}
}

// ═══════════════════════════════════
//  MOBILE BOTTOM SHEET
// ═══════════════════════════════════
function sfToggleSheet() {
  sfSheetOpen = !sfSheetOpen;
  const sidebar = document.querySelector(".sf-sidebar");
  const overlay = sfEl("sfSheetOverlay");
  if (!sidebar) return;
  if (sfSheetOpen) {
    sidebar.classList.add("sf-sidebar--open");
    if (overlay) overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  } else {
    sidebar.classList.remove("sf-sidebar--open");
    if (overlay) overlay.classList.add("hidden");
    document.body.style.overflow = "";
  }
}
function sfCloseSheet() {
  sfSheetOpen = false;
  const sidebar = document.querySelector(".sf-sidebar");
  const overlay = sfEl("sfSheetOverlay");
  if (sidebar) sidebar.classList.remove("sf-sidebar--open");
  if (overlay) overlay.classList.add("hidden");
  document.body.style.overflow = "";
}

// ═══════════════════════════════════
//  PWA SERVICE WORKER
// ═══════════════════════════════════
function sfRegisterSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(SF_BASE + "/sw.js").catch(() => {});
  }
}

// ═══════════════════════════════════
//  INIT
// ═══════════════════════════════════
sfInitSearch();
sfLoadDashboard();
sfCheckSharedPlaylist();
sfRegisterSW();
