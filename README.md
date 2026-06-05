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

## Subida de medios (Hostinger)

La sección "Recuerdos" permite a los invitados subir fotos y vídeos durante la celebración. El backend es un PHP same-origin (`api/upload.php`) pensado para correr en el alojamiento Hostinger Single de la pareja en `milenayomar.es`.

### Mientras la web siga en GitHub Pages

La sección se renderiza pero el formulario está oculto y muestra un aviso de "estamos rematando esta sección". El guard de hostname comprueba `window.location.hostname` y solo activa el formulario en `milenayomar.es` (también permite `localhost` y `127.0.0.1` para pruebas locales con un servidor PHP).

### Despliegue en Hostinger

1. **Sube el contenido del repo** a `public_html/` por FTP/Git deploy. La estructura del repo coincide 1:1 con `public_html/` (`index.html`, `assets/`, `api/`, `apps-script/` se queda fuera).
2. **Crea el directorio privado** fuera de `public_html`. Por FTP o desde el File Manager:
   ```
   /home/<u-username>/private_uploads/
   ```
3. **Genera `_pepper.txt`** con un secreto aleatorio:
   ```bash
   php -r "echo bin2hex(random_bytes(32));" > /home/<u-username>/private_uploads/_pepper.txt
   chmod 600 /home/<u-username>/private_uploads/_pepper.txt
   ```
4. **Copia `private_uploads_template/.htaccess`** a `private_uploads/.htaccess` (defensa en profundidad).
5. **Edita `api/upload.php`** y ajusta la ruta absoluta de `MEDIA_CONFIG['PRIVATE_DIR']` con tu username real de Hostinger.
6. **Configura PHP en hPanel** → Avanzado → Configuración PHP:
   - `upload_max_filesize` = `30M`
   - `post_max_size` = `200M`
   - `max_file_uploads` = `5`
   - `max_execution_time` = `120`
   - `memory_limit` = `256M`

### Dónde aparecen los archivos

- **Archivos**: `<private_uploads>/<YYYY-MM-DD>/<momento>/<unix_ts>_<rand>_<slug>.<ext>`
- **Metadatos**: `<private_uploads>/log.csv` (UTF-8 con BOM, abrible directamente con Excel/Numbers)

Para revisarlos, conéctate al hPanel → File Manager y navega a `private_uploads/`, o por FTP/SFTP.

### Cómo desactivar la sección

En `index.html`, dentro del bloque JS, cambiar `MEDIA_CONFIG.ENABLED` de `true` a `false`. La sección quedará oculta para los invitados.

### Tests

```powershell
node --test
```

Los tests que requieren PHP se marcan como `skipped` automáticamente si `php` no está en el PATH.
