# Milena & Omar

Landing page estatica para la boda.

## RSVP

El formulario no carga la lista de invitados en el navegador. En Netlify, el envio pasa por `/.netlify/functions/rsvp`, que solo acepta `POST` y reenvia los datos al Google Apps Script configurado en la variable de entorno:

```text
RSVP_SCRIPT_URL=https://script.google.com/macros/s/.../exec
```

Despues de cambiar la variable en Netlify, redeploya la pagina. No guardes el URL real del Apps Script en archivos publicos del repo.

Nota: GitHub Pages sirve archivos estaticos y no ejecuta funciones. Para que el RSVP fiable funcione con esta implementacion, despliega el mismo repo en Netlify u otro hosting con serverless functions.

Mientras la pagina este alojada en GitHub Pages, el formulario usa un fallback directo al Apps Script. Ese modo permite enviar confirmaciones, pero por limitaciones de CORS no puede verificar la respuesta real con la misma fiabilidad que la funcion serverless.
