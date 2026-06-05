<?php
declare(strict_types=1);

/**
 * Guest media upload endpoint for milenayomar.es.
 * Same-origin only. Receives multipart/form-data with files + metadata,
 * stores files in a private directory OUTSIDE the web root and appends
 * a row to a CSV log. Designed for Hostinger Single (PHP 8+).
 *
 * Required runtime configuration in hPanel → PHP Configuration:
 *   upload_max_filesize = 30M
 *   post_max_size       = 200M
 *   max_file_uploads    = 5
 *   max_execution_time  = 120
 *   memory_limit        = 256M
 *
 * One-time manual setup (NOT in this repo):
 *   1) Create directory <PRIVATE_DIR> at the path configured below.
 *   2) Create <PRIVATE_DIR>/_pepper.txt with at least 32 random hex bytes.
 *      php -r "echo bin2hex(random_bytes(32));" > /home/<user>/private_uploads/_pepper.txt
 *   3) chmod 600 _pepper.txt and 0750 the directory.
 */

const MEDIA_CONFIG = [
    // Adjust this once on the server. The path MUST be outside public_html.
    'PRIVATE_DIR' => '/home/u000000000/private_uploads',

    'ALLOWED_ORIGINS' => ['https://milenayomar.es', 'https://www.milenayomar.es'],

    'ALLOWED_MIME' => [
        'image/jpeg', 'image/png', 'image/webp',
        'image/heic', 'image/heif',
        'video/mp4', 'video/quicktime',
    ],
    'ALLOWED_EXT_BY_MIME' => [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/heic' => 'heic',
        'image/heif' => 'heif',
        'video/mp4'  => 'mp4',
        'video/quicktime' => 'mov',
    ],

    'MAX_FILE_SIZE_BYTES'      => 30 * 1024 * 1024,
    'MAX_FILES_PER_SUBMISSION' => 5,
    'MAX_POST_SIZE_BYTES'      => 200 * 1024 * 1024,

    'MOMENT_OPTIONS' => ['ceremonia', 'coctel', 'cena', 'baile', 'otro'],

    'RATE_LIMIT' => [
        'PER_IP_PER_MIN'   => 5,
        'PER_IP_PER_HOUR'  => 40,
        'GLOBAL_PER_MIN'   => 15,
        'WINDOW_PURGE_SEC' => 3600,
    ],

    'CSV_HEADERS' => [
        'Timestamp', 'Personas', 'Momento', 'Pie',
        'NumArchivos', 'Archivos', 'TamanoTotalKB',
        'IPHash', 'UserAgentHash', 'Source', 'Estado', 'Notas',
    ],
];

// ============================================================
// Pure helpers (testable via php -r)
// ============================================================

function media_slugify(string $s, int $max = 40): string {
    $s = trim($s);
    if ($s === '') return 'anon';
    // Best-effort transliteration; fallback to ASCII if iconv missing.
    if (function_exists('iconv')) {
        $tx = @iconv('UTF-8', 'ASCII//TRANSLIT', $s);
        if ($tx !== false) $s = $tx;
    }
    $s = strtolower($s);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? '';
    $s = trim($s, '-');
    if ($s === '') return 'anon';
    if (strlen($s) > $max) $s = substr($s, 0, $max);
    $s = trim($s, '-');
    return $s === '' ? 'anon' : $s;
}

function media_safe_filename(int $ts, string $rand6, string $slug, string $ext): string {
    if (!preg_match('/^[0-9a-f]{6}$/', $rand6)) $rand6 = '000000';
    if (!preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $slug)) $slug = 'anon';
    if (strlen($slug) > 40) $slug = substr($slug, 0, 40);
    $ext = strtolower(preg_replace('/[^a-z0-9]/', '', $ext) ?? '');
    return $ts . '_' . $rand6 . '_' . $slug . '.' . $ext;
}

function media_truncate_field(string $s, int $max): string {
    if ($max <= 0) return '';
    if (function_exists('mb_substr') && function_exists('mb_strlen')) {
        if (mb_strlen($s, 'UTF-8') <= $max) return $s;
        return mb_substr($s, 0, $max, 'UTF-8');
    }
    if (strlen($s) <= $max) return $s;
    return substr($s, 0, $max);
}

