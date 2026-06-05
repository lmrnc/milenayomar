<?php
declare(strict_types=1);

define('MEDIA_TEST_MODE', true);
require __DIR__ . '/../../api/upload.php';

$input = json_decode(stream_get_contents(STDIN) ?: '{}', true) ?: [];
$pepper = 'test-pepper-32-bytes-aaaaaaaaaaaa';
$ts = 1712680000;

$row = media_build_csv_row(
    [
        'personas' => $input['personas'] ?? '',
        'momento'  => $input['momento'] ?? '',
        'pie'      => $input['pie'] ?? '',
    ],
    ['2027-04-09/coctel/file1.jpg'],
    1234,
    'pendiente',
    '',
    $pepper,
    '198.51.100.42',
    'TestAgent/1.0',
    $ts
);

$out = [
    'timestamp' => $row[0],
    'personas'  => $row[1],
    'momento'   => $row[2],
    'pie'       => $row[3],
    'count'     => $row[4],
    'archivos'  => $row[5],
    'kb'        => $row[6],
    'iphash'    => $row[7],
    'uahash'    => $row[8],
    'source'    => $row[9],
    'estado'    => $row[10],
    'notas'     => $row[11],
];

echo json_encode($out, JSON_UNESCAPED_UNICODE);
