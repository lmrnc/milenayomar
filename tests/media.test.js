const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { spawnSync } = require('node:child_process');

const rootDir = path.join(__dirname, '..');

function readHtml() {
  return fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
}

function readPhp() {
  return fs.readFileSync(path.join(rootDir, 'api', 'upload.php'), 'utf8');
}

function phpAvailable() {
  try {
    const r = spawnSync('php', ['-v'], { encoding: 'utf8' });
    return r.status === 0;
  } catch (_) {
    return false;
  }
}

const MOMENT_OPTIONS = ['ceremonia', 'coctel', 'cena', 'baile', 'otro'];
const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/webp',
  'image/heic', 'image/heif',
  'video/mp4', 'video/quicktime'
];

// ── Bloque A: HTML structural assertions ────────────────────

test('Media section sits between RSVP and NOSOTROS markers', () => {
  const html = readHtml();
  const rsvpIdx = html.indexOf('<!-- RSVP -->');
  const mediaIdx = html.indexOf('<!-- MEDIA -->');
  const nosotrosIdx = html.indexOf('<!-- NOSOTROS -->');

  assert.ok(rsvpIdx !== -1, 'RSVP marker missing');
  assert.ok(mediaIdx !== -1, 'MEDIA marker missing');
  assert.ok(nosotrosIdx !== -1, 'NOSOTROS marker missing');
  assert.ok(rsvpIdx < mediaIdx, 'MEDIA should come after RSVP');
  assert.ok(mediaIdx < nosotrosIdx, 'MEDIA should come before NOSOTROS');
});

test('Media form has correct attributes and points to /api/upload.php', () => {
  const html = readHtml();
  assert.match(html, /<form id="media-form"[\s\S]*?action="\/api\/upload\.php"[\s\S]*?method="POST"[\s\S]*?enctype="multipart\/form-data"/);
});

test('Media form includes a hidden honeypot', () => {
  const html = readHtml();
  assert.match(html, /<input type="text" name="bot-field"[\s\S]*?tabindex="-1"[\s\S]*?aria-hidden="true"/);
});

test('Media file input accepts all allowed MIMEs and is multiple+capture', () => {
  const html = readHtml();
  assert.match(html, /id="media-files"[\s\S]*?name="archivos\[\]"[\s\S]*?type="file"/);
  assert.match(html, /multiple/);
  assert.match(html, /capture="environment"/);
  for (const m of ALLOWED_MIME) {
    assert.ok(html.indexOf(m) !== -1, 'accept attribute missing MIME ' + m);
  }
});

test('Media metadata fields are present with correct names', () => {
  const html = readHtml();
  assert.match(html, /id="media-personas" name="personas"[\s\S]*?maxlength="200"/);
  assert.match(html, /id="media-momento" name="momento"/);
  assert.match(html, /id="media-pie" name="pie"[\s\S]*?maxlength="500"/);
  for (const m of MOMENT_OPTIONS) {
    assert.ok(html.indexOf('value="' + m + '"') !== -1, 'momento option missing: ' + m);
  }
});