function media_hash_with_pepper(string $value, string $pepper): string {
    return substr(hash('sha256', $value . $pepper), 0, 16);
}

function media_normalise_momento(string $raw): string {
    $raw = strtolower(trim($raw));
    return in_array($raw, MEDIA_CONFIG['MOMENT_OPTIONS'], true) ? $raw : '';
}

function media_build_csv_row(array $payload, array $relPaths, int $totalKB, string $estado, string $notas, string $pepper, string $ip, string $ua, int $tsUnix): array {
    return [
        gmdate('c', $tsUnix),
        media_truncate_field((string)($payload['personas'] ?? ''), 200),
        media_normalise_momento((string)($payload['momento'] ?? '')),
        media_truncate_field((string)($payload['pie'] ?? ''), 500),
        (string) count($relPaths),
        implode(';', $relPaths),
        (string) $totalKB,
        media_hash_with_pepper($ip, $pepper),
        media_hash_with_pepper($ua, $pepper),
        'web',
        $estado,
        $notas,
    ];
}

// ============================================================
// HTTP helpers
// ============================================================

function media_send_security_headers(): void {
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: same-origin');
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

function media_json_response(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

class MediaHttpError extends RuntimeException {
    public int $status;
    public string $code;
    public function __construct(int $status, string $code, string $message) {
        parent::__construct($message);
        $this->status = $status;
        $this->code = $code;
    }
}

// ============================================================
// Request pipeline (only runs when invoked as endpoint)
// ============================================================

if (!defined('MEDIA_TEST_MODE')) {

    media_send_security_headers();

    set_error_handler(function($severity, $message, $file, $line) {
        if (!(error_reporting() & $severity)) return false;
        throw new ErrorException($message, 0, $severity, $file, $line);
    });

    $movedFiles = []; // for rollback
    register_shutdown_function(function() use (&$movedFiles) {
        $err = error_get_last();
        if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
            foreach ($movedFiles as $f) { @unlink($f); }
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Algo no fue bien por nuestro lado', 'code' => 'fatal']);
        }
    });

    try {
        // ── Method check
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            header('Allow: POST');
            media_json_response(405, ['ok' => false, 'error' => 'Método no permitido', 'code' => 'method']);
        }

        // ── Origin check (allow same-origin native form posts without Origin)
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origin !== '' && !in_array($origin, MEDIA_CONFIG['ALLOWED_ORIGINS'], true)) {
            media_json_response(403, ['ok' => false, 'error' => 'Origen no permitido', 'code' => 'origin']);
        }

        // ── Honeypot: silent 200, NO side effects
        $bot = trim((string)($_POST['bot-field'] ?? ''));
        if ($bot !== '') {
            media_json_response(200, ['ok' => true, 'status' => 'received']);
        }

        // ── Pepper
        $pepperPath = MEDIA_CONFIG['PRIVATE_DIR'] . '/_pepper.txt';
        if (!is_file($pepperPath)) {
            error_log('media upload: missing pepper file at ' . $pepperPath);
            throw new MediaHttpError(500, 'config', 'Configuración del servidor incompleta');
        }
        $pepper = trim((string) @file_get_contents($pepperPath));
        if ($pepper === '') {
            throw new MediaHttpError(500, 'config', 'Configuración del servidor incompleta');
        }

        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $ipHash = media_hash_with_pepper($ip, $pepper);

        // ── Rate limit
        $rateRes = media_rate_limit_check_and_record(MEDIA_CONFIG['PRIVATE_DIR'], $ipHash, time());
        if (!$rateRes['ok']) {
            header('Retry-After: ' . max(1, (int) $rateRes['retryAfter']));
            media_json_response(429, ['ok' => false, 'error' => 'Demasiados envíos, prueba en unos minutos', 'code' => 'rate']);
        }

        // ── Files presence
        if (empty($_FILES['archivos']) || !is_array($_FILES['archivos']['tmp_name'])) {
            throw new MediaHttpError(400, 'empty', 'Selecciona al menos un archivo');
        }
        $tmpNames = $_FILES['archivos']['tmp_name'];
        $errs = $_FILES['archivos']['error'];
        $sizes = $_FILES['archivos']['size'];
        $count = count($tmpNames);
        if ($count < 1) {
            throw new MediaHttpError(400, 'empty', 'Selecciona al menos un archivo');
        }
        if ($count > MEDIA_CONFIG['MAX_FILES_PER_SUBMISSION']) {
            throw new MediaHttpError(400, 'count', 'Máximo ' . MEDIA_CONFIG['MAX_FILES_PER_SUBMISSION'] . ' archivos por envío');
        }

        // ── Per-file validation
        $validated = [];
        for ($i = 0; $i < $count; $i++) {
            if (($errs[$i] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
                if ($errs[$i] === UPLOAD_ERR_INI_SIZE || $errs[$i] === UPLOAD_ERR_FORM_SIZE) {
                    throw new MediaHttpError(413, 'size', 'Algún archivo supera 30 MB');
                }
                throw new MediaHttpError(400, 'upload', 'No pudimos procesar uno de los archivos');
            }
            if (!is_uploaded_file($tmpNames[$i])) {
                throw new MediaHttpError(400, 'upload', 'No pudimos procesar uno de los archivos');
            }
            $size = (int) $sizes[$i];
            if ($size <= 0 || $size > MEDIA_CONFIG['MAX_FILE_SIZE_BYTES']) {
                throw new MediaHttpError(413, 'size', 'Algún archivo supera 30 MB');
            }

            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = $finfo ? finfo_file($finfo, $tmpNames[$i]) : false;
            if ($finfo) finfo_close($finfo);
            if ($mime === false || !in_array($mime, MEDIA_CONFIG['ALLOWED_MIME'], true)) {
                throw new MediaHttpError(400, 'mime', 'Tipo de archivo no soportado');
            }

            $validated[] = [
                'tmp' => $tmpNames[$i],
                'size' => $size,
                'mime' => $mime,
            ];
        }

        // ── Build payload
        $payload = [
            'personas' => media_truncate_field(trim((string)($_POST['personas'] ?? '')), 200),
            'momento'  => media_normalise_momento((string)($_POST['momento'] ?? '')),
            'pie'      => media_truncate_field(trim((string)($_POST['pie'] ?? '')), 500),
        ];

        // ── Persist files
        $tsUnix = time();
        $dateDir = gmdate('Y-m-d', $tsUnix);
        $momentoDir = $payload['momento'] !== '' ? $payload['momento'] : 'otro';
        $targetDir = MEDIA_CONFIG['PRIVATE_DIR'] . '/' . $dateDir . '/' . $momentoDir;
        if (!is_dir($targetDir)) {
            if (!@mkdir($targetDir, 0750, true)) {
                throw new MediaHttpError(500, 'io', 'No pudimos guardar tu envío, inténtalo de nuevo');
            }
        }

        $slug = media_slugify($payload['personas'], 40);
        $relPaths = [];
        $totalBytes = 0;
        foreach ($validated as $idx => $a) {
            $rand = bin2hex(random_bytes(3));
            $ext = MEDIA_CONFIG['ALLOWED_EXT_BY_MIME'][$a['mime']];
            $finalName = media_safe_filename($tsUnix + $idx, $rand, $slug, $ext);
            $finalPath = $targetDir . '/' . $finalName;
            if (!@move_uploaded_file($a['tmp'], $finalPath)) {
                foreach ($movedFiles as $f) { @unlink($f); }
                throw new MediaHttpError(500, 'io', 'No pudimos guardar tu envío, inténtalo de nuevo');
            }
            @chmod($finalPath, 0640);
            $movedFiles[] = $finalPath;
            $relPaths[] = $dateDir . '/' . $momentoDir . '/' . $finalName;
            $totalBytes += $a['size'];
        }

        // ── Append CSV row
        $row = media_build_csv_row(
            $payload,
            $relPaths,
            (int) round($totalBytes / 1024),
            'pendiente',
            '',
            $pepper,
            $ip,
            $ua,
            $tsUnix
        );
        media_append_csv_row(MEDIA_CONFIG['PRIVATE_DIR'] . '/log.csv', MEDIA_CONFIG['CSV_HEADERS'], $row);

        media_json_response(200, ['ok' => true, 'count' => count($relPaths)]);

    } catch (MediaHttpError $e) {
        foreach ($movedFiles as $f) { @unlink($f); }
        media_json_response($e->status, ['ok' => false, 'error' => $e->getMessage(), 'code' => $e->code]);
    } catch (Throwable $t) {
        foreach ($movedFiles as $f) { @unlink($f); }
        error_log('media upload error: ' . $t->getMessage() . ' @ ' . $t->getFile() . ':' . $t->getLine());
        media_json_response(500, ['ok' => false, 'error' => 'Algo no fue bien por nuestro lado', 'code' => 'internal']);
    }
}

