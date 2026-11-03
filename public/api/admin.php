<?php
/**
 * Admin API - Fibramfer Blog
 * Caminho: /api/admin.php (copiado para dist/ via public/)
 * Precisa do banco 'fibramfer' criado e migrate.sql executado.
 */

header('Content-Type: application/json; charset=utf-8');

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

// O arquivo preferencial fica fora de site-novo e não entra no deploy.
$config = [];
$configPath = getenv('FIBRAMFER_DB_CONFIG');
$configPaths = array_filter([
    $configPath !== false ? $configPath : null,
    dirname(__DIR__, 2) . '/.fibramfer-db.php',
    __DIR__ . '/config.php',
]);
foreach ($configPaths as $path) {
    if (!is_file($path)) continue;
    $loaded = require $path;
    if (is_array($loaded)) $config = $loaded;
    break;
}

$readConfig = function ($key) use ($config) {
    $envKey = 'FIBRAMFER_DB_' . strtoupper($key);
    $envValue = getenv($envKey);
    return trim((string)($envValue !== false ? $envValue : ($config[$key] ?? '')));
};

$dbHost = $readConfig('host');
$dbName = $readConfig('name');
$dbUser = $readConfig('user');
$dbPass = $readConfig('pass');
$dbPort = $readConfig('port');

if ($dbHost === '' || $dbName === '' || $dbUser === '') {
    respond(['error' => 'Database is not configured'], 500);
    exit;
}

try {
    $dsn = "mysql:host=$dbHost;dbname=$dbName" . ($dbPort !== '' ? ";port=$dbPort" : '') . ";charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $reason = 'unknown';
    $errorInfo = $e instanceof PDOException ? ($e->errorInfo ?? []) : [];
    $driverCode = (int)($errorInfo[1] ?? 0);
    if (stripos($e->getMessage(), 'could not find driver') !== false) {
        $reason = 'pdo_mysql_missing';
    } elseif ($driverCode === 1045) {
        $reason = 'credentials_rejected';
    } elseif ($driverCode === 1049) {
        $reason = 'database_not_found';
    } elseif ($driverCode === 2002 || $driverCode === 2003) {
        $reason = 'host_unreachable';
    }
    respond(['error' => 'DB connection failed', 'reason' => $reason], 500);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$body = [];

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $body = json_decode($input, true) ?: $_POST;
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
