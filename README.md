# Milena & Omar

Landing page estatica para la boda.

## RSVP

El formulario usa Netlify Forms con el nombre `rsvp`.

Campos configurados:

- `guest`
- `email`
- `asistencia`
- `intolerancias`
- `comentarios`
- `acompanantes`

La hoja original `lista_invitados - Hoja 1.csv` tenia 91 filas y estas columnas:

- `guest`
- `guest_link`
- `Asistencia`
- `Intoleracias`
- `Comentarios`

La lista de invitados no se publica en el frontend ni se guarda en el repo, porque el repositorio es publico.

## Revisar Confirmaciones

En Netlify:

```text
Site dashboard -> Forms -> rsvp
```

Desde ahi se pueden revisar respuestas, exportar CSV y configurar notificaciones por email.

## Deploy En Netlify

Conecta este repositorio en Netlify y usa:

```text
Build command: dejar vacio
Publish directory: .
```

El archivo `netlify.toml` ya define `publish = "."`.