// ============================================================
// I/O helpers (still here so file order matches design)
// ============================================================

function media_append_csv_row(string $csvPath, array $headers, array $row): void {
    $isNew = !is_file($csvPath);
    $fp = @fopen($csvPath, 'cb+');
    if (!$fp) {
        throw new MediaHttpError(500, 'io', 'No pudimos guardar tu envío, inténtalo de nuevo');
    }
    try {
        if (!flock($fp, LOCK_EX)) {
            throw new MediaHttpError(500, 'io', 'No pudimos guardar tu envío, inténtalo de nuevo');
        }
        fseek($fp, 0, SEEK_END);
        if ($isNew || ftell($fp) === 0) {
            fwrite($fp, "\xEF\xBB\xBF"); // UTF-8 BOM for Excel
            fputcsv($fp, $headers, ',', '"', '\\');
        }
        fputcsv($fp, $row, ',', '"', '\\');
        fflush($fp);
        flock($fp, LOCK_UN);
    } finally {
        fclose($fp);
        @chmod($csvPath, 0640);
    }
}

function media_rate_limit_check_and_record(string $privateDir, string $ipHash, int $now): array {
    $path = $privateDir . '/_rate.json';
    $cfg = MEDIA_CONFIG['RATE_LIMIT'];
    $fp = @fopen($path, 'cb+');
    if (!$fp) {
        // If we can't even open the rate file, fail-open rather than block legit guests.
        return ['ok' => true, 'retryAfter' => 0];
    }
    try {
        if (!flock($fp, LOCK_EX)) {
            return ['ok' => true, 'retryAfter' => 0];
        }
        $raw = stream_get_contents($fp);
        $data = json_decode($raw ?: 'null', true);
        if (!is_array($data)) $data = ['global' => [], 'byIp' => []];
        if (!isset($data['global']) || !is_array($data['global'])) $data['global'] = [];
        if (!isset($data['byIp']) || !is_array($data['byIp'])) $data['byIp'] = [];

        // Purge older than 1 hour
        $cutoff = $now - $cfg['WINDOW_PURGE_SEC'];
        $data['global'] = array_values(array_filter($data['global'], fn($t) => $t > $cutoff));
        foreach ($data['byIp'] as $h => $arr) {
            $data['byIp'][$h] = array_values(array_filter($arr, fn($t) => $t > $cutoff));
            if (empty($data['byIp'][$h])) unset($data['byIp'][$h]);
        }

        $ipArr = $data['byIp'][$ipHash] ?? [];
        $perMin = count(array_filter($ipArr, fn($t) => $t > $now - 60));
        $perHour = count($ipArr);
        $globalMin = count(array_filter($data['global'], fn($t) => $t > $now - 60));

        if ($perMin >= $cfg['PER_IP_PER_MIN'] || $perHour >= $cfg['PER_IP_PER_HOUR'] || $globalMin >= $cfg['GLOBAL_PER_MIN']) {
            flock($fp, LOCK_UN);
            return ['ok' => false, 'retryAfter' => 60];
        }

        $ipArr[] = $now;
        $data['byIp'][$ipHash] = $ipArr;
        $data['global'][] = $now;
        $data['purgedAt'] = $now;

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($data));
        fflush($fp);
        flock($fp, LOCK_UN);
        return ['ok' => true, 'retryAfter' => 0];
    } finally {
        fclose($fp);
    }
}
