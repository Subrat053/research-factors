<?php
declare(strict_types=1);

/**
 * Research Factors PHP gateway for FastPanel PHP subfolder hosting.
 *
 * Public routes:
 *   /rf/api/*     -> http://127.0.0.1:5005/api/*
 *   /rf/health/*  -> http://127.0.0.1:5005/health/*
 *   /rf/uploads/* -> http://127.0.0.1:5005/uploads/*
 *
 * This avoids Apache/Nginx reverse-proxy requirements while keeping the domain
 * backend type as PHP for other applications hosted on demo.wizmonk.com.
 */

const RF_NODE_ORIGIN = 'http://127.0.0.1:5005';
const RF_TIMEOUT_SECONDS = 45;

function rf_fail(int $status, string $message): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 'PHP_GATEWAY_ERROR',
            'message' => $message,
        ],
    ]);
    exit;
}

function rf_get_target_path(): string
{
    $path = $_GET['__rf_path'] ?? '';
    if (!is_string($path) || $path === '') {
        rf_fail(400, 'Missing backend path.');
    }

    $path = '/' . ltrim(rawurldecode($path), '/');

    $allowed = (
        $path === '/api' ||
        str_starts_with($path, '/api/') ||
        $path === '/health' ||
        str_starts_with($path, '/health/') ||
        $path === '/uploads' ||
        str_starts_with($path, '/uploads/')
    );

    if (!$allowed || str_contains($path, '..')) {
        rf_fail(403, 'Backend path is not allowed.');
    }

    return $path;
}

function rf_forward_query(): string
{
    $query = $_SERVER['QUERY_STRING'] ?? '';
    if ($query === '') {
        return '';
    }

    $parts = [];
    foreach (explode('&', $query) as $part) {
        if ($part === '' || str_starts_with($part, '__rf_path=')) {
            continue;
        }
        $parts[] = $part;
    }

    return $parts ? '?' . implode('&', $parts) : '';
}

function rf_incoming_headers(): array
{
    $incoming = function_exists('getallheaders') ? getallheaders() : [];
    $blocked = [
        'host',
        'content-length',
        'connection',
        'accept-encoding',
        'transfer-encoding',
    ];

    $headers = [];
    $isMultipart = rf_is_multipart();
    foreach ($incoming as $name => $value) {
        if (!is_string($name) || in_array(strtolower($name), $blocked, true)) {
            continue;
        }
        // PHP cURL must generate its own multipart boundary when forwarding
        // uploaded files. Reusing the browser boundary breaks Multer parsing.
        if ($isMultipart && strtolower($name) === 'content-type') {
            continue;
        }
        $headers[] = $name . ': ' . $value;
    }

    $headers[] = 'Host: 127.0.0.1:5005';
    $headers[] = 'X-Forwarded-Host: ' . ($_SERVER['HTTP_HOST'] ?? 'demo.wizmonk.com');
    $headers[] = 'X-Forwarded-Proto: ' . ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http');
    $headers[] = 'X-Forwarded-For: ' . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');

    return $headers;
}

function rf_is_multipart(): bool
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    return stripos($contentType, 'multipart/form-data') !== false;
}

function rf_multipart_payload(): array
{
    $payload = [];

    foreach ($_POST as $key => $value) {
        $payload[$key] = $value;
    }

    foreach ($_FILES as $key => $file) {
        if (is_array($file['tmp_name'])) {
            foreach ($file['tmp_name'] as $index => $tmpName) {
                if (($file['error'][$index] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
                    continue;
                }
                $payload[$key . '[' . $index . ']'] = new CURLFile(
                    $tmpName,
                    $file['type'][$index] ?? 'application/octet-stream',
                    $file['name'][$index] ?? 'upload'
                );
            }
            continue;
        }

        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            continue;
        }

        $payload[$key] = new CURLFile(
            $file['tmp_name'],
            $file['type'] ?? 'application/octet-stream',
            $file['name'] ?? 'upload'
        );
    }

    return $payload;
}

$targetPath = rf_get_target_path();
$targetUrl = RF_NODE_ORIGIN . $targetPath . rf_forward_query();
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if (!function_exists('curl_init')) {
    rf_fail(500, 'PHP cURL extension is not enabled.');
}

$ch = curl_init($targetUrl);
if ($ch === false) {
    rf_fail(500, 'Unable to initialize PHP gateway.');
}

$responseHeaders = [];
$statusCode = 502;

curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => RF_TIMEOUT_SECONDS,
    CURLOPT_HTTPHEADER => rf_incoming_headers(),
    CURLOPT_HEADERFUNCTION => static function ($curl, string $headerLine) use (&$responseHeaders, &$statusCode): int {
        $trimmed = trim($headerLine);
        if ($trimmed === '') {
            return strlen($headerLine);
        }

        if (preg_match('/^HTTP\/\S+\s+(\d+)/i', $trimmed, $matches)) {
            $statusCode = (int) $matches[1];
            $responseHeaders = [];
            return strlen($headerLine);
        }

        $separator = strpos($trimmed, ':');
        if ($separator !== false) {
            $name = substr($trimmed, 0, $separator);
            $value = trim(substr($trimmed, $separator + 1));
            $blocked = ['connection', 'content-length', 'transfer-encoding'];
            if (!in_array(strtolower($name), $blocked, true)) {
                $responseHeaders[] = [$name, $value];
            }
        }

        return strlen($headerLine);
    },
]);

if ($method === 'HEAD') {
    curl_setopt($ch, CURLOPT_NOBODY, true);
} elseif (!in_array($method, ['GET', 'HEAD'], true)) {
    if (rf_is_multipart()) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, rf_multipart_payload());
    } else {
        curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
    }
}

$body = curl_exec($ch);
if ($body === false) {
    $error = curl_error($ch);
    curl_close($ch);
    rf_fail(502, 'Unable to reach Node backend: ' . $error);
}

$statusCode = curl_getinfo($ch, CURLINFO_RESPONSE_CODE) ?: $statusCode;
curl_close($ch);

http_response_code($statusCode);
foreach ($responseHeaders as [$name, $value]) {
    header($name . ': ' . $value, false);
}

if ($method !== 'HEAD') {
    echo $body;
}
