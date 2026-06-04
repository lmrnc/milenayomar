const CONFIG = {
  RSVP_SHEET_NAME: 'RSVP_Web',
  RSVP_HEADERS: [
    'Timestamp',
    'Nombre',
    'Email',
    'Asistencia',
    'Intolerancias',
    'Comentarios',
    'Acompanantes',
    'Estado',
    'ValidadoCon',
    'Notas',
    'Source'
  ]
};

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    validatePayload_(payload);

    const sheet = getOrCreateRsvpSheet_();
    ensureHeaders_(sheet);
    const rowNumber = appendRsvp_(sheet, buildRsvpRow_(payload));

    return json_({ ok: true, status: 'recorded', rowNumber });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function doGet() {
  return json_({ ok: true, service: 'milenayomar-rsvp' });
}

function parsePayload_(e) {
  if (!e) throw new Error('Missing request');

  if (e.postData && e.postData.contents) {
    const raw = e.postData.contents;
    if (raw.trim().charAt(0) === '{') return JSON.parse(raw);
    return formToObject_(raw);
  }

  if (e.parameter) return e.parameter;

  throw new Error('Missing payload');
}

function formToObject_(raw) {
  return raw.split('&').reduce((acc, pair) => {
    const parts = pair.split('=');
    const key = decodeURIComponent(parts[0] || '').trim();
    const value = decodeURIComponent((parts.slice(1).join('=') || '').replace(/\+/g, ' ')).trim();
    if (key) acc[key] = value;
    return acc;
  }, {});
}

function validatePayload_(payload) {
  if (payload['bot-field']) throw new Error('Spam detected');
  if (!payload.guest || payload.guest.trim().length < 2) throw new Error('Missing guest');
  if (!payload.asistencia) throw new Error('Missing asistencia');
}

function getOrCreateRsvpSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(CONFIG.RSVP_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(CONFIG.RSVP_SHEET_NAME);
  return sheet;
}

function ensureHeaders_(sheet) {
  const width = Math.max(sheet.getLastColumn(), CONFIG.RSVP_HEADERS.length);
  const current = sheet.getRange(1, 1, 1, width).getValues()[0];

  CONFIG.RSVP_HEADERS.forEach((header, index) => {
    if (!current[index]) {
      sheet.getRange(1, index + 1).setValue(header);
    }
  });
}

function buildRsvpRow_(payload) {
  return [
    new Date(),
    payload.guest.trim(),
    payload.email || '',
    normalizeAttendanceLabel_(payload.asistencia),
    payload.intolerancias || '',
    payload.comentarios || '',
    payload.acompanantes || '',
    'pendiente',
    '',
    '',
    'web'
  ];
}

function appendRsvp_(sheet, row) {
  const targetRow = sheet.getLastRow() + 1;
  sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
  return targetRow;
}

function normalizeAttendanceLabel_(value) {
  const normalized = String(value || '').toLowerCase().trim();
  if (normalized === 'si' || normalized === 'sí' || normalized === 'true' || normalized === 'yes') {
    return 'Si';
  }
  return 'No';
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
