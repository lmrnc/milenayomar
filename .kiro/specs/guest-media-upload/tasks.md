# Implementation Plan — Guest Media Upload

This document breaks the `guest-media-upload` feature into sequential, self-contained tasks. Each task is small enough to be executed by a single subagent run (~30–90 minutes of focused work) and ends with `node --test` passing **and** a git commit pushed to `origin/main`.

## Conventions used in this plan

- **Validates** lines reference the EARS requirements in `requirements.md` (e.g. `REQ-6.2`) and the correctness properties in `design.md` (e.g. `Property 5`).
- **Design ref** points to the section of `design.md` that the task implements.
- **Definition of Done** is the concrete, observable outcome that closes the task.
- The Git binary lives at `C:\Users\oleonma\AppData\Local\Programs\Git\cmd\git.exe`. Prepend its directory to `PATH` for any commit/push step.
- Working directory for everything is `c:\Users\oleonma\Desktop\OOW Report automation\milenayomar`.
- The existing 4 tests in `tests/rsvp.test.js` MUST keep passing in every task. Treat any regression as a failure.
- Do **not** modify `apps-script/Code.gs` in any task.
- Each task must end with `node --test` green, then a single commit on branch `main`, then `git push origin main`.

---

## Phase 1 — Bootstrap

### Task 1: Project scaffold (devDeps, .gitignore, README heading)

- [ ] 1.1 Update `package.json`: keep `"test": "node --test"`; add `fast-check` (latest 3.x) under `devDependencies`. Run `npm install` once locally so `package-lock.json` is generated.
- [ ] 1.2 Update `.gitignore` to include the new artefacts: `_pepper.txt`, `private_uploads/`, `qa_shots/` (already present locally), `node_modules/`. Leave the existing `apps-script/.clasp-project/` and `.clasp.json` lines untouched.
- [ ] 1.3 Confirm `package-lock.json` is **not** in `.gitignore` (it must be committable).
- [ ] 1.4 Add an empty section heading "## Subida de medios (Hostinger)" to `README.md` (placeholder — real content lands in Task 15) so subsequent tasks have a stable anchor.
- [ ] 1.5 Run `node --test` and confirm the 4 existing RSVP tests still pass (no media tests yet).

**Validates:** REQ-14.1, REQ-16.3
**Design ref:** "Repository ↔ deploy layout", `Testing Strategy → Librería de PBT`
**Files touched:** `package.json`, `package-lock.json`, `.gitignore`, `README.md`

**Definition of Done:**
- `npm install` finishes without errors and `node_modules/fast-check` exists.
- `node --test` reports `# tests 4`, `# pass 4`, `# fail 0`.
- `git status` is clean after committing.
- `git log -1 --oneline` shows the scaffold commit, and `git push origin main` succeeds.

---

## Phase 2 — Backend (`api/upload.php`)

### Task 2: PHP skeleton, security headers, request guards, MEDIA_CONFIG

- [ ] 2.1 Create `api/upload.php` with `<?php declare(strict_types=1);` and a header comment block linking back to the spec.
- [ ] 2.2 Declare `const MEDIA_CONFIG` exactly as documented in `design.md → Components and Interfaces → 2. Backend → MEDIA_CONFIG (PHP)` (PRIVATE_DIR, ALLOWED_ORIGINS, ALLOWED_MIME, ALLOWED_EXT_BY_MIME, MAX_FILE_SIZE_BYTES, MAX_FILES_PER_SUBMISSION, MAX_POST_SIZE_BYTES, MOMENT_OPTIONS, RATE_LIMIT, CSV_HEADERS).
- [ ] 2.3 Add a top-level guard `if (!defined('MEDIA_TEST_MODE'))` that wraps the HTTP pipeline so test wrappers (Task 13) can `require` the file without executing it.
- [ ] 2.4 Implement helpers `emit_security_headers()`, `json_response(int $status, array $body): void`, and a small `HttpError` class (status, code, message).
- [ ] 2.5 Implement `require_method_post()` (405 + `Allow: POST`), `swallow_honeypot_silently()` (200 with `{"ok":true,"status":"received"}`), `require_allowed_origin()` (403 if Origin set and not in `ALLOWED_ORIGINS`; pass if absent).
- [ ] 2.6 Wire the entry-point pipeline so it calls these guards in order, then returns a `501 Not implemented` JSON for now (helpers in Tasks 3–5 will replace the `501`).
- [ ] 2.7 Verify locally with `php -l api/upload.php` if `php` is on PATH; otherwise note the absence in the commit message.

**Validates:** REQ-7.1, REQ-7.2, REQ-9.1, REQ-9.2, REQ-9.3, REQ-13.2; Properties 2, 10, 11, 13, 14
**Design ref:** "Components and Interfaces → 2. Backend → 2.5 Cabeceras de seguridad", "Error Handling → Tabla de status HTTP"
**Files touched:** `api/upload.php`

**Definition of Done:**
- `api/upload.php` exists and `php -l` reports no syntax errors (or skipped if `php` missing).
- The file contains the literal string `const MEDIA_CONFIG`, function names `emit_security_headers`, `json_response`, `require_method_post`, `swallow_honeypot_silently`, `require_allowed_origin`, and the guard `MEDIA_TEST_MODE`.
- No `Access-Control-Allow-Origin: *` anywhere in the file.
- `node --test` still reports 4/4 passing.
- Commit pushed to `origin/main`.

