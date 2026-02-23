<?php
require_once __DIR__ . '/../config/database.php';

function initSession(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        ini_set('session.cookie_httponly', '1');
        ini_set('session.cookie_samesite', 'Lax');
        ini_set('session.use_strict_mode', '1');
        session_start();
    }
}

function generateCSRF(): string
{
    if (empty($_SESSION['_csrf'])) $_SESSION['_csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['_csrf'];
}

function requireCSRF(): void
{
    $token = $_POST['_csrf'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!hash_equals($_SESSION['_csrf'] ?? '', $token)) {
        http_response_code(403);
        die(json_encode(['error' => 'Invalid CSRF token']));
    }
}

function isLoggedIn(): bool
{
    return !empty($_SESSION['user_id']);
}
function isAdmin(): bool
{
    return ($_SESSION['role'] ?? '') === 'admin';
}
function getUserId(): int
{
    return (int) ($_SESSION['user_id'] ?? 0);
}

function requireLogin(): void
{
    if (!isLoggedIn()) {
        header('Location: ' . BASE_PATH . '/login.php');
        exit;
    }
}

function requireAPILogin(): void
{
    if (!isLoggedIn()) {
        http_response_code(401);
        die(json_encode(['error' => 'Unauthorized']));
    }
}

function requireAdmin(): void
{
    if (!isAdmin()) {
        http_response_code(403);
        die(json_encode(['error' => 'Forbidden']));
    }
}

function isRateLimited(string $ip): bool
{
    $db = getDB();
    $cutoff = date('Y-m-d H:i:s', strtotime('-' . LOGIN_LOCKOUT_MINUTES . ' minutes'));
    $stmt = $db->prepare("SELECT COUNT(*) FROM sf_login_attempts WHERE ip_address = ? AND attempted_at > ?");
    $stmt->execute([$ip, $cutoff]);
    return $stmt->fetchColumn() >= MAX_LOGIN_ATTEMPTS;
}

function recordLoginAttempt(string $ip): void
{
    $db = getDB();
    $db->prepare("INSERT INTO sf_login_attempts (ip_address) VALUES (?)")->execute([$ip]);
}

function clearLoginAttempts(string $ip): void
{
    $db = getDB();
    $db->prepare("DELETE FROM sf_login_attempts WHERE ip_address = ?")->execute([$ip]);
}

function clean(string $input, int $maxLen = 200): string
{
    return mb_substr(trim(strip_tags($input)), 0, $maxLen);
}

function validateUsername(string $u): bool
{
    return (bool) preg_match('/^[a-zA-Z0-9_]{3,20}$/', $u);
}

function jsonResponse(array $data, int $code = 200): void
{
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function setFlash(string $type, string $msg): void
{
    $_SESSION['flash'] = ['type' => $type, 'msg' => $msg];
}

function getFlash(): ?array
{
    $flash = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $flash;
}

function regenerateSession(): void
{
    session_regenerate_id(true);
}
