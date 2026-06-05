<?php
declare(strict_types=1);

define('MEDIA_TEST_MODE', true);
require __DIR__ . '/../../api/upload.php';

$cases = [
    [1712680000, 'a3f8b2', 'marta', 'jpg'],
    [1712680001, '000000', 'anon', 'mp4'],
    [1712680002, 'ffffff', 'maria-sanchez', 'webp'],
    [1712680003, '123abc', str_repeat('a', 50), 'png'], // slug should be capped at 40
    [1712680004, 'BAD!!!', '../../etc/passwd', 'mov'],   // rand6 invalid → reset to 000000, slug normalised to anon by safe_filename's internal regex
];

foreach ($cases as $c) {
    echo media_safe_filename($c[0], $c[1], $c[2], $c[3]) . "\n";
}
