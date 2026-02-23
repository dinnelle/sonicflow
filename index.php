<?php
require_once __DIR__ . '/includes/auth.php';
initSession();
header('Location: ' . BASE_PATH . (isLoggedIn() ? '/player.php' : '/login.php'));
exit;