---

### Task 3: PHP pure helpers (slugify, safe_filename, detect_mime, truncate_field, hash_with_pepper, build_csv_row)

- [ ] 3.1 Implement `slugify(string $s, int $max = 40): string` per design (strip diacritics, lowercase, collapse `[^a-z0-9]+` to `-`, trim, fall back to `'anon'` when empty).
- [ ] 3.2 Implement `safe_filename(int $ts, string $rand6, string $slug, string $ext): string` returning `<ts>_<rand6>_<slug>.<ext>` and rejecting any `ext` not in `MEDIA_CONFIG['ALLOWED_EXT_BY_MIME']`.
- [ ] 3.3 Implement `detect_mime(string $tmpPath): string` using `finfo_file(FILEINFO_MIME_TYPE)`. Never trust `$_FILES[...]['type']`.
- [ ] 3.4 Implement `truncate_field(string $s, int $max): string` that is multibyte-safe (`mb_substr`) and never returns invalid UTF-8.
- [ ] 3.5 Implement `hash_with_pepper(string $value, string $pepper): string` returning the first 16 hex chars of `sha256($value.$pepper)`.
- [ ] 3.6 Implement `build_csv_row(array $payload, array $relPaths, int $totalKB, string $estado, string $notas): array` as a pure function returning columns in the order of `MEDIA_CONFIG['CSV_HEADERS']`. Initial `Estado` is `'pendiente'` for the first version.
- [ ] 3.7 Add a CLI entry point at the bottom of the file gated by `if (PHP_SAPI === 'cli' && getenv('MEDIA_TEST_HELPER'))` that reads JSON from stdin, dispatches to one of these helpers based on `payload.fn`, and writes JSON to stdout. This is what Task 13 will call.
- [ ] 3.8 Run `php -l api/upload.php` if available.

**Validates:** REQ-4.6, REQ-6.3, REQ-6.6, REQ-6.7, REQ-7.6, REQ-12.4; Properties 5, 7, 8, 9
**Design ref:** "Components and Interfaces → 2.1 Helpers", "Components and Interfaces → 2.2 Filename strategy", "Data Models → CSV row schema"
**Files touched:** `api/upload.php`

**Definition of Done:**
- All six helpers exist and are callable from the CLI test harness via `MEDIA_TEST_HELPER=1 php api/upload.php` with stdin JSON `{ "fn": "slugify", "args": ["Marta!"] }` (manual smoke check is enough; PBT comes in Task 13).
- `php -l` reports no syntax errors (or skipped if `php` missing).
- `node --test` still reports 4/4 passing.
- Commit pushed to `origin/main`.

---

### Task 4: PHP file persistence and CSV append (persist_files, append_csv_row, rollback_partial_files)

- [ ] 4.1 Implement `parse_post_payload(): array` and `parse_uploaded_files(): array` reading from `$_POST` / `$_FILES`, normalising the `archivos[]` array shape and applying `truncate_field` to `personas`/`pie`.
- [ ] 4.2 Implement `validate_mime_and_size(array $file): void` that throws `HttpError(400, 'mime', ...)` or `HttpError(413, 'size', ...)` per the Error Handling table.
- [ ] 4.3 Implement `persist_files(array $payload, array $files): array` that:
    - Resolves the target dir `<MEDIA_CONFIG.PRIVATE_DIR>/<YYYY-MM-DD>/<momento>/` (with `momento` defaulting to `'otro'` when empty or invalid).
    - Creates intermediate dirs with `0750` and `mkdir(..., true)`.
    - For each upload, builds the final name via `safe_filename`, runs `move_uploaded_file`, then `chmod 0640`.
    - Records the in-memory list of moved paths so rollback can find them.
    - Returns `[relPaths[], totalKB]`.
- [ ] 4.4 Implement `append_csv_row(array $row): void`:
    - Opens `<PRIVATE_DIR>/log.csv` with `fopen($path, 'cb+')`, then `flock(LOCK_EX)`.
    - If file is empty, writes BOM `"\xEF\xBB\xBF"` followed by `MEDIA_CONFIG['CSV_HEADERS']` via `fputcsv`.
    - Writes the row via `fputcsv($fp, $row, ',', '"', '\\')`.
    - Releases the lock and closes.
- [ ] 4.5 Implement `rollback_partial_files(): void` that walks the in-memory list of files persisted **in this request** and `unlink`s each. Idempotent.
- [ ] 4.6 Wire the main pipeline (replacing the `501`): on success → `json_response(200, ['ok'=>true,'count'=>count($relPaths)])`; on `HttpError` → call `rollback_partial_files()` then `json_response($e->status, [...])`; on any other `Throwable` → log via `error_log` and return a generic 500.
- [ ] 4.7 Verify with `php -l api/upload.php`.

