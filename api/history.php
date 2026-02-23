<?php
require_once __DIR__ . '/../includes/auth.php';
initSession();
requireLogin();

$db = getDB();
$userId = getUserId();

// GET: fetch recent play history (deduplicated)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $limit = min(max(intval($_GET['limit'] ?? 10), 1), 50);
    $stmt = $db->prepare("
        SELECT h.video_id, h.title, h.channel, h.thumbnail, h.played_at
        FROM sf_play_history h
        INNER JOIN (
            SELECT video_id, MAX(played_at) as max_played
            FROM sf_play_history
            WHERE user_id = ?
            GROUP BY video_id
        ) latest ON h.video_id = latest.video_id AND h.played_at = latest.max_played
        WHERE h.user_id = ?
        ORDER BY h.played_at DESC
        LIMIT ?
    ");
    $stmt->execute([$userId, $userId, $limit]);
    header('Content-Type: application/json');
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

// POST: record a play (skip if same video played within 5 minutes)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireCSRF();
    $data = json_decode(file_get_contents('php://input'), true);
    $videoId = clean($data['video_id'] ?? '', 20);
    $title = clean($data['title'] ?? '', 200);
    $channel = clean($data['channel'] ?? '', 100);
    $thumbnail = clean($data['thumbnail'] ?? '', 500);

    if (!$videoId || !$title) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Missing fields']);
        exit;
    }

    // Check if this video was played by this user in the last 5 minutes
    $recent = $db->prepare("
        SELECT id FROM sf_play_history
        WHERE user_id = ? AND video_id = ? AND played_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        LIMIT 1
    ");
    $recent->execute([$userId, $videoId]);

    if ($recent->fetch()) {
        // Same video within 5 min — update the timestamp instead of inserting
        $db->prepare("
            UPDATE sf_play_history
            SET played_at = CURRENT_TIMESTAMP, title = ?, channel = ?, thumbnail = ?
            WHERE user_id = ? AND video_id = ? AND played_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
            ORDER BY played_at DESC
            LIMIT 1
        ")->execute([$title, $channel, $thumbnail, $userId, $videoId]);
    } else {
        // New play — insert
        $db->prepare("
            INSERT INTO sf_play_history (user_id, video_id, title, channel, thumbnail)
            VALUES (?, ?, ?, ?, ?)
        ")->execute([$userId, $videoId, $title, $channel, $thumbnail]);
    }

    // Prune: keep only 500 most recent entries per user
    $db->prepare("
        DELETE FROM sf_play_history
        WHERE user_id = ? AND id NOT IN (
            SELECT id FROM (
                SELECT id FROM sf_play_history WHERE user_id = ? ORDER BY played_at DESC LIMIT 500
            ) keep
        )
    ")->execute([$userId, $userId]);

    header('Content-Type: application/json');
    echo json_encode(['ok' => true]);
    exit;
}

// DELETE: clear history
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    requireCSRF();
    $videoId = $_GET['video_id'] ?? '';
    if ($videoId) {
        $stmt = $db->prepare("DELETE FROM sf_play_history WHERE user_id = ? AND video_id = ?");
        $stmt->execute([$userId, $videoId]);
    } else {
        $stmt = $db->prepare("DELETE FROM sf_play_history WHERE user_id = ?");
        $stmt->execute([$userId]);
    }
    header('Content-Type: application/json');
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
header('Content-Type: application/json');
echo json_encode(['error' => 'Method not allowed']);
