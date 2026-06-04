# Milena & Omar

Landing page estatica para la boda.

## RSVP

El RSVP escribe en Google Sheets mediante Google Apps Script.

La lista de invitados no se publica en el frontend ni se guarda en el repo, porque el repositorio es publico. El formulario tampoco actualiza automaticamente la lista oficial: cada envio se guarda en una pestana paralela para validarlo manualmente.

## Google Sheet

El CSV original `lista_invitados - Hoja 1.csv` tenia 91 filas y estas columnas:

- `guest`
- `guest_link`
- `Asistencia`
- `Intoleracias`
- `Comentarios`

El Apps Script no modifica esta lista desde la web. Crea o usa una pestana `RSVP_Web` con estas columnas:

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

`Estado` empieza como `pendiente`. Despues se puede marcar manualmente como `validado`, `duplicado` o `descartado`, y usar `ValidadoCon` para apuntar al nombre exacto de la lista oficial.

## Configurar Apps Script

1. Abre la Google Sheet.
2. Ve a `Extensiones -> Apps Script`.
3. Copia el contenido de `apps-script/Code.gs`.
4. Despliega como `Web app`.
5. Usa `Execute as: Me`.
6. Usa `Who has access: Anyone`.
7. Copia la URL `/exec`.
8. En `index.html`, actualiza `RSVP_ENDPOINT` si se crea un nuevo despliegue.

## Tests

```powershell
node --test
```
