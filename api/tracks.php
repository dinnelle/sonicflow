<?php
require_once __DIR__ . '/../includes/auth.php';
initSession();
requireAPILogin();
requireCSRF();

$db = getDB();
$uid = getUserId();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $plId = (int) ($data['playlist_id'] ?? 0);
    $vid  = clean($data['video_id'] ?? '', 20);
    $title = clean($data['title'] ?? '', 200);
    $chan  = clean($data['channel'] ?? '', 100);
    $thumb = clean($data['thumbnail'] ?? '', 300);

    if (!$plId || !$vid) jsonResponse(['error' => 'Missing data'], 400);

    $check = $db->prepare("SELECT id FROM sf_playlists WHERE id = ? AND user_id = ?");
    $check->execute([$plId, $uid]);
    if (!$check->fetch()) jsonResponse(['error' => 'Not found'], 404);

    $count = $db->prepare("SELECT COUNT(*) FROM sf_tracks WHERE playlist_id = ?");
    $count->execute([$plId]);
    if ($count->fetchColumn() >= MAX_TRACKS_PER_PLAYLIST) jsonResponse(['error' => 'Max tracks reached'], 400);

    $pos = $db->prepare("SELECT COALESCE(MAX(position),-1)+1 FROM sf_tracks WHERE playlist_id = ?");
    $pos->execute([$plId]);

    $db->prepare("INSERT INTO sf_tracks (playlist_id, video_id, title, channel, thumbnail, position) VALUES (?,?,?,?,?,?)")
        ->execute([$plId, $vid, $title, $chan, $thumb, $pos->fetchColumn()]);
    jsonResponse(['id' => $db->lastInsertId()]);
}

if ($method === 'DELETE') {
    $trackId = (int) ($_GET['id'] ?? 0);
    if (!$trackId) jsonResponse(['error' => 'Invalid ID'], 400);
    $db->prepare("DELETE t FROM sf_tracks t INNER JOIN sf_playlists p ON t.playlist_id = p.id WHERE t.id = ? AND p.user_id = ?")
        ->execute([$trackId, $uid]);
    jsonResponse(['ok' => true]);
}