test('MEDIA_CONFIG block appears exactly once in index.html', () => {
  const html = readHtml();
  const matches = html.match(/const MEDIA_CONFIG = \{/g) || [];
  assert.equal(matches.length, 1);
});

test('No mojibake in HTML', () => {
  const html = readHtml();
  assert.doesNotMatch(html, /Ã|Â|â|ð/);
});

test('api/upload.php exists with required helpers and config', () => {
  const php = readPhp();
  assert.match(php, /^<\?php/);
  assert.match(php, /const MEDIA_CONFIG = \[/);
  assert.match(php, /function media_slugify\(/);
  assert.match(php, /function media_safe_filename\(/);
  assert.match(php, /function media_truncate_field\(/);
  assert.match(php, /function media_hash_with_pepper\(/);
  assert.match(php, /function media_build_csv_row\(/);
  assert.match(php, /function media_append_csv_row\(/);
  assert.match(php, /function media_rate_limit_check_and_record\(/);
  // method, honeypot, origin checks
  assert.match(php, /REQUEST_METHOD/);
  assert.match(php, /bot-field/);
  assert.match(php, /HTTP_ORIGIN/);
});

test('api/.htaccess hardens the api directory', () => {
  const ht = fs.readFileSync(path.join(rootDir, 'api', '.htaccess'), 'utf8');
  assert.match(ht, /Options -Indexes/);
  assert.match(ht, /upload\.php/);
});

test('.gitignore excludes runtime artefacts', () => {
  const gi = fs.readFileSync(path.join(rootDir, '.gitignore'), 'utf8');
  for (const entry of ['_pepper.txt', 'private_uploads/', 'qa_shots/', 'node_modules/']) {
    assert.ok(gi.indexOf(entry) !== -1, '.gitignore missing: ' + entry);
  }
});

// ── Bloque B: client-side pure logic ─────────────────────────

// Re-implement the client classifier so we don't need to load the browser DOM.
const MEDIA_CFG_TEST = {
  MAX_FILE_SIZE_BYTES: 30 * 1024 * 1024,
  MAX_FILES_PER_SUBMISSION: 5,
  MAX_POST_SIZE_BYTES: 200 * 1024 * 1024,
  ALLOWED_MIME,
  ALLOWED_EXT: ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.mp4', '.mov']
};

function classify(file) {
  const nameLower = (file.name || '').toLowerCase();
  const extOk = MEDIA_CFG_TEST.ALLOWED_EXT.some(e => nameLower.endsWith(e));
  const mimeOk = MEDIA_CFG_TEST.ALLOWED_MIME.indexOf(file.type) !== -1;
  if (!extOk && !mimeOk) return { ok: false, reason: 'tipo' };
  if (file.size > MEDIA_CFG_TEST.MAX_FILE_SIZE_BYTES) return { ok: false, reason: 'tamano' };
  return { ok: true };
}

function validate(files) {
  if (!files || files.length === 0) return { ok: false };
  if (files.length > MEDIA_CFG_TEST.MAX_FILES_PER_SUBMISSION) return { ok: false };
  let total = 0;
  for (const f of files) {
    const r = classify(f);
    if (!r.ok) return { ok: false };
    total += f.size;
  }
  if (total > MEDIA_CFG_TEST.MAX_POST_SIZE_BYTES) return { ok: false };
  return { ok: true };
}

test('Client classify rejects unknown MIME and extension', () => {
  assert.equal(classify({ name: 'evil.exe', type: 'application/x-msdownload', size: 100 }).ok, false);
  assert.equal(classify({ name: 'photo.gif', type: 'image/gif', size: 100 }).ok, false);
});

test('Client classify accepts known image and video', () => {
  assert.equal(classify({ name: 'IMG_001.jpg', type: 'image/jpeg', size: 1_000_000 }).ok, true);
  assert.equal(classify({ name: 'VID_002.mp4', type: 'video/mp4', size: 1_000_000 }).ok, true);
  assert.equal(classify({ name: 'IMG_003.HEIC', type: 'image/heic', size: 1_000_000 }).ok, true);
});

test('Client classify rejects oversize files', () => {
  const big = MEDIA_CFG_TEST.MAX_FILE_SIZE_BYTES + 1;
  const r = classify({ name: 'big.jpg', type: 'image/jpeg', size: big });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'tamano');
});

test('Client validate enforces count and total size', () => {
  const ok = [{ name: 'a.jpg', type: 'image/jpeg', size: 1000 }];
  assert.equal(validate(ok).ok, true);

  const tooMany = Array.from({ length: 6 }, (_, i) => ({ name: i + '.jpg', type: 'image/jpeg', size: 100 }));
  assert.equal(validate(tooMany).ok, false);

  const empty = [];
  assert.equal(validate(empty).ok, false);
});

test('Throttle behaves correctly relative to last submit', () => {
  function check(now, last, gap = 10000) {
    if (!last || last <= 0) return { ok: true };
    const delta = now - last;
    if (delta < gap) return { ok: false, waitMs: gap - delta };
    return { ok: true };
  }
  assert.equal(check(1000, 0).ok, true); // no previous submit
  assert.equal(check(2000, 1000).ok, false); // 1s elapsed, blocked
  assert.equal(check(12000, 1000).ok, true); // 11s elapsed
  assert.equal(check(11000, 1000).ok, true); // exactly 10s, allowed
});

// ── Bloque C: build_csv_row JS↔PHP parity (PHP-side check) ──

test('PHP build_csv_row preserves metadata round-trip', { skip: !phpAvailable() }, () => {
  const fixture = path.join(rootDir, 'tests', 'php_helpers', 'csv_row_check.php');
  const input = JSON.stringify({
    personas: 'Marta y los primos, "los Pérez"',
    momento: 'coctel',
    pie: 'Antes del baile\nde verdad'
  });
  const r = spawnSync('php', ['-d', 'log_errors=0', '-d', 'display_errors=0', fixture], {
    input,
    encoding: 'utf8'
  });
  assert.equal(r.status, 0, 'php helper failed: ' + (r.stderr || ''));
  const out = JSON.parse(r.stdout);
  assert.equal(out.personas, 'Marta y los primos, "los Pérez"');
  assert.equal(out.momento, 'coctel');
  assert.equal(out.pie, 'Antes del baile\nde verdad');
  assert.equal(out.source, 'web');
  // timestamp ISO 8601 UTC
  assert.match(out.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+00:00$/);
});

test('PHP slugify is filename-safe', { skip: !phpAvailable() }, () => {
  const fixture = path.join(rootDir, 'tests', 'php_helpers', 'slugify_check.php');
  const cases = [
    { input: 'Marta y los primos', expectMatches: /^[a-z0-9-]+$/ },
    { input: '../../etc/passwd', expectMatches: /^[a-z0-9-]+$/ },
    { input: '', expectMatches: /^anon$/ },
    { input: 'María Sánchez Pérez', expectMatches: /^[a-z0-9-]+$/ },
    { input: 'a'.repeat(100), expectMatches: /^[a-z]{1,40}$/ }
  ];
  for (const c of cases) {
    const r = spawnSync('php', ['-d', 'display_errors=0', fixture], { input: c.input, encoding: 'utf8' });
    assert.equal(r.status, 0);
    assert.match(r.stdout.trim(), c.expectMatches, 'slugify failed for: ' + c.input);
  }
});

test('PHP safe_filename matches expected pattern', { skip: !phpAvailable() }, () => {
  const fixture = path.join(rootDir, 'tests', 'php_helpers', 'safe_filename_check.php');
  const r = spawnSync('php', ['-d', 'display_errors=0', fixture], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  // Each line is one filename
  const lines = r.stdout.trim().split(/\r?\n/);
  for (const line of lines) {
    assert.match(line, /^[0-9]+_[0-9a-f]{6}_[a-z0-9-]{1,40}\.(jpg|jpeg|png|webp|heic|heif|mp4|mov)$/, 'bad filename: ' + line);
  }
});
