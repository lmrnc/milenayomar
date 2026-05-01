# Milena & Omar

Landing page estatica para la boda.

## RSVP

El RSVP escribe en Google Sheets mediante Google Apps Script.

La lista de invitados no se publica en el frontend ni se guarda en el repo, porque el repositorio es publico.

## Google Sheet

El CSV original `lista_invitados - Hoja 1.csv` tenia 91 filas y estas columnas:

- `guest`
- `guest_link`
- `Asistencia`
- `Intoleracias`
- `Comentarios`

El Apps Script conserva esas columnas y anade:

- `Email`
- `ConfirmadoPor`
- `Timestamp`
- `Source`

## Configurar Apps Script

1. Abre la Google Sheet.
2. Ve a `Extensiones -> Apps Script`.
3. Copia el contenido de `apps-script/Code.gs`.
4. Despliega como `Web app`.
5. Usa `Execute as: Me`.
6. Usa `Who has access: Anyone`.
7. Copia la URL `/exec`.
8. En `index.html`, sustituye:

```text
PASTE_GOOGLE_APPS_SCRIPT_EXEC_URL_HERE
```

por la URL real del despliegue.

## Tests

```powershell
node --test
```
