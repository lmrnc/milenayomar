# Milena & Omar

Landing page estatica para la boda.

## RSVP

El formulario no carga la lista de invitados en el navegador. En Netlify, el envio pasa por `/.netlify/functions/rsvp`, que solo acepta `POST` y reenvia los datos al Google Apps Script configurado en la variable de entorno:

```text
RSVP_SCRIPT_URL=https://script.google.com/macros/s/.../exec
```

Despues de cambiar la variable en Netlify, redeploya la pagina. No guardes el URL real del Apps Script en archivos publicos del repo.

Nota: GitHub Pages sirve archivos estaticos y no ejecuta funciones. Para que el RSVP fiable funcione con esta implementacion, despliega el mismo repo en Netlify u otro hosting con serverless functions.
