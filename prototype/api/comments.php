<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function reply(int $status, array $payload): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'GET' && $method !== 'POST') {
    header('Allow: GET, POST');
    reply(405, ['error' => 'Метод не поддерживается']);
}

// This location is outside the public www directory on the Reg.ru account.
$dataFile = dirname(__DIR__, 4) . '/young-russia-prototype-comments.json';
$handle = @fopen($dataFile, 'c+');
if ($handle === false) {
    reply(500, ['error' => 'Не удалось открыть хранилище комментариев']);
}
@chmod($dataFile, 0600);

if (!flock($handle, $method === 'POST' ? LOCK_EX : LOCK_SH)) {
    fclose($handle);
    reply(500, ['error' => 'Не удалось заблокировать хранилище']);
}

$raw = stream_get_contents($handle);
$items = json_decode($raw ?: '[]', true);
if (!is_array($items) || !array_is_list($items)) {
    flock($handle, LOCK_UN);
    fclose($handle);
    reply(500, ['error' => 'Хранилище повреждено']);
}

if ($method === 'GET') {
    $page = $_GET['page'] ?? null;
    if (is_string($page) && $page !== '') {
        $items = array_values(array_filter($items, static fn ($item) => is_array($item) && ($item['page'] ?? null) === $page));
    }
    flock($handle, LOCK_UN);
    fclose($handle);
    reply(200, $items);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== ($_SERVER['HTTP_HOST'] ?? '')) {
    flock($handle, LOCK_UN);
    fclose($handle);
    reply(403, ['error' => 'Недопустимый источник запроса']);
}
if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json')) {
    flock($handle, LOCK_UN);
    fclose($handle);
    reply(415, ['error' => 'Требуется JSON']);
}
$input = file_get_contents('php://input', false, null, 0, 12001);
if ($input === false || strlen($input) > 12000) {
    flock($handle, LOCK_UN);
    fclose($handle);
    reply(413, ['error' => 'Комментарий слишком длинный']);
}
$payload = json_decode($input, true);
$page = is_array($payload) ? ($payload['page'] ?? '') : '';
$section = is_array($payload) ? ($payload['section'] ?? '') : '';
$text = is_array($payload) ? trim((string) ($payload['text'] ?? '')) : '';
if (!is_string($page) || !preg_match('~^[a-z0-9/_-]+\.html$~', $page)
    || !is_string($section) || !preg_match('~^[a-z0-9-]{1,80}$~', $section)
    || $text === '' || mb_strlen($text, 'UTF-8') > 2000) {
    flock($handle, LOCK_UN);
    fclose($handle);
    reply(400, ['error' => 'Проверьте текст и страницу']);
}
if (count($items) >= 5000) {
    flock($handle, LOCK_UN);
    fclose($handle);
    reply(429, ['error' => 'Хранилище комментариев заполнено']);
}

$item = [
    'id' => bin2hex(random_bytes(16)),
    'createdAt' => gmdate('Y-m-d\TH:i:s\Z'),
    'page' => $page,
    'section' => $section,
    'text' => $text,
];
$items[] = $item;
$encoded = json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
rewind($handle);
if ($encoded === false || !ftruncate($handle, 0) || fwrite($handle, $encoded . "\n") === false || !fflush($handle)) {
    flock($handle, LOCK_UN);
    fclose($handle);
    reply(500, ['error' => 'Не удалось сохранить комментарий']);
}
flock($handle, LOCK_UN);
fclose($handle);
reply(201, $item);
