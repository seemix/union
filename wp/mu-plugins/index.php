<?php $requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH) ?: '/';

if (preg_match('#^/ru(?:/(.*))?$#', $path, $matches)) {
    $newPath = !empty($matches[1]) ? '/' . $matches[1] : '/';

    $query = parse_url($requestUri, PHP_URL_QUERY);
    $target = 'https://ru.baptist.org.md' . $newPath;

    if ($query !== null && $query !== '') {
        $target .= '?' . $query;
    }

    header('Location: ' . $target, true, 302);
    exit;
}
?>