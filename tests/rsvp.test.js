const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { handler } = require('../netlify/functions/rsvp');

const rootDir = path.join(__dirname, '..');

function makeResponse(status, body, contentType) {
  return {
    status,
    headers: {
      get(name) {
        return name.toLowerCase() === 'content-type' ? contentType : null;
      }
    },
    async text() {
      return body;
    }
  };
}

test('RSVP function rejects non-POST requests', async () => {
  const response = await handler({ httpMethod: 'GET' });

  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, 'POST');
  assert.deepEqual(JSON.parse(response.body), {
    ok: false,
    error: 'Method not allowed'
  });
});

test('RSVP function fails clearly when RSVP_SCRIPT_URL is missing', async () => {
  const previousUrl = process.env.RSVP_SCRIPT_URL;
  delete process.env.RSVP_SCRIPT_URL;

  try {
    const response = await handler({ httpMethod: 'POST', body: '[]' });

    assert.equal(response.statusCode, 500);
    assert.deepEqual(JSON.parse(response.body), {
      ok: false,
      error: 'RSVP_SCRIPT_URL is not configured'
    });
  } finally {
    if (previousUrl) process.env.RSVP_SCRIPT_URL = previousUrl;
  }
});

test('RSVP function forwards a dummy guest payload to the configured Apps Script', async () => {
  const previousUrl = process.env.RSVP_SCRIPT_URL;
  const previousFetch = global.fetch;
  const dummyPayload = [{
    name: 'Invitado Prueba',
    email: 'prueba@example.test',
    asistencia: 'si',
    intolerancias: 'sin gluten',
    comentarios: 'RSVP automated test',
    confirmadoPor: 'Invitado Prueba'
  }];

  let forwardedRequest;
  process.env.RSVP_SCRIPT_URL = 'https://example.test/apps-script/exec';
  global.fetch = async (url, options) => {
    forwardedRequest = { url, options };
    return makeResponse(200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8');
  };

  try {
    const response = await handler({
      httpMethod: 'POST',
      body: JSON.stringify(dummyPayload)
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['Content-Type'], 'application/json; charset=utf-8');
    assert.deepEqual(JSON.parse(response.body), { ok: true });
    assert.equal(forwardedRequest.url, process.env.RSVP_SCRIPT_URL);
    assert.equal(forwardedRequest.options.method, 'POST');
    assert.equal(forwardedRequest.options.headers['Content-Type'], 'text/plain;charset=utf-8');
    assert.deepEqual(JSON.parse(forwardedRequest.options.body), dummyPayload);
  } finally {
    global.fetch = previousFetch;
    if (previousUrl) {
      process.env.RSVP_SCRIPT_URL = previousUrl;
    } else {
      delete process.env.RSVP_SCRIPT_URL;
    }
  }
});

test('RSVP function returns a gateway error if Apps Script cannot be reached', async () => {
  const previousUrl = process.env.RSVP_SCRIPT_URL;
  const previousFetch = global.fetch;

  process.env.RSVP_SCRIPT_URL = 'https://example.test/apps-script/exec';
  global.fetch = async () => {
    throw new Error('network down');
  };

  try {
    const response = await handler({ httpMethod: 'POST', body: '[]' });

    assert.equal(response.statusCode, 502);
    assert.deepEqual(JSON.parse(response.body), {
      ok: false,
      error: 'No se pudo contactar con RSVP'
    });
  } finally {
    global.fetch = previousFetch;
    if (previousUrl) {
      process.env.RSVP_SCRIPT_URL = previousUrl;
    } else {
      delete process.env.RSVP_SCRIPT_URL;
    }
  }
});

test('HTML uses the protected RSVP endpoint and does not expose guest lookup logic', () => {
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

  assert.match(html, /var RSVP_ENDPOINT = '\/api\/rsvp';/);
  assert.doesNotMatch(html, /APPS_SCRIPT_URL/);
  assert.doesNotMatch(html, /guestList/);
  assert.doesNotMatch(html, /loadGuests/);
  assert.doesNotMatch(html, /onSearchInput/);
  assert.doesNotMatch(html, /selectGuest/);
  assert.doesNotMatch(html, /no-cors/);
  assert.doesNotMatch(html, /script\.google\.com/);
});

test('RSVP section appears immediately after the hero section', () => {
  const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const heroIndex = html.indexOf('<!-- HERO -->');
  const rsvpIndex = html.indexOf('<!-- RSVP -->');
  const nosotrosIndex = html.indexOf('<!-- NOSOTROS -->');

  assert.ok(heroIndex !== -1, 'hero section marker should exist');
  assert.ok(rsvpIndex !== -1, 'RSVP section marker should exist');
  assert.ok(nosotrosIndex !== -1, 'Nosotros section marker should exist');
  assert.ok(heroIndex < rsvpIndex, 'RSVP should be after hero');
  assert.ok(rsvpIndex < nosotrosIndex, 'RSVP should be before Nosotros');
});
