<?php
require_once __DIR__ . '/../includes/auth.php';
initSession();
requireAPILogin();

$db = getDB();
$uid = getUserId();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $pls = $db->prepare("SELECT * FROM sf_playlists WHERE user_id = ? ORDER BY created_at DESC");
    $pls->execute([$uid]);
    $result = [];
    foreach ($pls->fetchAll() as $pl) {
        $trs = $db->prepare("SELECT * FROM sf_tracks WHERE playlist_id = ? ORDER BY position");
        $trs->execute([$pl['id']]);
        $result[] = ['id' => $pl['id'], 'name' => $pl['name'], 'tracks' => $trs->fetchAll()];
    }
    jsonResponse($result);
}

if ($method === 'POST') {
    requireCSRF();
    $data = json_decode(file_get_contents('php://input'), true);
    $name = clean($data['name'] ?? '', 50);
    if (!$name) jsonResponse(['error' => 'Name required'], 400);

    $count = $db->prepare("SELECT COUNT(*) FROM sf_playlists WHERE user_id = ?");
    $count->execute([$uid]);
    if ($count->fetchColumn() >= MAX_PLAYLISTS) jsonResponse(['error' => 'Max playlists reached'], 400);

    $stmt = $db->prepare("INSERT INTO sf_playlists (user_id, name) VALUES (?, ?)");
    $stmt->execute([$uid, $name]);
    jsonResponse(['id' => $db->lastInsertId(), 'name' => $name]);
}

if ($method === 'DELETE') {
    requireCSRF();
    $plId = (int) ($_GET['id'] ?? 0);
    if (!$plId) jsonResponse(['error' => 'Invalid ID'], 400);
    $db->prepare("DELETE FROM sf_playlists WHERE id = ? AND user_id = ?")->execute([$plId, $uid]);
    jsonResponse(['ok' => true]);
}
