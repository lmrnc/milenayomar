# Google Apps Script RSVP

Este script se pega en una extension de Google Apps Script vinculada a la Google Sheet de invitados.

## Instalacion

1. Abre la Google Sheet.
2. Ve a `Extensiones -> Apps Script`.
3. Sustituye el contenido de `Code.gs` por el de `apps-script/Code.gs`.
4. Guarda.
5. `Deploy -> New deployment`.
6. Tipo: `Web app`.
7. Execute as: `Me`.
8. Who has access: `Anyone`.
9. Copia la URL que termina en `/exec`.

## Columnas

El CSV original tenia:

- `guest`
- `guest_link`
- `Asistencia`
- `Intoleracias`
- `Comentarios`

El script conserva esas columnas y anade si faltan:

- `Email`
- `ConfirmadoPor`
- `Timestamp`
- `Source`

## Payload esperado

La pagina enviara campos form-url-encoded:

- `guest`
- `email`
- `asistencia`
- `intolerancias`
- `comentarios`
- `acompanantes`
- `bot-field`

`acompanantes` es texto legible con bloques separados por linea en blanco.