**Validates:** REQ-6.2, REQ-6.3, REQ-6.4, REQ-6.5, REQ-6.9, REQ-6.10, REQ-7.3, REQ-7.4, REQ-7.5, REQ-7.8, REQ-7.9; Properties 4, 5, 6, 12
**Design ref:** "Components and Interfaces → 2.1 Helpers", "Components and Interfaces → 2.3 Directory layout", "Data Models → CSV row schema", "Error Handling → Reglas transversales"
**Files touched:** `api/upload.php`

**Definition of Done:**
- All four helpers (`parse_*`, `persist_files`, `append_csv_row`, `rollback_partial_files`) exist and the main pipeline composes them.
- `php -l` clean (or skipped if `php` missing).
- The string `"\xEF\xBB\xBF"` (or its escaped variant) appears in `append_csv_row`.
- `node --test` still reports 4/4 passing.
- Commit pushed to `origin/main`.

---

### Task 5: PHP rate limiting (`_rate.json` with flock and three thresholds)

- [ ] 5.1 Implement `read_pepper(): string` that reads `<PRIVATE_DIR>/_pepper.txt` with `file_get_contents` + `trim`. If missing, throw `HttpError(500, 'config', 'No pudimos guardar tu envío...')` and `error_log` a clear internal message.
- [ ] 5.2 Implement `enforce_rate_limit(): void` that:
    - Computes `$ipHash = hash_with_pepper($_SERVER['REMOTE_ADDR'] ?? '', $pepper)`.
    - Opens `<PRIVATE_DIR>/_rate.json` with `LOCK_EX`, parsing JSON or starting fresh.
    - **Purges** entries older than `RATE_LIMIT.WINDOW_PURGE_SEC` seconds, both in `global` and in every `byIp[*]`. Updates `purgedAt`.
    - Counts entries in `byIp[$ipHash]` within last 60 s and last 3600 s, and entries in `global` within last 60 s.
    - If any threshold (`PER_IP_PER_MIN`, `PER_IP_PER_HOUR`, `GLOBAL_PER_MIN`) is exceeded, computes `Retry-After` as the seconds until the most-restrictive window releases, sets the header, and throws `HttpError(429, 'rate', 'Demasiados envíos, prueba en unos minutos')`.
    - Otherwise, appends `time()` to both `global` and `byIp[$ipHash]`, writes the file back, releases the lock.
- [ ] 5.3 Wire `enforce_rate_limit()` into the pipeline **after** origin/honeypot guards but **before** any file persistence.
- [ ] 5.4 Add a CLI test wrapper for `enforce_rate_limit` that accepts a synthetic `$_rate.json` path, an `IPHash`, and a `now` timestamp via stdin JSON, returning the resulting `_rate.json` content and the would-be HTTP status. (Task 13 consumes this.)
- [ ] 5.5 `php -l api/upload.php`.

**Validates:** REQ-6.6, REQ-6.7, REQ-11.4, REQ-11.5, REQ-11.6; Properties 17, 18
**Design ref:** "Data Models → `_rate.json` schema", "Data Models → `_pepper.txt`"
**Files touched:** `api/upload.php`

**Definition of Done:**
- `enforce_rate_limit` implements all three thresholds and the 1-hour purge.
- The 429 response sets `Retry-After` (verifiable via `headers_list()` in Task 14 smoke tests).
- `php -l` clean (or skipped).
- `node --test` still reports 4/4 passing.
- Commit pushed to `origin/main`.

---

### Task 6: `.htaccess` files and Private_Dir example template

- [ ] 6.1 Create `api/.htaccess` with:
    ```
    Options -Indexes
    <FilesMatch "^(?!upload\.php$).*\.php$">
        Require all denied
    </FilesMatch>
    ```
- [ ] 6.2 Create `private_uploads.htaccess.example` (kept at repo root with a `.example` suffix so `.gitignore`'s `private_uploads/` glob doesn't suppress it). Contents:
    ```
    php_flag engine off
    <FilesMatch "\.(php|phtml|phar|cgi|pl|py)$">
        Require all denied
    </FilesMatch>
    Options -Indexes
    ```
- [ ] 6.3 Add a one-line note at the top of each file pointing to the README section for context.
- [ ] 6.4 Manual sanity check: `git status` shows both files staged; `_pepper.txt` and `private_uploads/` are still ignored.

**Validates:** REQ-7.7, REQ-8.1, REQ-8.2, REQ-8.3, REQ-8.4
**Design ref:** "Components and Interfaces → 2.4 `api/.htaccess`"
**Files touched:** `api/.htaccess`, `private_uploads.htaccess.example`

**Definition of Done:**
- Both files exist with the exact directives above.
- `git ls-files | findstr htaccess` lists both files.
- `node --test` still reports 4/4 passing.
- Commit pushed to `origin/main`.

---

## Phase 3 — Frontend (`index.html`)

### Task 7: `Media_Section` HTML markup

