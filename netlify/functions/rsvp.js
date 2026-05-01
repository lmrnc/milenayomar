exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Allow': 'POST',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: false, error: 'Method not allowed' })
    };
  }

  var scriptUrl = process.env.RSVP_SCRIPT_URL;
  if (!scriptUrl) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'RSVP_SCRIPT_URL is not configured' })
    };
  }

  try {
    var response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: event.body || '[]'
    });

    var text = await response.text();
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json'
      },
      body: text
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'No se pudo contactar con RSVP' })
    };
  }
};
