<?php
require_once __DIR__ . '/includes/auth.php';
initSession();
session_destroy();
header('Location: ' . BASE_PATH . '/login.php');
exit;