- [ ] 7.1 Locate the existing `<!-- RSVP -->` block in `index.html` and the `<!-- NOSOTROS -->` block that follows it. Insert a new `<!-- MEDIA -->` … `<!-- /MEDIA -->` block strictly between them, preserving the existing flow Hero → RSVP → Media → Nosotros.
- [ ] 7.2 The block must contain a `<section id="media" class="vichy" hidden>` (the `hidden` attribute is the off-switch — Task 9 will toggle it via JS).
- [ ] 7.3 Add the section label, `<h2>` with Cormorant Garamond italic styling, and a warm Spanish intro paragraph using the `ustedes`/`les` register, explicitly stating the material does **not** go to a public gallery.
- [ ] 7.4 Add the `<form id="media-form" action="/api/upload.php" method="POST" enctype="multipart/form-data" novalidate>` exactly as specified in `design.md → 1.1 HTML structure`.
- [ ] 7.5 Inside the form, in this order:
    - Honeypot `<input type="text" name="bot-field" tabindex="-1" autocomplete="off" aria-hidden="true">` with `style="position:absolute;left:-9999px;"`.
    - File input `<input id="media-files" name="archivos[]" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime" multiple capture="environment">`.
    - `<ul id="media-file-list" aria-live="polite">`.
    - `personas` `<input type="text" maxlength="200">` with Spanish placeholder.
    - `momento` `<select>` with options `<option value="">Sin especificar</option>` plus the five `MOMENT_OPTIONS` (display labels include the accent: "Cóctel"; values are URL-safe: `coctel`).
    - `pie` `<textarea maxlength="500" rows="3">` with Spanish placeholder.
    - `<progress id="media-progress" value="0" max="100" hidden>`.
    - `<p id="media-status" role="status" aria-live="polite">`.
    - `<button type="submit" id="media-submit" class="btn-submit">Enviar</button>`.
- [ ] 7.6 No new font families. No fetched assets. All copy in Spanish (Spain), `ustedes`/`les`, no acronyms in user-visible text (use "MB", not "megabytes" — see REQ-12.3 nuance: avoid technical acronyms but `MB` is the form already accepted by REQ-12.3).
- [ ] 7.7 Confirm the file is still saved as UTF-8 without BOM (matching existing `index.html`); no `Ã`, `Â`, `â`, `ð` sequences anywhere.

**Validates:** REQ-1.1, REQ-1.2, REQ-1.5, REQ-2.1, REQ-3.1, REQ-3.2, REQ-3.3, REQ-3.4, REQ-3.6, REQ-4.1, REQ-4.2, REQ-4.3, REQ-4.4, REQ-4.5, REQ-11.1, REQ-12.1, REQ-12.2, REQ-12.4, REQ-14.3; Property 19
**Design ref:** "Components and Interfaces → 1.1 HTML structure"
**Files touched:** `index.html`

**Definition of Done:**
- `<!-- RSVP -->` index < `<!-- MEDIA -->` index < `<!-- NOSOTROS -->` index in the file.
- All five `MOMENT_OPTIONS` appear as `<option value="…">` with the exact values `ceremonia`, `coctel`, `cena`, `baile`, `otro`.
- `node --test` still reports 4/4 passing (RSVP tests must not break).
- No mojibake characters in the file.
- Commit pushed to `origin/main`.

---

### Task 8: `Media_Section` CSS (mobile-first, 44 px touch targets)

- [ ] 8.1 Inside the existing `<style>` block of `index.html`, add a `/* MEDIA */` region before the `</style>` closing tag (or in a clearly delimited subsection if the existing styles are organised).
- [ ] 8.2 Style the section to match the visual language of the RSVP section (same spacing, same `.vichy` background, same heading treatment).
- [ ] 8.3 Apply `min-height: 44px` and `font-size: 16px` (to prevent iOS zoom) to `#media-form input`, `#media-form select`, `#media-form textarea`, `#media-form button`.
- [ ] 8.4 Mobile-first: at `@media (max-width: 600px)`, stack form controls in a single column and ensure tap targets remain ≥ 44 px regardless of content.
- [ ] 8.5 Style `<progress id="media-progress">` with a visible fill on iOS Safari, Chrome Android, Firefox.
- [ ] 8.6 Style `#media-file-list` (compact list with name + MB, an accessible delete button per item with `aria-label="Quitar este archivo"`).
- [ ] 8.7 Status region uses the warm muted tone for success and a distinct, non-alarming colour for error states.
- [ ] 8.8 No new font families introduced.

**Validates:** REQ-1.3, REQ-1.4, REQ-3.6, REQ-12.2
**Design ref:** "Components and Interfaces → 1.1 HTML structure" (responsive notes)
**Files touched:** `index.html`

**Definition of Done:**
- All `<input>`, `<select>`, `<textarea>`, `<button>` inside `#media-form` have computed `min-height: 44px` (visible in DevTools).
- `node --test` still reports 4/4 passing.
- Commit pushed to `origin/main`.

---

### Task 9: `Media_Section` JS module (config + pure functions + submit handler)

