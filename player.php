<?php
require_once __DIR__ . '/includes/auth.php';
initSession();
requireLogin();

$db = getDB();
$apiKey = getGlobalApiKey();
$csrf = generateCSRF();
$username = htmlspecialchars($_SESSION['username'] ?? '');
$userRole = $_SESSION['role'] ?? 'user';
$B = BASE_PATH;

$plStmt = $db->prepare("SELECT id, name FROM sf_playlists WHERE user_id = ? ORDER BY created_at DESC");
$plStmt->execute([getUserId()]);
$userPlaylists = $plStmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en" class="dark">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SonicFlow — Player</title>
    <meta name="description" content="SonicFlow — Your personal YouTube music player">
    <meta name="theme-color" content="#0a0507">
    <link rel="manifest" href="<?= $B ?>/manifest.json">
    <link rel="apple-touch-icon" href="<?= $B ?>/static/icon-192.png">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        surface: {
                            800: '#12080a',
                            900: '#0a0507',
                            950: '#060304'
                        },
                        accent: {
                            300: '#fda4af',
                            400: '#fb7185',
                            500: '#f43f5e',
                            600: '#e11d48'
                        }
                    }
                }
            }
        }
    </script>
    <link rel="stylesheet" href="<?= $B ?>/static/css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap" rel="stylesheet">
    <meta name="csrf-token" content="<?= htmlspecialchars($csrf) ?>">
</head>

