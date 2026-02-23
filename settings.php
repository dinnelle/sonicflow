<?php
require_once __DIR__ . '/../includes/auth.php';
initSession();
requireAPILogin();

$method = $_SERVER['REQUEST_METHOD'];

// GET: Anyone can read the API key (needed for search)
if ($method === 'GET') {
    jsonResponse(['yt_api_key' => getGlobalApiKey()]);
}

// POST: Only admin can update
if ($method === 'POST') {
    requireAdmin();
    requireCSRF();
    $data = json_decode(file_get_contents('php://input'), true);
    $key = clean($data['key'] ?? '', 50);
    $value = clean($data['value'] ?? '', 200);

    if ($key !== 'yt_api_key') jsonResponse(['error' => 'Invalid setting'], 400);

    $db = getDB();
    $stmt = $db->prepare("INSERT INTO sf_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $stmt->execute([$key, $value, $value]);
    jsonResponse(['ok' => true]);
}
