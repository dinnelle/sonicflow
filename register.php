<?php
require_once __DIR__ . '/includes/auth.php';
initSession();
if (isLoggedIn()) {
    header('Location: ' . BASE_PATH . '/player.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCSRF();
    $username = clean($_POST['username'] ?? '', 20);
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm'] ?? '';

    if (!validateUsername($username)) setFlash('error', 'Username: 3-20 chars, letters/numbers/_ only.');
    elseif (strlen($password) < 8) setFlash('error', 'Password must be 8+ characters.');
    elseif ($password !== $confirm) setFlash('error', 'Passwords do not match.');
    else {
        $db = getDB();
        $stmt = $db->prepare("SELECT id FROM sf_users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) setFlash('error', 'Username already taken.');
        else {
            $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
            $db->prepare("INSERT INTO sf_users (username, password_hash) VALUES (?, ?)")->execute([$username, $hash]);
            setFlash('success', 'Account created! Please log in.');
            header('Location: ' . BASE_PATH . '/login.php');
            exit;
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
    <title>SonicFlow — Register</title>
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
                    Create Account
                </h1>
                <p class="text-sm text-white/30 mt-1.5">Join <span class="text-accent-400 font-medium">SonicFlow</span> today</p>
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
                        <input type="text" name="username" required minlength="3" maxlength="20" pattern="[a-zA-Z0-9_]+"
                            class="sf-input sf-input--icon" placeholder="3-20 chars, letters/numbers/_">
                    </div>
                </div>

                <div class="sf-field">
                    <label class="sf-label">Password</label>
                    <div class="sf-input-wrap">
                        <svg class="sf-input-icon" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        <input type="password" name="password" id="sfPw" required minlength="8"
                            class="sf-input sf-input--icon" placeholder="Minimum 8 characters">
                    </div>
                    <!-- Strength bar -->
                    <div class="mt-2.5 px-1">
                        <div class="flex gap-1.5">
                            <div id="sfBar0" class="sf-strength-seg"></div>
                            <div id="sfBar1" class="sf-strength-seg"></div>
                            <div id="sfBar2" class="sf-strength-seg"></div>
                            <div id="sfBar3" class="sf-strength-seg"></div>
                            <div id="sfBar4" class="sf-strength-seg"></div>
                        </div>
                        <p id="sfPwLabel" class="text-[11px] text-white/20 mt-1.5 transition-colors duration-300"></p>
                    </div>
                </div>

                <div class="sf-field">
                    <label class="sf-label">Confirm Password</label>
                    <div class="sf-input-wrap">
                        <svg class="sf-input-icon" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <input type="password" name="confirm" id="sfCpw" required
                            class="sf-input sf-input--icon" placeholder="Re-enter your password">
                    </div>
                    <p id="sfMatch" class="text-[11px] mt-1.5 ml-1 hidden transition-colors duration-300"></p>
                </div>

                <button type="submit" class="sf-btn-glow w-full">
                    <span class="relative z-10 flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                        </svg>
                        Create Account
                    </span>
                </button>
            </form>

            <!-- Footer link -->
            <div class="sf-divider my-6"></div>
            <p class="text-center text-sm text-white/25">
                Already have an account?
                <a href="<?= $B ?>/login.php" class="text-accent-400 hover:text-accent-300 font-medium transition-colors">Sign in</a>
            </p>
        </div>
    </div>

    <script>
        const sfPw = document.getElementById('sfPw'),
            sfCpw = document.getElementById('sfCpw');

        const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'];
        const labels = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
        const labelColors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-lime-400', 'text-emerald-400'];

        sfPw.addEventListener('input', () => {
            const v = sfPw.value;
            let s = 0;
            if (v.length >= 8) s++;
            if (v.length >= 12) s++;
            if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++;
            if (/\d/.test(v)) s++;
            if (/[^a-zA-Z0-9]/.test(v)) s++;

            for (let i = 0; i < 5; i++) {
                const seg = document.getElementById('sfBar' + i);
                seg.className = 'sf-strength-seg ' + (i < s ? colors[Math.min(s - 1, 4)] : '');
            }

            const lbl = document.getElementById('sfPwLabel');
            if (v.length === 0) {
                lbl.textContent = '';
                lbl.className = 'text-[11px] text-white/20 mt-1.5 transition-colors duration-300';
            } else {
                lbl.textContent = labels[Math.min(s, 4)];
                lbl.className = 'text-[11px] mt-1.5 transition-colors duration-300 ' + labelColors[Math.min(s ? s - 1 : 0, 4)];
            }
        });

        sfCpw.addEventListener('input', () => {
            const m = document.getElementById('sfMatch');
            m.classList.remove('hidden');
            const match = sfCpw.value === sfPw.value;
            m.textContent = match ? '✓ Passwords match' : '✗ Passwords do not match';
            m.className = 'text-[11px] mt-1.5 ml-1 transition-colors duration-300 ' + (match ? 'text-emerald-400' : 'text-red-400/70');
        });
    </script>
</body>

</html>