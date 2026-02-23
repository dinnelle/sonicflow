<?php
require_once __DIR__ . '/includes/auth.php';
initSession();
if (isLoggedIn()) {
    header('Location: ' . BASE_PATH . '/player.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCSRF();
    $ip = $_SERVER['REMOTE_ADDR'];
    if (isRateLimited($ip)) {
        setFlash('error', 'Too many attempts. Try again in 15 minutes.');
    } else {
        $username = clean($_POST['username'] ?? '', 100);
        $password = $_POST['password'] ?? '';
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM sf_users WHERE username = ? LIMIT 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        if ($user && password_verify($password, $user['password_hash'])) {
            clearLoginAttempts($ip);
            regenerateSession();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['role'] = $user['role'];
            header('Location: ' . BASE_PATH . '/player.php');
            exit;
        } else {
            recordLoginAttempt($ip);
            setFlash('error', 'Invalid credentials.');
        }
    }
}
$flash = getFlash();
$csrf = generateCSRF();
$B = BASE_PATH;
?>
<!DOCTYPE html>
<html lang="en" class="dark">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SonicFlow — Login</title>
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
</head>

<body class="bg-surface-950 text-white font-['DM_Sans'] min-h-screen flex items-center justify-center px-4 relative overflow-hidden">

    <!-- Animated background orbs -->
    <div class="sf-orb-container">
        <div class="sf-orb sf-orb--1"></div>
        <div class="sf-orb sf-orb--2"></div>
        <div class="sf-orb sf-orb--3"></div>
    </div>

    <!-- Noise overlay -->
    <div class="sf-noise"></div>

    <div class="w-full max-w-[400px] relative z-10">

        <!-- Glass card -->
        <div class="sf-glass-card">

            <!-- Logo -->
            <div class="text-center mb-8">
                <div class="sf-logo-ring mx-auto mb-5">
                    <div class="sf-logo-inner">
                        <svg class="w-7 h-7 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                    </div>
                </div>
                <h1 class="text-[1.75rem] font-bold tracking-tight">
                    Welcome back
                </h1>
                <p class="text-sm text-white/30 mt-1.5">Sign in to <span class="text-accent-400 font-medium">SonicFlow</span></p>
            </div>

            <!-- Flash message -->
            <?php if ($flash): ?>
                <div class="sf-flash sf-flash--<?= $flash['type'] === 'error' ? 'error' : 'success' ?> mb-5">
                    <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <?php if ($flash['type'] === 'error'): ?>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        <?php else: ?>
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <?php endif; ?>
                    </svg>
                    <span><?= htmlspecialchars($flash['msg']) ?></span>
                </div>
            <?php endif; ?>

            <!-- Form -->
            <form method="POST" class="space-y-5">
                <input type="hidden" name="_csrf" value="<?= htmlspecialchars($csrf) ?>">

                <div class="sf-field">
                    <label class="sf-label">Username</label>
                    <div class="sf-input-wrap">
                        <svg class="sf-input-icon" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        <input type="text" name="username" required autocomplete="username"
                            class="sf-input sf-input--icon" placeholder="Enter your username">
                    </div>
                </div>

                <div class="sf-field">
                    <label class="sf-label">Password</label>
                    <div class="sf-input-wrap">
                        <svg class="sf-input-icon" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        <input type="password" name="password" required autocomplete="current-password"
                            class="sf-input sf-input--icon" placeholder="Enter your password">
                    </div>
                </div>

                <button type="submit" class="sf-btn-glow w-full">
                    <span class="relative z-10 flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Sign In
                    </span>
                </button>
            </form>

            <!-- Footer link -->
            <div class="sf-divider my-6"></div>
            <p class="text-center text-sm text-white/25">
                Don't have an account?
                <a href="<?= $B ?>/register.php" class="text-accent-400 hover:text-accent-300 font-medium transition-colors">Create one</a>
            </p>
        </div>
    </div>
</body>

</html>