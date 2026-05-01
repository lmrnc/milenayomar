const CONFIG = {
  SHEET_NAME: 'Hoja 1',
  HEADERS: [
    'guest',
    'guest_link',
    'Asistencia',
    'Intoleracias',
    'Comentarios',
    'Email',
    'ConfirmadoPor',
    'Timestamp',
    'Source'
  ]
};

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    validatePayload_(payload);

    const sheet = getSheet_();
    ensureHeaders_(sheet);

    const rows = buildRows_(payload);
    const results = rows.map((row) => upsertGuest_(sheet, row));

    return json_({ ok: true, results });
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

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME) || spreadsheet.getSheets()[0];
  if (!sheet) throw new Error('Sheet not found');
  return sheet;
}

function ensureHeaders_(sheet) {
  const width = Math.max(sheet.getLastColumn(), CONFIG.HEADERS.length);
  const current = sheet.getRange(1, 1, 1, width).getValues()[0];

  CONFIG.HEADERS.forEach((header, index) => {
    if (!current[index]) {
      sheet.getRange(1, index + 1).setValue(header);
    }
  });
}

function buildRows_(payload) {
  const now = new Date();
  const mainGuest = payload.guest.trim();
  const rows = [{
    guest: mainGuest,
    guest_link: '',
    asistencia: normalizeAttendance_(payload.asistencia),
    intoleracias: payload.intolerancias || '',
    comentarios: payload.comentarios || '',
    email: payload.email || '',
    confirmadoPor: mainGuest,
    timestamp: now,
    source: 'web'
  }];

  parseCompanions_(payload.acompanantes).forEach((companion) => {
    rows.push({
      guest: companion.guest,
      guest_link: mainGuest,
      asistencia: normalizeAttendance_(companion.asistencia),
      intoleracias: companion.intolerancias,
      comentarios: companion.comentarios,
      email: payload.email || '',
      confirmadoPor: mainGuest,
      timestamp: now,
      source: 'web-companion'
    });
  });

  return rows;
}

function parseCompanions_(text) {
  if (!text) return [];

  return text.split(/\n{2,}/).map((block) => {
    const guest = matchLine_(block, /Nombre:\s*(.+)/i);
    if (!guest) return null;

    return {
      guest,
      asistencia: matchLine_(block, /Asistencia:\s*(.+)/i) || '',
      intolerancias: emptyDash_(matchLine_(block, /Intolerancias:\s*(.*)/i)),
      comentarios: emptyDash_(matchLine_(block, /Comentarios:\s*(.*)/i))
    };
  }).filter(Boolean);
}

function matchLine_(text, regex) {
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function emptyDash_(value) {
  return value === '-' ? '' : value;
}

function normalizeAttendance_(value) {
  const normalized = String(value || '').toLowerCase().trim();
  return normalized === 'si' || normalized === 'sí' || normalized === 'true' || normalized === 'yes';
}

function upsertGuest_(sheet, row) {
  const headerMap = getHeaderMap_(sheet);
  const rowNumber = findGuestRow_(sheet, row.guest);
  const values = sheet.getRange(rowNumber || sheet.getLastRow() + 1, 1, 1, sheet.getLastColumn()).getValues()[0];

  setValue_(values, headerMap, 'guest', row.guest);
  setValue_(values, headerMap, 'guest_link', row.guest_link);
  setValue_(values, headerMap, 'Asistencia', row.asistencia);
  setValue_(values, headerMap, 'Intoleracias', row.intoleracias);
  setValue_(values, headerMap, 'Comentarios', row.comentarios);
  setValue_(values, headerMap, 'Email', row.email);
  setValue_(values, headerMap, 'ConfirmadoPor', row.confirmadoPor);
  setValue_(values, headerMap, 'Timestamp', row.timestamp);
  setValue_(values, headerMap, 'Source', row.source);

  const targetRow = rowNumber || sheet.getLastRow() + 1;
  sheet.getRange(targetRow, 1, 1, values.length).setValues([values]);

  return {
    guest: row.guest,
    status: rowNumber ? 'updated' : 'added'
  };
}

function getHeaderMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.reduce((acc, header, index) => {
    if (header) acc[String(header).trim()] = index;
    return acc;
  }, {});
}

function findGuestRow_(sheet, guestName) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const names = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const needle = normalizeName_(guestName);

  for (let i = 0; i < names.length; i++) {
    if (normalizeName_(names[i][0]) === needle) return i + 2;
  }

  return null;
}

function normalizeName_(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function setValue_(values, headerMap, header, value) {
  if (headerMap[header] === undefined) return;
  values[headerMap[header]] = value;
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
