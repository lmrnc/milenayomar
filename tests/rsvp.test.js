const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.join(__dirname, '..');

function readHtml() {
  return fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
}

test('HTML declares a Netlify-detectable RSVP form', () => {
  const html = readHtml();

  assert.match(html, /<form name="rsvp" method="POST" data-netlify="true" netlify-honeypot="bot-field" hidden>/);
  assert.match(html, /<input type="hidden" name="form-name" value="rsvp">/);
  assert.match(html, /name="guest"/);
  assert.match(html, /name="email"/);
  assert.match(html, /name="asistencia"/);
  assert.match(html, /name="intolerancias"/);
  assert.match(html, /name="comentarios"/);
  assert.match(html, /name="acompanantes"/);
});

test('RSVP submission posts URL-encoded data to Netlify Forms', () => {
  const html = readHtml();

  assert.match(html, /fetch\('\/', \{/);
  assert.match(html, /'Content-Type': 'application\/x-www-form-urlencoded'/);
  assert.match(html, /'form-name': 'rsvp'/);
  assert.match(html, /body: encodeForm\(formPayload\)/);
});

test('RSVP keeps companion details in a readable Netlify field', () => {
  const html = readHtml();

  assert.match(html, /function formatCompanions\(\)/);
  assert.match(html, /acompanantes: formatCompanions\(\)/);
  assert.match(html, /'Asistencia: ' \+ \(c.choice === 'si' \? 'Sí' : 'No'\)/);
});

test('HTML does not expose guest list lookup logic or Apps Script endpoints', () => {
  const html = readHtml();

  assert.doesNotMatch(html, /APPS_SCRIPT_URL/);
  assert.doesNotMatch(html, /RSVP_GITHUB_PAGES_ENDPOINT/);
  assert.doesNotMatch(html, /guestList/);
  assert.doesNotMatch(html, /loadGuests/);
  assert.doesNotMatch(html, /onSearchInput/);
  assert.doesNotMatch(html, /selectGuest/);
  assert.doesNotMatch(html, /script\.google\.com/);
  assert.doesNotMatch(html, /no-cors/);
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