- [ ] 9.1 In `index.html` JS block, add a clearly commented region delimited by `// --- pure-functions-begin ---` / `// --- pure-functions-end ---` (Task 11 reads this region in tests).
- [ ] 9.2 Inside the region, declare `const MEDIA_CONFIG = { ... }` with all keys from `design.md → 1.2 MEDIA_CONFIG` (`ENABLED`, `ENDPOINT`, `PROD_HOSTNAME`, `MAX_FILE_SIZE_BYTES`, `MAX_FILES_PER_SUBMISSION`, `MAX_POST_SIZE_BYTES`, `ALLOWED_MIME`, `ALLOWED_EXT`, `MOMENT_OPTIONS`, `CLIENT_THROTTLE_MS`, `REQUEST_TIMEOUT_MS`, `STORAGE_KEY_LAST_SUBMIT`).
- [ ] 9.3 Implement the pure functions exactly as spec'd in design 1.3:
    - `isFeatureEnabledHere()` (hostname guard + ENABLED flag).
    - `classifyFile(file)` (returns `{ ok, reason? }`).
    - `validateSubmission(files)` (count + per-file + total size + MIME).
    - `checkClientThrottle(now = Date.now())` (returns `{ ok, waitMs? }`).
    - `messageFor(reason, file)` (Spanish copy in the established warm tone — no acronyms).
    - `submitWithProgress(formData, { onProgress, signal })` (XHR-based with `xhr.upload.onprogress`).
- [ ] 9.4 Outside the pure region, attach the submit handler to `#media-form`:
    1. `event.preventDefault()` (only if `XMLHttpRequest` and `FormData` exist).
    2. If `!isFeatureEnabledHere()` → show "Estamos rematando esta sección..." and return.
    3. Run `validateSubmission` → on failure show the message and return without contacting the server.
    4. Run `checkClientThrottle` → on failure show remaining seconds.
    5. Build `FormData` from the form including `archivos[]` and metadata.
    6. Disable button + inputs.
    7. `AbortController` + `setTimeout(MEDIA_CONFIG.REQUEST_TIMEOUT_MS, () => controller.abort())`.
    8. Call `submitWithProgress` updating `<progress>` 0→100.
    9. On success: warm Spanish message, `sessionStorage.setItem(STORAGE_KEY_LAST_SUBMIT, Date.now())`, clear file input but **only on success**, re-enable button.
    10. On any failure (timeout, network, 4xx, 5xx): preserve all metadata fields and the file list, show `body.error` if present, otherwise the category-appropriate Spanish message; re-enable button.
- [ ] 9.5 Toggle `document.getElementById('media').hidden = !MEDIA_CONFIG.ENABLED` on DOMContentLoaded so the master switch works.
- [ ] 9.6 Add the file list rendering: when `<input type="file">` `change` fires, render filename + size in MB plus a delete button per entry; clicking delete removes that file from a JS-tracked `File[]` array (since `FileList` is not mutable, the form submit pulls files from this array via a fresh `DataTransfer`).
- [ ] 9.7 Implement the native fallback path: if `window.XMLHttpRequest` or `window.FormData` are not present, do not attach the submit listener — the form will submit natively to `/api/upload.php`.
- [ ] 9.8 Sanity-check: open `index.html` locally; selecting a too-big file or a `.txt` file shows a Spanish message and no XHR fires (Network tab).

**Validates:** REQ-1.6, REQ-2.2, REQ-2.3, REQ-2.4, REQ-2.5, REQ-2.6, REQ-2.7, REQ-3.4, REQ-3.5, REQ-3.6, REQ-5.1, REQ-5.2, REQ-5.3, REQ-5.4, REQ-10.1, REQ-10.2, REQ-10.3, REQ-10.4, REQ-11.2, REQ-11.3, REQ-13.1, REQ-15.6; Properties 1, 15, 16, 20
**Design ref:** "Components and Interfaces → 1.2 `MEDIA_CONFIG`", "Components and Interfaces → 1.3 Frontend module"
**Files touched:** `index.html`

**Definition of Done:**
- `index.html` contains exactly one `MEDIA_CONFIG = {` literal.
- The `// --- pure-functions-begin ---` / `// --- pure-functions-end ---` markers exist and bracket the six pure functions.
- Manual smoke check confirms client-side rejection of out-of-policy files (no network call) and the hostname guard message when run from `localhost` is shown only when `PROD_HOSTNAME` whitelisting is removed (or the test guard exercised manually).
- `node --test` still reports 4/4 passing.
- Commit pushed to `origin/main`.

---

## Phase 4 — Tests (`tests/media.test.js`)

### Task 10: Bloque A — Structural assertions and mojibake guard