<body class="bg-surface-900 text-white font-['DM_Sans'] overflow-hidden h-screen">

    <!-- Toast Notifications Container -->
    <div id="sfToastWrap"></div>

    <!-- Mobile Sheet Overlay -->
    <div id="sfSheetOverlay" class="sf-sheet-overlay hidden" onclick="sfCloseSheet()"></div>

    <!-- Ambient Background -->
    <div class="fixed inset-0 pointer-events-none z-0">
        <div class="absolute top-[-15%] left-[-5%] w-[45%] h-[45%] bg-accent-500/[0.04] rounded-full blur-[100px] animate-drift"></div>
        <div class="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-accent-400/[0.03] rounded-full blur-[80px] animate-drift-alt"></div>
    </div>

    <!-- Hidden YT Player -->
    <div id="ytWrap">
        <div id="ytp"></div>
    </div>

    <div class="h-screen flex flex-col relative z-10">

        <!-- ═══════════════════════ HEADER ═══════════════════════ -->
        <header class="sf-header">
            <a href="<?= $B ?>/" class="flex items-center gap-3 hover:opacity-90 transition-opacity">
                <div class="sf-header-logo">
                    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                </div>
                <h1 class="text-lg font-bold hidden sm:block tracking-tight">Sonic<span class="text-accent-400">Flow</span></h1>
            </a>
            <div class="flex items-center gap-2">
                <?php if ($userRole === 'admin'): ?>
                    <button onclick="document.getElementById('adminModal').classList.remove('hidden');document.getElementById('adminModal').classList.add('flex')" class="sf-header-btn sf-header-btn--admin" title="Admin: Manage API Key">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                        </svg>
                    </button>
                <?php endif; ?>
                <!-- Keyboard Shortcuts Button -->
                <button onclick="sfShowShortcuts()" class="sf-header-btn" title="Keyboard shortcuts (?)">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                    </svg>
                </button>
                <div class="sf-header-user hidden sm:flex">
                    <div class="sf-avatar-sm"><?= strtoupper(substr($username, 0, 1)) ?></div>
                    <span class="text-xs text-white/40 font-medium capitalize"><?= $username ?></span>
                    <?php if ($userRole === 'admin'): ?>
                        <span class="sf-badge-admin">ADMIN</span>
                    <?php endif; ?>
                </div>
                <a href="<?= $B ?>/logout.php" class="sf-header-btn" title="Logout">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                </a>
            </div>
        </header>

        <!-- ═══════════════════════ CONTENT ═══════════════════════ -->
        <div class="flex-1 flex flex-col lg:flex-row overflow-hidden">

            <!-- ─── Left: Main Area ─── -->
            <div class="flex-1 flex flex-col p-4 sm:p-5 overflow-hidden">

                <!-- Search Bar + View Toggle -->
                <div class="flex gap-2 mb-4">
                    <div id="sfSearchWrap" class="relative flex-1">
                        <input id="sfSearchIn" placeholder="Search for music..." class="sf-input w-full" autocomplete="off">
                        <!-- Search Suggestions Dropdown -->
                        <div id="sfSuggestDrop" class="sf-suggest-dropdown hidden"></div>
                    </div>
                    <button onclick="sfHideSuggestions();sfDoSearch()" class="bg-accent-500/15 text-accent-400 text-sm px-5 py-2.5 rounded-xl hover:bg-accent-500/25 transition-all font-medium flex-shrink-0">Search</button>
                </div>

                <!-- View toggle + result count -->
                <div id="sfSearchHeader" class="flex items-center justify-between mb-3 hidden">
                    <div class="flex items-center gap-3">
                        <span id="sfResCount" class="text-[11px] text-white/20"></span>
                        <button onclick="sfShowDashView()" class="text-[10px] text-white/20 hover:text-white/40 transition-colors">&larr; Back to dashboard</button>
                    </div>
                    <div class="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5 border border-white/5">
                        <button id="sfViewGrid" onclick="sfSetView('grid')" class="p-1.5 rounded text-accent-400 bg-accent-500/10 transition-all" title="Grid view">
                            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
                            </svg>
                        </button>
                        <button id="sfViewList" onclick="sfSetView('list')" class="p-1.5 rounded text-white/30 transition-all" title="List view">
                            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Main Content Area -->
                <div id="sfMainArea" class="flex-1 overflow-y-auto sf-scroll">

                    <!-- Now Playing Hero (hidden by default) -->
                    <div id="sfNowPlaying" class="hidden">
                        <div class="sf-now-playing">
                            <div class="sf-np-bg" id="sfNpBg"></div>
                            <div class="sf-np-content">
                                <div class="sf-np-art-wrap">
                                    <div class="sf-np-art" id="sfNpArt">
                                        <img id="sfNpImg" src="" alt="" class="sf-np-img">
                                        <div class="sf-np-vinyl-ring"></div>
                                    </div>
                                    <div class="sf-visualizer" id="sfVisualizer">
                                        <span></span><span></span><span></span><span></span><span></span>
                                        <span></span><span></span><span></span><span></span><span></span>
                                        <span></span><span></span><span></span><span></span><span></span>
                                        <span></span><span></span><span></span><span></span><span></span>
                                    </div>
                                </div>
                                <div class="sf-np-info">
                                    <p class="sf-np-label">NOW PLAYING</p>
                                    <h2 class="sf-np-title" id="sfNpTitle"></h2>
                                    <p class="sf-np-artist" id="sfNpArtist"></p>
                                    <div class="sf-np-actions">
                                        <button onclick="sfToggle()" class="sf-np-play-btn" id="sfNpPlayBtn">
                                            <svg id="sfNpIcoPlay" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                            <svg id="sfNpIcoPause" class="w-5 h-5 hidden" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M6 19h4V5H6zm8-14v14h4V5z" />
                                            </svg>
                                        </button>
                                        <button onclick="sfNext()" class="sf-np-action-btn" title="Next track">
                                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                                            </svg>
                                        </button>
                                        <button onclick="sfShowPlModalCurrent()" class="sf-np-action-btn" title="Add to playlist">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                            </svg>
                                        </button>
                                        <button onclick="sfToggleLyrics()" class="sf-np-action-btn" title="Show lyrics">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Search Results Container -->
                    <div id="sfResults" class="hidden"></div>

                    <!-- Default Dashboard -->
                    <div id="sfDashboard">

                        <!-- Recently Searched -->
                        <div id="sfRecentSearchSec" class="mb-6 hidden">
                            <div class="flex items-center gap-2 mb-3">
                                <svg class="w-4 h-4 text-accent-400/60" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <circle cx="11" cy="11" r="8" />
                                    <path stroke-linecap="round" d="m21 21-4.3-4.3" />
                                </svg>
                                <h2 class="text-sm font-semibold text-white/60">Recent Searches</h2>
                            </div>
                            <div id="sfRecentSearchGrid" class="sf-search-chips"></div>
                        </div>

                        <!-- Recently Played -->
                        <div id="sfRecentSection" class="mb-6 hidden">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center gap-2">
                                    <svg class="w-4 h-4 text-accent-400/60" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h2 class="text-sm font-semibold text-white/60">Recently Played</h2>
                                </div>
                                <button onclick="sfClearHistory()" class="sf-clear-btn">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                    Clear
                                </button>
                            </div>
                            <div id="sfRecentGrid" class="sf-grid"></div>
                        </div>

                        <!-- For You — Personalized Recommendations -->
                        <div id="sfForYouSection" class="mb-6 hidden">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center gap-2">
                                    <svg class="w-4 h-4 text-accent-400/60" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                    </svg>
                                    <h2 class="text-sm font-semibold text-white/60">For You</h2>
                                    <span id="sfForYouBadge" class="text-[10px] text-white/20 truncate max-w-[180px]"></span>
                                </div>
                                <button onclick="sfRefreshForYou()" class="sf-clear-btn" title="Refresh recommendations">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                                    </svg>
                                    Refresh
                                </button>
                            </div>
                            <div id="sfForYouGrid" class="sf-grid"></div>
                        </div>

                        <!-- More From Artists You Listen To -->
                        <div id="sfArtistMixSection" class="mb-6 hidden">
                            <div class="flex items-center gap-2 mb-3">
                                <svg class="w-4 h-4 text-accent-400/60" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                                <h2 class="text-sm font-semibold text-white/60">More From Your Artists</h2>
                            </div>
                            <div id="sfArtistMixGrid" class="sf-grid"></div>
                        </div>

                        <!-- Loading state -->
                        <div id="sfDashLoading" class="flex items-center justify-center py-20">
                            <div class="text-center">
                                <div class="sf-spinner mx-auto mb-3"></div>
                                <p class="text-xs text-white/20">Loading your music...</p>
                            </div>
                        </div>

                        <!-- Empty fallback -->
                        <div id="sfDashEmpty" class="hidden">
                            <div class="flex items-center justify-center h-full py-20">
                                <div class="text-center sf-empty-state">
                                    <div class="sf-empty-icon mx-auto">
                                        <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
                                            <circle cx="11" cy="11" r="8" />
                                            <path stroke-linecap="round" d="m21 21-4.3-4.3" />
                                        </svg>
                                    </div>
                                    <p class="text-sm text-white/20 font-medium">Search to discover music</p>
                                    <p class="text-xs text-white/10 mt-1">Find your favorite tracks on YouTube</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ─── Right: Queue & Playlists (with Mobile Bottom Sheet) ─── -->
            <div class="lg:w-80 border-t lg:border-t-0 lg:border-l border-white/[0.04] flex flex-col overflow-hidden sf-sidebar">
                <div class="flex flex-shrink-0">
                    <button id="sfTabQ" onclick="sfSwitchTab('queue')" class="sf-sidebar-tab sf-sidebar-tab--active flex-1">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                        </svg>
                        Queue
                    </button>
                    <button id="sfTabPl" onclick="sfSwitchTab('playlists')" class="sf-sidebar-tab flex-1">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                        </svg>
                        Playlists
                    </button>
                </div>

                <!-- Queue Panel -->
                <div id="sfPanelQ" class="flex-1 flex flex-col p-4 overflow-hidden">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-[11px] text-white/25 font-medium" id="sfQCount">0 tracks</span>
                        <button onclick="sfClearQueue()" class="sf-clear-btn">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            Clear
                        </button>
                    </div>
                    <div id="sfQueueEl" class="flex-1 overflow-y-auto sf-scroll space-y-1">
                        <div class="flex flex-col items-center justify-center h-full sf-empty-state">
                            <div class="sf-empty-icon sf-empty-icon--sm">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                                </svg>
                            </div>
                            <p class="text-xs text-white/15">Queue is empty</p>
                        </div>
                    </div>
                </div>

                <!-- Playlists Panel -->
                <div id="sfPanelPl" class="flex-1 flex flex-col p-4 overflow-hidden hidden">
                    <div class="flex gap-2 mb-3">
                        <input id="sfNewPl" placeholder="New playlist name..." class="sf-input flex-1 !py-2 !text-xs !rounded-lg" onkeydown="event.key==='Enter'&&sfCreatePl()">
                        <button onclick="sfCreatePl()" class="sf-pl-create-btn">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </button>
                    </div>
                    <div class="flex items-center justify-end mb-2">
                        <button onclick="sfImportPlaylist()" class="sf-import-btn" title="Import playlist from JSON file">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            Import
                        </button>
                    </div>
                    <div id="sfPlEl" class="flex-1 overflow-y-auto sf-scroll space-y-1.5">
                        <div class="flex flex-col items-center justify-center h-full sf-empty-state">
                            <div class="sf-empty-icon sf-empty-icon--sm">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                                </svg>
                            </div>
                            <p class="text-xs text-white/15">No playlists yet</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ═══════════════════════ PLAYER BAR ═══════════════════════ -->
        <footer class="sf-player-bar">
            <div class="sf-progress-wrap" onclick="sfSeek(event)">
                <div class="sf-progress-track">
                    <div id="sfProg" class="sf-progress-fill" style="width:0%"></div>
                </div>
                <div id="sfThumb" class="sf-progress-thumb" style="left:0%"></div>
            </div>
            <div class="flex items-center justify-between px-3 sm:px-5 py-2.5 gap-3">
                <!-- Left: Track Info -->
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div id="sfDisc" class="sf-disc">
                        <div class="sf-disc-hole"></div>
                    </div>
                    <div class="min-w-0">
                        <p id="sfTitle" class="text-sm font-medium truncate text-white/70">No track selected</p>
                        <p id="sfArtist" class="text-[11px] text-white/25 truncate">—</p>
                    </div>
                </div>

                <!-- Center: Controls -->
                <div class="flex items-center gap-1">
                    <button id="sfShuffleBtn" onclick="sfToggleShuffle()" class="sf-ctrl-btn hidden sm:flex" title="Shuffle (S)">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                        </svg>
                    </button>
                    <button onclick="sfPrev()" class="sf-ctrl-btn">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                        </svg>
                    </button>
                    <button id="sfPPBtn" onclick="sfToggle()" class="sf-play-btn">
                        <svg id="sfIcoPlay" class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                        <svg id="sfIcoPause" class="w-5 h-5 hidden" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6zm8-14v14h4V5z" />
                        </svg>
                    </button>
                    <button onclick="sfNext()" class="sf-ctrl-btn">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                        </svg>
                    </button>
                    <button id="sfRepeatBtn" onclick="sfToggleRepeat()" class="sf-ctrl-btn hidden sm:flex" title="Repeat (R)">
                        <svg id="sfRepeatIco" class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M4.5 12c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M16.5 19.5l2.25-2.25m0 0L21 15m-2.25 2.25H6m11.25-12.75L15 4.5m0 0L12.75 6.75M15 4.5v12.75" />
                        </svg>
                    </button>
                </div>

                <!-- Right: Extras -->
                <div class="flex items-center gap-2 flex-1 justify-end">
                    <span id="sfTime" class="text-[10px] text-white/20 font-mono hidden sm:block tabular-nums">0:00 / 0:00</span>

                    <!-- Lyrics Toggle -->
                    <button id="sfLyricsBtn" onclick="sfToggleLyrics()" class="sf-ctrl-btn hidden sm:flex sf-player-extras" title="Lyrics (L)">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                    </button>

                    <!-- Sleep Timer -->
                    <button onclick="sfShowSleepModal()" class="sf-ctrl-btn hidden sm:flex sf-player-extras" title="Sleep timer">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                        <span id="sfSleepBadge" class="sf-sleep-badge hidden"></span>
                    </button>

                    <!-- Volume -->
                    <div class="items-center gap-2 hidden sm:flex sf-player-extras">
                        <svg class="w-3.5 h-3.5 text-white/25" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                        </svg>
                        <input type="range" id="sfVol" min="0" max="100" value="80" class="vol-slider w-20" oninput="sfPlayer&&sfPlayer.setVolume(+this.value)">
                    </div>

                    <!-- Mobile: Queue Toggle -->
                    <button onclick="sfToggleSheet()" class="sf-sheet-toggle" title="Queue & Playlists">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                        </svg>
                    </button>
                </div>
            </div>
        </footer>
    </div>

    <!-- ═══ Lyrics Panel ═══ -->
    <div id="sfLyricsPanel" class="sf-lyrics-panel hidden">
        <div class="sf-lyrics-header">
            <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-accent-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                <h3 class="text-sm font-semibold">Lyrics</h3>
            </div>
            <button onclick="sfToggleLyrics()" class="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M18 6 6 18M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div id="sfLyricsContent" class="sf-lyrics-body sf-scroll">
            <div class="text-center py-10">
                <p class="text-white/20 text-sm">Play a song to see lyrics</p>
            </div>
        </div>
    </div>

    <!-- ═══ Admin Modal ═══ -->
    <?php if ($userRole === 'admin'): ?>
        <div id="adminModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/60 backdrop-blur-sm" onclick="if(event.target===this){this.classList.add('hidden');this.classList.remove('flex')}">
            <div class="sf-modal">
                <div class="flex items-center justify-between mb-5">
                    <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
                            <svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-sm font-semibold">API Key Settings</h3>
                            <p class="text-[11px] text-white/25">Shared across all users</p>
                        </div>
                    </div>
                    <button onclick="adminModal.classList.add('hidden');adminModal.classList.remove('flex')" class="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="space-y-3">
                    <div>
                        <label class="sf-label">YouTube Data API v3 Key</label>
                        <div class="flex gap-2">
                            <input id="adminKeyIn" type="text" value="<?= htmlspecialchars($apiKey) ?>" placeholder="Paste your API key here..." class="sf-input flex-1 !text-xs font-mono">
                            <button onclick="sfAdminSaveKey()" class="sf-btn-amber">Save</button>
                        </div>
                    </div>
                    <div id="adminKeyMsg" class="hidden text-xs p-2.5 rounded-lg"></div>
                    <div class="sf-divider my-3"></div>
                    <p class="text-[10px] text-white/20 leading-relaxed">
                        Get a free key &rarr;
                        <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" class="text-accent-400/60 hover:text-accent-400 underline underline-offset-2 transition-colors">Google Cloud Console</a>
                    </p>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <!-- ═══ "Add to Playlist" Modal ═══ -->
    <div id="sfPlModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/60 backdrop-blur-sm" onclick="if(event.target===this){this.classList.add('hidden');this.classList.remove('flex')}">
        <div class="sf-modal !max-w-xs">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-semibold">Add to Playlist</h3>
                <button onclick="sfPlModal.classList.add('hidden');sfPlModal.classList.remove('flex')" class="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div id="sfPlModalList" class="space-y-1.5 max-h-48 overflow-y-auto sf-scroll"></div>
        </div>
    </div>

    <!-- ═══ Sleep Timer Modal ═══ -->
    <div id="sfSleepModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/60 backdrop-blur-sm" onclick="if(event.target===this){sfCloseSleepModal()}">
        <div class="sf-modal !max-w-xs">
            <div class="flex items-center justify-between mb-5">
                <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center">
                        <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                    </div>
                    <div>
                        <h3 class="text-sm font-semibold">Sleep Timer</h3>
                        <p class="text-[11px] text-white/25">Auto-stop playback</p>
                    </div>
                </div>
                <button onclick="sfCloseSleepModal()" class="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div id="sfSleepStatus" class="text-xs text-white/40 text-center mb-4 hidden"></div>
            <div class="sf-sleep-options">
                <button class="sf-sleep-btn" onclick="sfSetSleep(5)">5<span>min</span></button>
                <button class="sf-sleep-btn" onclick="sfSetSleep(15)">15<span>min</span></button>
                <button class="sf-sleep-btn" onclick="sfSetSleep(30)">30<span>min</span></button>
                <button class="sf-sleep-btn" onclick="sfSetSleep(45)">45<span>min</span></button>
                <button class="sf-sleep-btn" onclick="sfSetSleep(60)">60<span>min</span></button>
                <button class="sf-sleep-btn" onclick="sfSetSleep(90)">90<span>min</span></button>
            </div>
        </div>
    </div>

    <!-- ═══ Keyboard Shortcuts Modal ═══ -->
    <div id="sfShortcutsModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/60 backdrop-blur-sm" onclick="if(event.target===this){sfHideShortcuts()}">
        <div class="sf-modal !max-w-sm">
            <div class="flex items-center justify-between mb-5">
                <h3 class="text-sm font-semibold">Keyboard Shortcuts</h3>
                <button onclick="sfHideShortcuts()" class="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div class="sf-shortcuts-grid">
                <span class="sf-key">Space</span><span class="sf-key-label">Play / Pause</span>
                <span class="sf-key">Shift+→</span><span class="sf-key-label">Next track</span>
                <span class="sf-key">Shift+←</span><span class="sf-key-label">Previous track</span>
                <span class="sf-key">→</span><span class="sf-key-label">Seek forward 10s</span>
                <span class="sf-key">←</span><span class="sf-key-label">Seek back 10s</span>
                <span class="sf-key">↑</span><span class="sf-key-label">Volume up</span>
                <span class="sf-key">↓</span><span class="sf-key-label">Volume down</span>
                <span class="sf-key">S</span><span class="sf-key-label">Toggle shuffle</span>
                <span class="sf-key">R</span><span class="sf-key-label">Toggle repeat</span>
                <span class="sf-key">L</span><span class="sf-key-label">Toggle lyrics</span>
                <span class="sf-key">M</span><span class="sf-key-label">Mute / Unmute</span>
                <span class="sf-key">Esc</span><span class="sf-key-label">Close modals</span>
            </div>
        </div>
    </div>

    <!-- ═══ No API Key Warning ═══ -->
    <?php if (!$apiKey): ?>
        <div id="noKeyBanner" class="sf-banner-warn">
            <svg class="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p class="text-xs text-amber-300/70"><?= $userRole === 'admin' ? 'Set up the YouTube API key to enable search.' : 'Ask your admin to set up the YouTube API key.' ?></p>
            <button onclick="this.parentElement.remove()" class="p-1 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 flex-shrink-0 transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M18 6 6 18M6 6l12 12" />
                </svg>
            </button>
        </div>
    <?php endif; ?>

    <!-- ═══ Music Taste Picker Modal ═══ -->
    <script>
        const SF_CSRF = '<?= htmlspecialchars($csrf) ?>';
        const SF_BASE = '<?= $B ?>';
        const SF_KEY = '<?= htmlspecialchars($apiKey) ?>';
        const SF_IS_ADMIN = <?= $userRole === 'admin' ? 'true' : 'false' ?>;
    </script>
    <script src="<?= $B ?>/static/js/player.js"></script>
</body>

</html>