<?php
declare(strict_types=1);

define('MEDIA_TEST_MODE', true);
require __DIR__ . '/../../api/upload.php';

$input = stream_get_contents(STDIN) ?: '';
echo media_slugify($input, 40);
