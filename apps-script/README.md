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

El CSV original de invitados se mantiene como lista oficial y no se modifica automaticamente desde la web. Sus columnas eran:

- `guest`
- `guest_link`
- `Asistencia`
- `Intoleracias`
- `Comentarios`

El script crea o usa una pestana paralela `RSVP_Web` para recoger cada envio del formulario:

- `Timestamp`
- `Nombre`
- `Email`
- `Asistencia`
- `Intolerancias`
- `Comentarios`
- `Acompanantes`
- `Estado`
- `ValidadoCon`
- `Notas`
- `Source`

Cada envio se guarda como una fila nueva con `Estado = pendiente`. La conciliacion con la lista oficial se hace manualmente para evitar sobrescrituras por nombres ambiguos o motes.

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