- [ ] 10.1 Create `tests/media.test.js` mirroring the style of `tests/rsvp.test.js` (`node:test`, `node:assert/strict`, sync FS reads, no async setup).
- [ ] 10.2 A.1 — Assert `position(<!-- RSVP -->) < position(<!-- MEDIA -->) < position(<!-- NOSOTROS -->)` in `index.html`.
- [ ] 10.3 A.2 — Assert the `<form id="media-form" action="/api/upload.php" method="POST" enctype="multipart/form-data"` regex matches.
- [ ] 10.4 A.3 — Assert the honeypot input is present with `name="bot-field"`, `tabindex="-1"`, and either `aria-hidden="true"` or off-screen positioning.
- [ ] 10.5 A.4 — Assert the file input has `type="file"`, `name="archivos[]"`, `multiple`, `capture="environment"`, and an `accept` attribute that contains every entry of `ALLOWED_MIME`.
- [ ] 10.6 A.5 — Assert the three metadata inputs (`personas`, `momento`, `pie`) exist with the expected `name` attributes and that the `<select name="momento">` contains exactly one `<option value="">` plus one `<option value="X">` per entry of `MOMENT_OPTIONS = ['ceremonia','coctel','cena','baile','otro']`.
- [ ] 10.7 A.6 — Assert `index.html` contains exactly one occurrence of `MEDIA_CONFIG = {`.
- [ ] 10.8 A.7 — Mojibake guard: `assert.doesNotMatch(html, /Ã|Â|â|ð/)` (Property 19).
- [ ] 10.9 A.8 — Read `api/upload.php` and assert presence of: `<?php`, `const MEDIA_CONFIG`, `function slugify`, `function safe_filename`, `function detect_mime`, `function append_csv_row` (or `function append_to_csv`), the literal `'POST'` for method check, and `bot-field` for honeypot check.
- [ ] 10.10 A.9 — Read `api/.htaccess` and assert it contains `Options -Indexes` and a deny-by-default block for non-`upload.php` PHP files.
- [ ] 10.11 A.10 — Read `.gitignore` and assert it contains `_pepper.txt`, `private_uploads/`, `qa_shots/`, `node_modules/`.
- [ ] 10.12 A.11 — Read `README.md` and assert it contains the heading "Subida de medios (Hostinger)" (full content lands in Task 15; Task 10 only checks the heading exists).

**Validates:** REQ-14.2 (sub-points 1–6), REQ-14.3, REQ-1.2, REQ-3.1, REQ-3.2, REQ-4.1, REQ-4.2, REQ-4.3, REQ-7.7, REQ-8.2, REQ-13.2, REQ-16.3; Property 19
**Design ref:** "Testing Strategy → Bloque A"
**Files touched:** `tests/media.test.js` (new)

**Definition of Done:**
- `tests/media.test.js` exists and contains 11 distinct `test('...A.N...', ...)` blocks (or one block per assertion, your choice — count matches).
- `node --test` reports `# tests 4 + 11 = 15`, all passing.
- Commit pushed to `origin/main`.

---

### Task 11: Bloque B — Client property tests with `fast-check`

- [ ] 11.1 At the top of `tests/media.test.js`, add `const fc = require('fast-check');`.
- [ ] 11.2 Implement helpers to extract the pure-function region from `index.html` and `eval` it inside a sandboxed scope (using `vm.createContext`) so the same code that runs in the browser is what the tests exercise. Provide stubs for `window`, `sessionStorage`, `XMLHttpRequest` as needed.
- [ ] 11.3 B.1 — Property 1: arbitrary `Submission` violating any of the four client rules (empty, > MAX, bad MIME+ext, oversize, total > MAX_POST). Spy on a stubbed `XMLHttpRequest`. Assert `xhrSpy.callCount === 0` for every violating shrink. `numRuns: 100`.
- [ ] 11.4 B.2 — Property 16: `fc.integer({ min: 0, max: 30000 })` for Δ; assert `checkClientThrottle(last + Δ).ok === (Δ >= 10000)`.
- [ ] 11.5 B.3 — Property 20: `fc.string({ minLength: 1, maxLength: 60 })` for hostname; assert `isFeatureEnabledHere()` returns `true` only when hostname ∈ {`milenayomar.es`, `localhost`, `127.0.0.1`} **and** `MEDIA_CONFIG.ENABLED` is true.
- [ ] 11.6 B.4 — Property 15: snapshot all `<input>`/`<textarea>` values + the file array, simulate each error category (timeout, network, 4xx, 5xx) via the XHR spy, and assert the snapshot is identical post-failure.
- [ ] 11.7 Tag every property test with `// Feature: guest-media-upload, Property N: <summary>`.

**Validates:** REQ-2.6, REQ-3.5, REQ-5.1, REQ-5.2, REQ-5.3, REQ-10.2, REQ-10.3, REQ-11.2, REQ-11.3, REQ-15.6; Properties 1, 15, 16, 20
**Design ref:** "Testing Strategy → Bloque B"
**Files touched:** `tests/media.test.js`

**Definition of Done:**
- Four new property-based tests (B.1–B.4) added to `tests/media.test.js`.
- Each PBT runs with `numRuns: 100` and a stable seed (e.g. `seed: 42`).
- `node --test` reports `# tests 4 + 11 + 4 = 19`, all passing.
- No flake on three consecutive `node --test` runs.
- Commit pushed to `origin/main`.

---

### Task 12: Bloque C — `build_csv_row` JS round-trip (mirror of PHP)

