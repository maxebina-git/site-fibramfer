<?php
/**
 * Fallback PHP para /blog/<slug>/ — renderizado na hora a partir do banco.
 *
 * O site é estático (SSG via Astro) para os posts conhecidos no build, mas o
 * admin publica posts a qualquer momento; sem este fallback, `/blog/<novo>/`
 * retorna 404 até o próximo build+deploy. O .htaccess direciona para cá apenas
 * os caminhos /blog/<slug>/ que não existem como arquivo/diretório.
 */

header('Content-Type: text/html; charset=utf-8');

$SITE_BASE = '/site-novo/';
$SITE_ORIGIN = 'https://fibramfer.com.br';

$slug = isset($_GET['slug']) ? strtolower(trim((string)$_GET['slug'])) : '';
$slug = preg_replace('/[^a-z0-9-]/', '', $slug);

function respond404(): void {
    http_response_code(404);
    echo '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Post não encontrado | Fibramfer</title></head><body><h1>Post não encontrado</h1><a href="/site-novo/blog/">Voltar para o Blog</a></body></html>';
    exit;
}

if ($slug === '') {
    respond404();
}

// Mesma lógica de config do admin.php: fora do site-novo, não entram no deploy.
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
    respond404();
}

try {
    $dsn = "mysql:host=$dbHost;dbname=$dbName" . ($dbPort !== '' ? ";port=$dbPort" : '') . ";charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (Exception $e) {
    respond404();
}

$stmt = $pdo->prepare("SELECT id, title, date, category, image, content, created_at FROM posts WHERE id = ? LIMIT 1");
$stmt->execute([$slug]);
$post = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$post) {
    respond404();
}

$title = $post['title'] ?? 'Post';
$titleEsc = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
$descriptionSource = $post['description'] ?? '';
if ($descriptionSource === '') {
    $descriptionSource = strip_tags((string)$post['content']);
}
$description = trim(preg_replace('/\s+/', ' ', $descriptionSource));
if (function_exists('mb_substr')) {
    $description = mb_substr($description, 0, 160);
} else {
    $description = substr($description, 0, 160);
}
$descriptionEsc = htmlspecialchars($description, ENT_QUOTES, 'UTF-8');
$categoryEsc = htmlspecialchars((string)($post['category'] ?? ''), ENT_QUOTES, 'UTF-8');
$canonical = $SITE_ORIGIN . $SITE_BASE . 'blog/' . rawurlencode($slug) . '/';
$ogImage = '';
if (!empty($post['image'])) {
    $img = (string)$post['image'];
    if (preg_match('#^(https?:)?//#', $img)) {
        $ogImage = $img;
    } elseif (isset($img[0]) && $img[0] === '/') {
        $ogImage = $SITE_ORIGIN . $SITE_BASE . ltrim($img, '/');
    } else {
        $ogImage = $SITE_ORIGIN . $SITE_BASE . 'uploads/' . $img;
    }
}
$ogImageEsc = htmlspecialchars($ogImage, ENT_QUOTES, 'UTF-8');
$imageEsc = '';
if (!empty($post['image'])) {
    $img = (string)$post['image'];
    if (preg_match('#^(https?:)?//#', $img)) {
        $imageEsc = htmlspecialchars($img, ENT_QUOTES, 'UTF-8');
    } elseif (isset($img[0]) && $img[0] === '/') {
        $imageEsc = htmlspecialchars($SITE_BASE . ltrim($img, '/'), ENT_QUOTES, 'UTF-8');
    } else {
        $imageEsc = htmlspecialchars($SITE_BASE . 'uploads/' . $img, ENT_QUOTES, 'UTF-8');
    }
}
$dateValue = (string)($post['date'] ?? '');
$dateEsc = htmlspecialchars($dateValue, ENT_QUOTES, 'UTF-8');
$contentHtml = (string)$post['content'];
// O conteúdo vem do editor do admin (HTML confiável); renderiza como o site faz.
?><!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title><?= $titleEsc ?> | Fibramfer</title>
<meta name="description" content="<?= $descriptionEsc ?>" />
<link rel="canonical" href="<?= htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') ?>" />
<meta property="og:type" content="article" />
<meta property="og:url" content="<?= htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') ?>" />
<meta property="og:title" content="<?= $titleEsc ?> | Fibramfer" />
<meta property="og:description" content="<?= $descriptionEsc ?>" />
<meta property="og:site_name" content="Fibramfer" />
<meta property="og:locale" content="pt_BR" />
<?php if ($ogImageEsc !== ''): ?><meta property="og:image" content="<?= $ogImageEsc ?>" /><?php endif; ?>
<meta name="twitter:card" content="<?= $ogImageEsc !== '' ? 'summary_large_image' : 'summary' ?>" />
<link rel="icon" type="image/svg+xml" href="<?= $SITE_BASE ?>favicon.svg" />
<style>
  :root { color-scheme: light; }
  body { margin: 0; font-family: 'Barlow Condensed', 'Inter', system-ui, sans-serif; background: #fff; color: #111; }
  header { border-bottom: 1px solid #e5e5e5; }
  header a { display: inline-block; padding: 16px 24px; font-weight: 800; font-size: 22px; letter-spacing: .04em; color: #111; text-decoration: none; }
  main { max-width: 760px; margin: 0 auto; padding: 32px 24px 64px; font-family: 'Inter', system-ui, sans-serif; }
  h1 { font-family: 'Barlow Condensed', 'Inter', system-ui, sans-serif; font-size: 34px; line-height: 1.15; margin: 0 0 12px; text-transform: uppercase; }
  time, span.cat { color: #555; font-size: 14px; }
  time { display: block; margin-bottom: 4px; }
  img { max-width: 100%; height: auto; border: 1px solid #e5e5e5; border-radius: 12px; }
  .prose :first-child { margin-top: 0; }
  footer { border-top: 1px solid #e5e5e5; padding: 16px 24px; font-size: 13px; color: #555; }
</style>
</head>
<body>
<header><a href="<?= $SITE_BASE ?>">FIBRAMFER</a></header>
<main>
  <h1><?= $titleEsc ?></h1>
  <time datetime="<?= $dateEsc ?>"><?= htmlspecialchars(date('d/m/Y', strtotime($dateValue) ?: time()), ENT_QUOTES, 'UTF-8') ?><?php if ($categoryEsc !== ''): ?> · <span class="cat"><?= $categoryEsc ?></span><?php endif; ?></time>
  <?php if ($imageEsc !== ''): ?><img src="<?= $imageEsc ?>" alt="<?= $titleEsc ?>" /><?php endif; ?>
  <div class="prose"><?= $contentHtml ?></div>
</main>
<footer>Fibramfer — Especialistas em Fibra</footer>
</body>
</html>
