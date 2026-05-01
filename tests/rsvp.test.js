const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.join(__dirname, '..');

function readHtml() {
  return fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
}

function readAppsScript() {
  return fs.readFileSync(path.join(rootDir, 'apps-script', 'Code.gs'), 'utf8');
}

test('HTML submits RSVP to a configurable Google Apps Script endpoint', () => {
  const html = readHtml();

  assert.match(html, /var RSVP_ENDPOINT = 'https:\/\/script\.google\.com\/macros\/s\/[^']+\/exec';/);
  assert.doesNotMatch(html, /PASTE_GOOGLE_APPS_SCRIPT_EXEC_URL_HERE/);
  assert.match(html, /fetch\(RSVP_ENDPOINT, \{/);
  assert.match(html, /mode: 'no-cors'/);
  assert.match(html, /'Content-Type': 'application\/x-www-form-urlencoded'/);
  assert.match(html, /body: encodeForm\(formPayload\)/);
});

test('HTML sends the expected Sheet fields without exposing guest lookup logic', () => {
  const html = readHtml();

  assert.match(html, /guest: selectedGuest\.name/);
  assert.match(html, /email: selectedEmail/);
  assert.match(html, /asistencia: mainChoice/);
  assert.match(html, /intolerancias: document\.getElementById\('intol-main'\)/);
  assert.match(html, /comentarios: document\.getElementById\('comment-main'\)/);
  assert.match(html, /acompanantes: formatCompanions\(\)/);
  assert.doesNotMatch(html, /guestList/);
  assert.doesNotMatch(html, /loadGuests/);
  assert.doesNotMatch(html, /onSearchInput/);
  assert.doesNotMatch(html, /selectGuest/);
});

test('Apps Script handles POST, validates payload, and returns JSON', () => {
  const code = readAppsScript();

  assert.match(code, /function doPost\(e\)/);
  assert.match(code, /function validatePayload_\(payload\)/);
  assert.match(code, /function json_\(data\)/);
  assert.match(code, /ContentService\.MimeType\.JSON/);
});

test('Apps Script preserves original CSV columns and adds operational columns', () => {
  const code = readAppsScript();

  ['guest', 'guest_link', 'Asistencia', 'Intoleracias', 'Comentarios', 'Email', 'ConfirmadoPor', 'Timestamp', 'Source']
    .forEach((header) => assert.match(code, new RegExp("'" + header + "'")));
});

test('Apps Script upserts guests and parses companion blocks', () => {
  const code = readAppsScript();

  assert.match(code, /function upsertGuest_\(sheet, row\)/);
  assert.match(code, /function findGuestRow_\(sheet, guestName\)/);
  assert.match(code, /function parseCompanions_\(text\)/);
  assert.match(code, /guest_link: mainGuest/);
});

test('RSVP section appears immediately after the hero section', () => {
  const html = readHtml();
  const heroIndex = html.indexOf('<!-- HERO -->');
  const rsvpIndex = html.indexOf('<!-- RSVP -->');
  const nosotrosIndex = html.indexOf('<!-- NOSOTROS -->');

  assert.ok(heroIndex !== -1, 'hero section marker should exist');
  assert.ok(rsvpIndex !== -1, 'RSVP section marker should exist');
  assert.ok(nosotrosIndex !== -1, 'Nosotros section marker should exist');
  assert.ok(heroIndex < rsvpIndex, 'RSVP should be after hero');
  assert.ok(rsvpIndex < nosotrosIndex, 'RSVP should be before Nosotros');
});