- [ ] 12.1 Inside `tests/media.test.js`, implement two pure helpers `build_csv_row_js(payload, relPaths, totalKB, estado, notas)` and `parse_csv_row_js(line)` that mirror the PHP contract from `design.md → Data Models → CSV row schema`. Use minimal hand-rolled CSV serialiser/parser; no external dependencies beyond `fast-check`.
- [ ] 12.2 C.1 — Property 8: `personas`, `pie ∈ fc.fullUnicodeString({ maxLength: 1000 })`; `momento ∈ fc.constantFrom(...MOMENT_OPTIONS, '', 'algo-invalido')`; `source = 'web'`. Build a row, serialise it, parse it, and assert that `Personas`, `Pie`, `Momento`, `Source` round-trip modulo truncation (`Personas` ≤ 200 mb-chars, `Pie` ≤ 500 mb-chars) and momento normalisation (`'' | invalid → 'otro'` for path purposes, but the CSV column preserves the original empty/normalised value as defined in design).
- [ ] 12.3 C.2 — Property 9: `truncate_field_js(s, max)` invariants (`mb_strlen(result) ≤ max`, valid UTF-8, identity when `mb_strlen(s) ≤ max`) using `fc.fullUnicodeString({ maxLength: 600 })` and `max ∈ fc.constantFrom(0, 200, 500)`.
- [ ] 12.4 Add a non-PBT regression case asserting the round-trip survives every literal mojibake-trap character (`Ñ`, `Á`, `é`, `ü`, `"`, `,`, `;`, `\n`).

**Validates:** REQ-4.6, REQ-12.4, REQ-14.4; Properties 8, 9, 19
**Design ref:** "Testing Strategy → Bloque C", "Data Models → CSV row schema"
**Files touched:** `tests/media.test.js`

**Definition of Done:**
- Two PBT tests + one regression test added.
- `node --test` reports `# tests 19 + 3 = 22`, all passing.
- Commit pushed to `origin/main`.

---

### Task 13: Bloque D — Cross JS↔PHP property tests via `spawnSync('php', …)`

- [ ] 13.1 Create directory `tests/php_helpers/` and add per-helper wrapper scripts that:
    - `define('MEDIA_TEST_MODE', true);`
    - `require __DIR__ . '/../../api/upload.php';`
    - Read JSON from stdin, dispatch on `payload.fn` to one of the pure helpers (`slugify`, `safe_filename`, `detect_mime` is harder — skip for D.1 and rely on a fixture file map instead, `truncate_field`, `hash_with_pepper`, `build_csv_row`, `enforce_rate_limit_test_harness`), and write JSON to stdout.
- [ ] 13.2 In `tests/media.test.js`, detect `php` availability with `spawnSync('php', ['-v'])` once at module load. If `status !== 0` mark the entire D block as skipped with a clear `t.skip('php not in PATH; D block skipped')` per test.
- [ ] 13.3 D.1 — Properties 5 + 7: `personas ∈ fc.fullUnicodeString()` (including `..`, `/`, `\0`, control chars, empty); call `safe_filename(ts, rand6, slugify(personas), ext)` via PHP and assert the result matches `^[0-9]+_[0-9a-f]{6}_[a-z0-9-]{1,40}\.(jpg|jpeg|png|webp|heic|heif|mp4|mov)$`. Call `hash_with_pepper(s, p)` and assert `^[0-9a-f]{16}$` and that two distinct peppers produce distinct hashes.
- [ ] 13.4 D.2 — Property 9 (PHP-side): same input as Task 12 C.2 routed through `truncate_field` in PHP; same invariant.
- [ ] 13.5 D.3 — Property 8 (cross): for arbitrary `Submission` payloads, compare row produced by `build_csv_row_js` (Task 12) and row produced by `build_csv_row` in PHP — assert they are identical arrays.
- [ ] 13.6 D.4 — Properties 17 + 18: generate sequences of timestamps + `IPHash` with `fast-check`. For each sequence, drive a fresh `_rate.json` in `fs.mkdtempSync()`, calling the harness sequentially. Assert that the 429 boundary corresponds exactly to the three thresholds, and that no timestamp older than 3600 s persists after each call.
- [ ] 13.7 D.5 — Property 11: for `bot-field ∈ fc.string({ minLength: 1, maxLength: 200 })` (excluding pure whitespace strings), drive a request-shaped harness and assert the response is `{status: 200, body: {ok:true,status:'received'}}` and that the temp `Private_Dir` and `log.csv` are unchanged on disk.

**Validates:** REQ-4.6, REQ-6.3, REQ-6.6, REQ-6.7, REQ-7.2, REQ-7.6, REQ-11.4, REQ-11.5, REQ-11.6, REQ-14.5; Properties 5, 7, 8, 9, 11, 17, 18
**Design ref:** "Testing Strategy → Bloque D"
**Files touched:** `tests/media.test.js`, `tests/php_helpers/*.php` (new)

**Definition of Done:**
- `tests/php_helpers/` exists with one wrapper per helper used by D.1–D.5.
- When `php` is on PATH, `node --test` runs the D block and reports all D tests passing.
- When `php` is missing, the D block is skipped (not failed) — verifiable by temporarily renaming the `php` binary path and rerunning.
- `node --test` reports `# tests 22 + 5 = 27` passing (or 22 with 5 skipped), `# fail 0` either way.
- Commit pushed to `origin/main`.

---

### Task 14: Bloque E — Permissions, BOM, security-headers smoke

