<?php
/**
 * Admin API - Fibramfer Blog
 * Caminho: /api/admin.php (copiado para dist/ via public/)
 * Precisa do banco 'fibramfer' criado e migrate.sql executado.
 */

header('Content-Type: application/json; charset=utf-8');

// Configurar conforme ambiente (mude ao instalar)
$dbHost = 'localhost';
$dbName = 'fibrerbr';
$dbUser = 'root';
$dbPass = '';

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connection failed: ' . $e->getMessage()]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$body = [];

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $body = json_decode($input, true) ?: $_POST;
}

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

// Login check
if ($action === 'login' || ($method === 'POST' && !empty($body['email']) && !empty($body['password'])) && empty($body['id']) && empty($body['title'])) {
    $email = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND password_hash = ? LIMIT 1");
    $stmt->execute([$email, $password]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    respond(['auth' => !!$user, 'user' => $user ? $user['id'] : null]);
    exit;
}

// List posts
if ($method === 'GET' && ($action === 'list' || $action === '')) {
    $stmt = $pdo->query("SELECT id, title, date, category, image, content, created_at FROM posts ORDER BY date DESC, created_at DESC");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    respond(['posts' => $rows]);
    exit;
}

// Save (create or update)
if (($method === 'POST' || $method === 'PUT') && $action === 'save') {
    $post = $body['post'] ?? $body;
    $id = $post['id'] ?? '';
    $title = trim($post['title'] ?? '');
    $date = $post['date'] ?? '';
    $category = $post['category'] ?? '';
    $image = $post['image'] ?? '';
    $content = $post['content'] ?? '';

    if (empty($id)) {
        $id = $post['id'] ?? (substr(preg_replace('/[^a-z0-9]/i', '-', strtolower($title)), 0, 50) . '-' . time());
        $stmt = $pdo->prepare("INSERT INTO posts (id, title, date, category, image, content, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
        $stmt->execute([$id, $title, $date, $category, $image, $content]);
    } else {
        $stmt = $pdo->prepare("UPDATE posts SET title = ?, date = ?, category = ?, image = ?, content = ? WHERE id = ?");
        $stmt->execute([$title, $date, $category, $image, $content, $id]);
    }
    respond(['ok' => true, 'id' => $id]);
    exit;
}

// Delete
if (($method === 'POST' || $method === 'DELETE') && $action === 'delete' && !empty($body['id'])) {
    $stmt = $pdo->prepare("DELETE FROM posts WHERE id = ?");
    $stmt->execute([$body['id']]);
    respond(['ok' => true]);
    exit;
}

respond(['error' => 'Ação não reconhecida'], 400);
