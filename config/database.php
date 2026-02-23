<?php
// ─── Database Config ───
// Update with your GoDaddy MySQL credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'sonic');
define('DB_USER', 'root');
define('DB_PASS', '');

// ─── Base Path (change if app is in a subfolder) ───
define('BASE_PATH', '/projects/sonicflow');

// ─── Security Config ───
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_MINUTES', 15);
define('MAX_PLAYLISTS', 50);
define('MAX_TRACKS_PER_PLAYLIST', 200);

// ─── PDO Connection ───
function getDB(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE  => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES    => false,
                ]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(['error' => 'Database connection failed']));
        }
    }
    return $pdo;
}

// ─── Get global YouTube API key ───
function getGlobalApiKey(): string
{
    $db = getDB();
    $stmt = $db->prepare("SELECT setting_value FROM sf_settings WHERE setting_key = 'yt_api_key'");
    $stmt->execute();
    return $stmt->fetchColumn() ?: '';
}