- [ ] 14.1 E.1 — Permissions: in a temp dir, drive `persist_files` (via the same PHP harness as Task 13). Assert `(stat.mode & 0o777) === 0o640` for files and `=== 0o750` for created subdirs. Skip with a clear message on Windows where POSIX bits don't apply (detect via `process.platform === 'win32'`).
- [ ] 14.2 E.2 — BOM: in a temp dir with no `log.csv`, drive `append_csv_row` with one row, then read the file's first three bytes and assert they equal `0xEF 0xBB 0xBF`. Then drive a second `append_csv_row` and assert the BOM is **not** duplicated.
- [ ] 14.3 E.3 — Security headers: drive a small PHP script that requires `api/upload.php` with a mock `$_SERVER` (`REQUEST_METHOD = 'POST'`, no `Origin`, etc.), captures `headers_list()` after `emit_security_headers()`, and writes the list to stdout. Assert the four required headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`) are present. Assert no header has value `Access-Control-Allow-Origin: *`.
- [ ] 14.4 All three E tests skip cleanly when `php` is not on PATH (consistent with Task 13).

**Validates:** REQ-6.9, REQ-7.8, REQ-9.1, REQ-9.3; Properties 12, 13
**Design ref:** "Testing Strategy → Bloque E"
**Files touched:** `tests/media.test.js`, possibly an extra `tests/php_helpers/headers_dump.php`

**Definition of Done:**
- E.1, E.2, E.3 implemented; each skips cleanly when its precondition (`php` available, POSIX FS) is unmet.
- On a machine with `php` installed, `node --test` reports `# tests 27 + 3 = 30` passing.
- On a machine without `php`, the count drops accordingly via `# skipped` rather than `# fail`.
- Commit pushed to `origin/main`.

---

## Phase 5 — Documentation

### Task 15: README "Subida de medios (Hostinger)" — full operational guide

- [ ] 15.1 Replace the placeholder heading from Task 1 with a complete section. Use Spanish (Spain), `ustedes`/`les`, warm but practical tone.
- [ ] 15.2 Sub-section "Estructura en Hostinger": describe `public_html/` (== repo content) vs `private_uploads/` (== `Private_Dir`, sibling of `public_html`, NOT inside it).
- [ ] 15.3 Sub-section "Primer despliegue (una sola vez)":
    - Crear `private_uploads/` por File Manager (hPanel → Files → File Manager).
    - Generar `_pepper.txt` con `php -r 'echo bin2hex(random_bytes(32));' > .../private_uploads/_pepper.txt` y `chmod 600`.
    - Copiar `private_uploads.htaccess.example` (del repo) a `private_uploads/.htaccess` directamente en el servidor.
    - Subir/desplegar `api/upload.php` y `api/.htaccess` como parte del repo.
- [ ] 15.4 Sub-section "Configuración PHP (hPanel → Avanzado → Configuración PHP)" con la tabla de directivas: `upload_max_filesize=30M`, `post_max_size=200M`, `max_file_uploads≥5`, `max_execution_time=120`, `memory_limit=256M`. Mencionar el caveat de Hostinger sobre la relación `post_max_size` ↔ `upload_max_filesize`.
- [ ] 15.5 Sub-section "Despliegue continuo": explicar las dos opciones — (a) zip + File Manager / FTP, excluyendo `.kiro/`, `tests/`, `node_modules/`, `qa_shots/`, `private_uploads.htaccess.example` (este último se sube manualmente la primera vez); (b) Hostinger Git integration (rama `main`, ruta `public_html/`).
- [ ] 15.6 Sub-section "Dónde miramos las fotos y vídeos": navegar a `private_uploads/` por File Manager o SFTP; abrir `log.csv` con Excel/Numbers (UTF-8 con BOM, las tildes salen bien).
- [ ] 15.7 Sub-section "Cómo cambiar los límites o los momentos": editar `MEDIA_CONFIG` en `index.html` **y** en `api/upload.php` (los dos sitios). Incluir checklist de claves a sincronizar.
- [ ] 15.8 Sub-section "Cómo ocultar la sección entera": poner `MEDIA_CONFIG.ENABLED = false` en `index.html` (un único interruptor, deja el HTML intacto pero `hidden`).
- [ ] 15.9 Recordatorio final: el repositorio es público; el endpoint **no es secreto** pero los archivos subidos sí lo son; `_pepper.txt` **nunca** se versiona; los archivos viven fuera de `public_html` por construcción.

**Validates:** REQ-13.4, REQ-15.3, REQ-15.4, REQ-15.5, REQ-16.1, REQ-16.2
**Design ref:** "Repository ↔ deploy layout", "Components and Interfaces → 4. PHP runtime configuration", "Data Models → `_pepper.txt`"
**Files touched:** `README.md`

**Definition of Done:**
- README contains all eight sub-sections listed above with concrete commands and paths.
- Task 10's A.11 assertion still passes (the heading literal still matches).
- `node --test` still reports the full passing count from Task 14 (no regressions).
- Commit pushed to `origin/main`.

---

## Cross-task invariants (must hold after every task)

- `node --test` ends with `# fail 0`.
- `tests/rsvp.test.js` is unmodified (or modified only by additive whitespace), and its 4 tests pass.
- `apps-script/Code.gs` is untouched.
- `_pepper.txt` and `private_uploads/` (the directory, not the `.example` template at the root) are absent from the index.
- `git status` is clean immediately after the task's commit.
- The commit message is descriptive and references the task ID, e.g. `feat(media): task 4 — persist_files + append_csv_row + rollback`.
