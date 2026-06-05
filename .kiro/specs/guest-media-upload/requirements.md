# Requirements Document

## Introduction

Esta feature añade a la página de la boda Milena & Omar una sección donde los invitados pueden subir las fotos y vídeos que vayan haciendo durante la celebración (ceremonia, cóctel, fiesta...) y acompañarlos con tres datos opcionales: quién/es salen, en qué momento se tomó y un pie de foto. El propósito es **compartir el material con la pareja**, no crear una galería pública: las subidas viajan a una carpeta privada en el alojamiento de la pareja en Hostinger (fuera del web root) y los metadatos se anotan en un CSV junto a esa carpeta.

La feature aprovecha que la pareja tiene contratado **Hostinger Single** con dominio `milenayomar.es` (50 GB SSD, PHP 8.x). El front-end actual está en GitHub Pages mientras se itera, pero la versión de producción se servirá desde Hostinger; por eso esta feature asume desde el principio una arquitectura **same-origin** (front + endpoint en `milenayomar.es`), lo que permite usar `fetch` con barra de progreso y prescindir del hack del `<iframe>` que sí necesita el RSVP existente.

El RSVP existente (Google Apps Script + Google Sheets) **permanece intacto**: esta feature NO toca `apps-script/Code.gs`. Las restricciones siguen siendo: foco en uso desde el móvil durante la boda, idioma español con tono cálido y "ustedes/les", y mantenimiento mínimo por parte de la pareja.

## Glossary

- **Production_Domain**: `https://milenayomar.es`, dominio servido desde Hostinger Single, donde vivirá la versión final de la web y el endpoint de subida.
- **Hostinger_Plan**: Plan **Hostinger Single**, 50 GB SSD, PHP 8.x soportado, 1 cuenta FTP, 1 base de datos MySQL (no usada por esta feature).
- **Web_Root**: Directorio público servido por HTTP, típicamente `public_html/` en Hostinger.
- **Private_Dir**: Directorio fuera del `Web_Root` (típicamente al mismo nivel, p. ej. `/home/<user>/private_uploads/`) donde se almacenan los archivos subidos. NO accesible por URL.
- **Media_Section**: Nueva sección visible en `index.html` con el formulario de subida y las instrucciones para los invitados.
- **Media_Form**: Elemento `<form>` dentro de `Media_Section`. En esta arquitectura same-origin envía mediante `fetch` + `FormData`, NO con el patrón iframe del RSVP.
- **Media_Endpoint**: URL `https://milenayomar.es/api/upload.php`, script PHP same-origin que recibe los envíos.
- **Media_PHP_Script**: Fichero `api/upload.php` en el repositorio, versionado en Git, que procesa el envío, valida, guarda los archivos en `Private_Dir` y añade fila al `Log_CSV`.
- **Log_CSV**: Fichero `<Private_Dir>/log.csv` donde se anota una fila por cada `Submission`. Sustituye a la pestaña `Media_Web` de Google Sheets que se planteaba originalmente.
- **Submission**: Un único envío del formulario, que incluye uno o varios archivos y los metadatos asociados.
- **Asset**: Cada archivo individual (foto o vídeo) dentro de una `Submission`.
- **Metadata_Fields**: Tres campos descriptivos opcionales que rellenan los invitados: `personas`, `momento`, `pie`.
- **Moment_Options**: Lista cerrada de valores válidos para el campo `momento` (`ceremonia`, `cóctel`, `cena`, `baile`, `otro`).
- **Allowed_MIME_Types**: Tipos MIME permitidos. Por defecto: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`, `video/mp4`, `video/quicktime`.
- **Allowed_Extensions**: Conjunto blanco de extensiones permitidas, derivado de `Allowed_MIME_Types`: `.jpg`, `.jpeg`, `.png`, `.webp`, `.heic`, `.heif`, `.mp4`, `.mov`. La extensión real se determina del MIME detectado por servidor, no del nombre del cliente.
- **Max_File_Size**: Tamaño máximo por archivo. Valor inicial: 30 MB. Debe coincidir con `upload_max_filesize` de PHP.
- **Max_Files_Per_Submission**: Número máximo de archivos por envío. Valor inicial: 5.
- **Max_Post_Size**: Tamaño máximo del cuerpo POST. Valor inicial: 200 MB (`Max_Files_Per_Submission * Max_File_Size + margen`). Debe coincidir con `post_max_size` de PHP.
- **Honeypot**: Campo oculto `bot-field` que, si llega relleno, marca el envío como spam (mismo patrón que el RSVP existente).
- **Client_Throttle**: Mecanismo en cliente que limita a un envío cada 10 s por pestaña, usando `sessionStorage`.
- **Server_Rate_Limit**: Mecanismo en servidor (PHP) que limita envíos por IP en una ventana de tiempo, usando un fichero plano en `Private_Dir/_rate.json` o equivalente.
- **Couple**: Milena y Omar, los únicos consumidores autorizados del material subido.
- **Mobile_Capture**: Selección de archivos desde la cámara o el carrete del móvil, vía atributos `accept` y `capture`.
- **CSP_Policy**: Cabecera `Content-Security-Policy` enviada por `index.html` y por `upload.php` que limita orígenes permitidos.
- **Same_Origin_Assumption**: La página y el endpoint comparten origen (`https://milenayomar.es`). Esto elimina la necesidad del truco del iframe y permite responder a `fetch` directamente con JSON.

## Requirements

### Requirement 1: Sección de subida de medios visible en la página

**User Story:** Como invitado en la boda, quiero ver una sección clara en la web donde subir mis fotos y vídeos, para no tener que enviarlos por WhatsApp ni instalar nada.

#### Acceptance Criteria

1. THE Media_Section SHALL existir como una sección semántica nueva en `index.html` con un título y un texto introductorio en español que explique que el material va directo a Milena y Omar y que NO se publicará en una galería pública.
2. THE Media_Section SHALL estar ubicada después de la sección RSVP y antes de la sección "Nosotros", para conservar el flujo Hero → RSVP → Media → Nosotros.
3. THE Media_Section SHALL usar la tipografía y los estilos del resto de la página (Cormorant Garamond en titulares en cursiva y Jost en cuerpo) sin introducir nuevas familias tipográficas.
4. WHERE el dispositivo es móvil (ancho ≤ 600 px), THE Media_Section SHALL apilar todos los controles del formulario en una sola columna y aplicar `min-height: 44px` por CSS a botones, inputs y selects para garantizar áreas de toque ≥ 44 px sin depender del contenido.
5. THE Media_Section SHALL aparecer siempre, sin requerir RSVP previo ni gating temporal en esta primera versión.
6. THE `index.html` SHALL incluir una constante `MEDIA_FEATURE_ENABLED` (booleana en JS y/o un atributo `hidden` controlable) que permita ocultar la sección entera con un único cambio si la pareja necesitase desactivarla.

### Requirement 2: Envío same-origin con `fetch` y barra de progreso

**User Story:** Como invitado, quiero subir uno o varios archivos sin que el sitio se quede pillado, viendo cuánto falta y recibiendo confirmación dentro de la propia página.

#### Acceptance Criteria

1. THE Media_Form SHALL declararse como `<form method="POST" enctype="multipart/form-data">` con `action` apuntando a `Media_Endpoint`, pero el envío SHALL realizarse mediante JavaScript usando `fetch` o `XMLHttpRequest` para poder mostrar progreso y manejar errores ricos.
2. THE Media_Form SHALL prevenir el envío nativo del navegador (`event.preventDefault()`) cuando JavaScript está disponible.
3. WHERE JavaScript NO está disponible o la API `fetch` falla por motivos del entorno, THE Media_Form SHALL caer al envío nativo del formulario hacia `Media_Endpoint` y NO romper la subida.
4. WHEN el invitado pulsa el botón de envío, THE Media_Section SHALL mostrar una barra o porcentaje de progreso de 0 % a 100 % usando el evento `progress` de `XMLHttpRequest` (o el equivalente disponible en `fetch` con `ReadableStream`).
5. WHEN el envío se completa con éxito, THE Media_Section SHALL mostrar un mensaje de confirmación inline en español con tono cálido (p. ej. "¡Gracias, ya lo tenemos guardado!").
6. WHEN el envío falla por validación de cliente, THE Media_Section SHALL mostrar el motivo concreto en español inline y NO contactar al servidor.
7. THE Media_Form SHALL deshabilitar el botón de envío y los inputs entre el momento del clic y la respuesta del servidor o el fallo, para evitar dobles envíos.
8. THE Media_Endpoint SHALL responder un JSON con `Content-Type: application/json` que el cliente pueda parsear directamente, sin necesidad del truco del iframe.

### Requirement 3: Selección de archivos desde el móvil

**User Story:** Como invitado en plena celebración, quiero poder elegir fotos y vídeos del carrete o sacar una foto en el momento desde mi móvil, sin pasos extra raros.

#### Acceptance Criteria

1. THE Media_Form SHALL incluir un `<input type="file">` con `accept` restringido a los `Allowed_MIME_Types` para fotos y vídeos.
2. THE `<input type="file">` SHALL incluir el atributo `multiple` para permitir seleccionar varios archivos a la vez hasta `Max_Files_Per_Submission`.
3. WHERE el dispositivo expone una cámara y soporta `capture`, THE Media_Form SHALL ofrecer al invitado tomar la foto/vídeo en el momento sin abandonar la página.
4. WHEN el invitado selecciona archivos, THE Media_Section SHALL mostrar la lista con su nombre y tamaño formateado en MB; si el navegador no expone uno de los dos campos, mostrará el que esté disponible.
5. IF el invitado selecciona más de `Max_Files_Per_Submission` archivos, THEN THE Media_Form SHALL bloquear el envío y mostrar un mensaje en español indicando el límite y cuántos archivos hay seleccionados.
6. THE Media_Form SHALL permitir al invitado eliminar archivos individuales de la lista antes de enviar, usando un control accesible (botón con `aria-label`).

### Requirement 4: Metadatos descriptivos por envío

**User Story:** Como invitado, quiero poder anotar quién sale en la foto, en qué momento se tomó y añadir un pie, para que Milena y Omar tengan más contexto cuando revisen el material.

#### Acceptance Criteria

1. THE Media_Form SHALL incluir un campo de texto `personas` con `name="personas"`, `maxlength=200`, y placeholder en español describiendo quién sale.
2. THE Media_Form SHALL incluir un campo `momento` con `name="momento"` cuyos únicos valores válidos son los `Moment_Options` (`ceremonia`, `cóctel`, `cena`, `baile`, `otro`).
3. THE Media_Form SHALL incluir un campo `pie` con `name="pie"`, multilinea, `maxlength=500`, y placeholder en español sugiriendo un texto corto.
4. THE Metadata_Fields SHALL ser todos opcionales para no ralentizar la subida en mitad de la fiesta.
5. WHEN el invitado deja `momento` sin seleccionar, THE Media_Form SHALL enviar `momento=""` y THE Media_PHP_Script SHALL aceptar la cadena vacía sin error.
6. THE Media_PHP_Script SHALL truncar de forma segura los valores que excedan `maxlength`, NO devolver error 400 por superar 1 carácter.

### Requirement 5: Validación de tipo y tamaño en cliente

**User Story:** Como pareja con 50 GB de almacenamiento total, quiero que la web rechace en el móvil del invitado los archivos demasiado grandes o de tipo inesperado, para no acabar saturando la cuota ni recibiendo basura.

#### Acceptance Criteria

1. WHEN el invitado selecciona un archivo cuyo tipo MIME no está en `Allowed_MIME_Types` y la extensión no está en `Allowed_Extensions`, THE Media_Form SHALL bloquear el envío y mostrar en español los formatos aceptados.
2. WHEN el invitado selecciona un archivo cuyo tamaño supera `Max_File_Size`, THE Media_Form SHALL bloquear el envío y mostrar en español el límite por archivo y el peso real del archivo seleccionado.
3. WHEN la suma de tamaños de los archivos seleccionados supera `Max_Post_Size`, THE Media_Form SHALL bloquear el envío y proponer enviar los archivos en varios envíos.
4. THE valores `Max_File_Size`, `Max_Files_Per_Submission`, `Max_Post_Size`, `Allowed_MIME_Types`, `Allowed_Extensions` y `Moment_Options` SHALL definirse como constantes nombradas en un único punto de `index.html` y como configuración paralela en `api/upload.php`, para que la pareja pueda ajustarlos cambiando dos sitios bien identificados.

### Requirement 6: Recepción y persistencia en el backend (PHP same-origin)

**User Story:** Como pareja, quiero que cada envío llegue a una carpeta privada de mi alojamiento Hostinger y se anote en un CSV legible, sin depender de Google Drive ni de servicios externos.

#### Acceptance Criteria

1. THE Media_PHP_Script SHALL exponer un endpoint POST en `https://milenayomar.es/api/upload.php` que parsea peticiones `multipart/form-data` desde el array global `$_FILES` y `$_POST`.
2. WHEN llega una `Submission` válida, THE Media_PHP_Script SHALL guardar cada `Asset` dentro de `<Private_Dir>/<YYYY-MM-DD>/<momento>/`, creando los subdirectorios si no existen, donde `<momento>` es un `Moment_Options` o `otro` si está vacío.
3. THE nombre de cada `Asset` SHALL seguir el formato `<unix_ts>_<rand-6-hex>_<slug-personas>.<ext>`, donde:
    1. `<unix_ts>` es el timestamp Unix en segundos del momento de recepción.
    2. `<rand-6-hex>` son 6 caracteres hexadecimales aleatorios criptográficamente seguros (`random_bytes(3)`).
    3. `<slug-personas>` es un slug alfanumérico de hasta 40 caracteres derivado de `personas`, vacío convertido a `anon`.
    4. `<ext>` es la extensión derivada del MIME detectado en servidor (mediante `finfo`), NUNCA del nombre original del cliente.
4. THE Media_PHP_Script SHALL crear o utilizar el fichero `<Private_Dir>/log.csv` con cabecera `Timestamp,Personas,Momento,Pie,NumArchivos,Archivos,TamanoTotalKB,IPHash,UserAgentHash,Source,Estado,Notas`.
5. THE columna `Archivos` SHALL contener las rutas relativas dentro de `Private_Dir` (p. ej. `2027-04-09/coctel/1712680000_a3f8b2_juan-perez.jpg`), separadas por `;` (no `,`, para no romper el CSV), NUNCA URLs públicas.
6. THE columna `IPHash` SHALL guardar un hash truncado (`substr(sha256(IP + secret_pepper), 0, 16)`) en lugar de la IP en claro, para ofuscar el dato pero permitir agrupar envíos del mismo dispositivo. El `secret_pepper` SHALL leerse de un fichero fuera de `Web_Root` (p. ej. `<Private_Dir>/_pepper.txt`) y NO commitearse al repositorio.
7. THE columna `UserAgentHash` SHALL guardar un hash equivalente del User-Agent.
8. THE columna `Estado` SHALL inicializarse con el valor `pendiente`, igual que el RSVP, para que la pareja pueda marcarla manualmente.
9. THE Media_PHP_Script SHALL escribir el CSV con codificación UTF-8 y BOM (`\xEF\xBB\xBF`) la primera vez que lo cree, para que Excel lo abra correctamente con tildes.
10. WHEN el guardado de un archivo o la escritura del CSV falla, THE Media_PHP_Script SHALL revertir los archivos parcialmente guardados de esa `Submission`, NO escribir fila en CSV, y responder un JSON `{ ok: false, error: <mensaje>, code: <código>}` con HTTP 500 (errores de servidor) o 400 (errores de cliente).

### Requirement 7: Validación y robustez en el backend (PHP)

**User Story:** Como pareja, no quiero que un script automático nos llene el almacenamiento ni que un envío malformado rompa el endpoint.

#### Acceptance Criteria

1. IF el método HTTP NO es POST, THEN THE Media_PHP_Script SHALL responder HTTP 405 con `Allow: POST` y NO procesar nada.
2. IF el campo `bot-field` (Honeypot) llega con valor no vacío, THEN THE Media_PHP_Script SHALL responder HTTP 200 con `{ ok: true, status: "received" }` falso (silencioso) y NO escribir nada — esto evita pistas a bots.
3. IF la `Submission` no incluye al menos un `Asset` en `$_FILES`, THEN THE Media_PHP_Script SHALL rechazarla con HTTP 400 y mensaje en español.
4. IF un `Asset` tiene un MIME detectado por servidor (`finfo_file`) fuera de `Allowed_MIME_Types`, THEN THE Media_PHP_Script SHALL rechazar la `Submission` completa, NO guardar archivos parciales, y responder HTTP 400.
5. IF un `Asset` excede `Max_File_Size` (medido en servidor con `filesize`), THEN THE Media_PHP_Script SHALL rechazar la `Submission` completa y responder HTTP 413.
6. THE Media_PHP_Script SHALL rechazar cualquier ruta de carga que contenga `..`, `/`, `\`, NUL o caracteres de control en `personas` o `momento`, sustituyéndolos por slug seguro antes de usarlos en nombres de fichero.
7. THE Media_PHP_Script SHALL desactivar la ejecución de PHP en `Private_Dir` mediante un fichero `.htaccess` o equivalente colocado en el deploy: aunque el directorio está fuera del `Web_Root` y por defecto no es accesible, esta defensa en profundidad protege ante errores de configuración.
8. THE Media_PHP_Script SHALL guardar los archivos con permisos `0640` y los directorios con `0750`, NO ejecutables, NO legibles por `other`.
9. THE Media_PHP_Script SHALL devolver SIEMPRE respuestas con `Content-Type: application/json` y nunca volcar mensajes de PHP, stack traces o paths absolutos al cliente.

### Requirement 8: Privacidad y control de acceso

**User Story:** Como pareja, quiero asegurarme de que sólo nosotros vemos las fotos y vídeos que la gente sube y que el sitio nunca expone una galería ni un listado público.

#### Acceptance Criteria

1. THE Private_Dir SHALL estar fuera de `Web_Root` (`public_html/`) y por tanto NO ser accesible vía HTTP por construcción.
2. THE configuración de Apache (`.htaccess` en `public_html/api/`) SHALL contener `Options -Indexes` para que en ningún caso se exponga un listado de directorio.
3. THE página estática SHALL NO incluir ningún listado de Submissions, ningún endpoint GET que devuelva archivos, y ningún enlace público a los assets subidos.
4. THE Media_PHP_Script SHALL responder a peticiones GET con HTTP 405 — nada de `?action=list` ni equivalentes.
5. WHEN la pareja necesite revisar el material, SHALL hacerlo conectándose al alojamiento por:
    1. **File Manager** del panel de Hostinger (hPanel → Files → File Manager), navegando a `Private_Dir`.
    2. **FTP/SFTP** con credenciales del panel.
    3. **Una página de admin protegida** opcional (`/admin/index.php` con HTTP Basic Auth o sesión por contraseña) — se considera fuera del alcance de esta primera versión, mencionada como evolución futura.
6. THE README SHALL documentar que el `Media_Endpoint` no es secreto pero NO debe publicarse en redes sociales.

### Requirement 9: Cabeceras de seguridad y CORS

**User Story:** Como pareja, quiero que la página y el endpoint apliquen las cabeceras estándar de seguridad y que sólo `milenayomar.es` pueda llamar al endpoint.

#### Acceptance Criteria

1. THE Media_PHP_Script SHALL enviar las siguientes cabeceras en TODAS sus respuestas:
    1. `X-Content-Type-Options: nosniff`
    2. `X-Frame-Options: DENY`
    3. `Referrer-Policy: same-origin`
    4. `Strict-Transport-Security: max-age=31536000; includeSubDomains` (Hostinger ya fuerza HTTPS con Let's Encrypt).
2. THE Media_PHP_Script SHALL aceptar peticiones únicamente con `Origin: https://milenayomar.es` o sin Origin (envío nativo same-origin); cualquier otro origen SHALL responder HTTP 403.
3. THE Media_PHP_Script SHALL NO enviar `Access-Control-Allow-Origin: *`. La política CORS SHALL ser explícitamente same-origin.
4. THE `index.html` SHALL incluir, opcionalmente, una `Content-Security-Policy` con `form-action 'self'`, `connect-src 'self' https://www.google.com` (para el iframe de Google Maps) y `default-src 'self'`. Esta CSP SHALL ser compatible con la integración existente de Google Fonts y Google Maps; se documentará el ajuste si fuera necesario.

### Requirement 10: Manejo de errores y red débil

**User Story:** Como invitado en una sala con WiFi flojo o cobertura intermitente, quiero saber qué hacer si una subida tarda mucho, falla o se queda colgada, sin perder lo que ya he escrito.

#### Acceptance Criteria

1. WHEN el envío supera 120 segundos sin respuesta del servidor, THE Media_Section SHALL abortar la petición (`AbortController`), mostrar un mensaje en español sugiriendo reintentar, y reactivar el botón de envío.
2. WHEN un envío falla por cualquier motivo (timeout, error de red, error 4xx/5xx del servidor), THE Media_Form SHALL conservar los `Metadata_Fields` y la lista de archivos seleccionados, para que el invitado no tenga que reescribir nada.
3. WHEN el servidor responde con un código HTTP de error y body JSON, THE Media_Section SHALL mostrar el campo `error` (en español) si existe, en lugar de un mensaje genérico.
4. THE mensajes de error visibles al invitado SHALL evitar tecnicismos (no exponer códigos HTTP crudos ni stack traces) y usar el mismo tono cálido del resto del sitio.

### Requirement 11: Anti-abuso ligero

**User Story:** Como pareja, quiero protección razonable contra envíos automáticos o un mismo dispositivo lanzando docenas de subidas, sin obligar a los invitados a registrarse.

#### Acceptance Criteria

1. THE Media_Form SHALL incluir un Honeypot oculto con `name="bot-field"`, no visible en pantalla y con `tabindex="-1"`, igual que el RSVP existente.
2. THE Client_Throttle SHALL limitar a un envío cada 10 segundos por pestaña, usando `sessionStorage` para guardar el timestamp del último envío.
3. WHEN un invitado intenta enviar antes de que pasen 10 segundos desde el envío anterior, THE Media_Form SHALL bloquear el envío y mostrar en español el tiempo restante.
4. THE Server_Rate_Limit SHALL limitar a:
    1. Máximo **5 envíos por minuto** por `IPHash`.
    2. Máximo **40 envíos por hora** por `IPHash`.
    3. Máximo **15 envíos por minuto** en total (global), independientemente de la IP.
5. WHEN el `Server_Rate_Limit` se supera, THE Media_PHP_Script SHALL responder HTTP 429 con cabecera `Retry-After` en segundos y body JSON `{ ok: false, error: "Demasiados envíos, prueba en unos minutos" }`.
6. THE Server_Rate_Limit SHALL persistirse en un fichero plano JSON dentro de `Private_Dir` (`_rate.json`), con bloqueo de escritura (`flock`), y SHALL purgar entradas más viejas que 1 hora.
7. THE solución SHALL NO requerir login, captcha ni token de invitación en esta primera versión, manteniendo el principio de mínima fricción del RSVP.

### Requirement 12: Internacionalización y tono

**User Story:** Como pareja, quiero que la sección hable a los invitados con el mismo tono cálido y canario del resto de la web (uso de "ustedes", "guaguas" donde encaje).

#### Acceptance Criteria

1. THE textos visibles de la Media_Section, los placeholders y los mensajes de error SHALL estar en español de España con tratamiento `ustedes`/`les`, en línea con el resto de copys de la página.
2. THE titulares decorativos (h2/h3) SHALL usar Cormorant Garamond en cursiva, igual que los títulos existentes.
3. THE microcopy SHALL evitar acrónimos técnicos (no aparecer "MIME", "MB" se prefiere a "megabytes" en mensajes al usuario).
4. THE caracteres acentuados y `ñ` SHALL renderizarse correctamente sin mojibake (`Ã`, `Â`, `â`, `ð` no deben aparecer en el HTML servido ni en el CSV escrito por PHP).

### Requirement 13: Configuración de límites en un único punto

**User Story:** Como pareja con poco tiempo, quiero poder ajustar el tamaño máximo de archivo o añadir un nuevo "momento" cambiando un único sitio.

#### Acceptance Criteria

1. THE Media_Form SHALL leer `Max_File_Size`, `Max_Files_Per_Submission`, `Max_Post_Size`, `Allowed_MIME_Types`, `Allowed_Extensions` y `Moment_Options` desde un único objeto JS de configuración dentro de `index.html`, comentado y con valores por defecto explicados.
2. THE Media_PHP_Script SHALL leer las mismas variables desde una constante de configuración (`MEDIA_CONFIG`) declarada al principio del fichero `api/upload.php`.
3. WHEN el cliente y el servidor difieren en `Allowed_MIME_Types` o `Max_File_Size`, THE Media_PHP_Script SHALL imponer su propia configuración como autoridad final, registrando el rechazo en el `Log_CSV` con `Estado=rechazado` y `Notas=<motivo>` (sin exponer el motivo crudo al cliente).
4. THE configuración de PHP en Hostinger (`upload_max_filesize`, `post_max_size`, `max_execution_time`, `memory_limit`) SHALL documentarse en el README con los valores recomendados para que `Max_File_Size` y `Max_Post_Size` funcionen.

### Requirement 14: Cobertura de tests automatizada

**User Story:** Como mantenedor del repositorio, quiero que `node --test` siga verde tras añadir esta feature y que los nuevos tests cubran los aspectos no triviales sin volverse frágiles.

#### Acceptance Criteria

1. THE comando `node --test` SHALL ejecutar los tests existentes en `tests/rsvp.test.js` con todos pasando, sin modificaciones funcionales en sus aserciones.
2. THE repositorio SHALL incluir un nuevo fichero `tests/media.test.js` que valide al menos:
    1. Existencia de `<form>` de medios con `enctype="multipart/form-data"` y `action` apuntando a `/api/upload.php`.
    2. Presencia de los `Metadata_Fields` con sus `name` (`personas`, `momento`, `pie`) y de los `Moment_Options` exactos como `<option>`.
    3. Presencia del Honeypot `name="bot-field"` no visible.
    4. Presencia de un `<input type="file">` con `accept` cubriendo los `Allowed_MIME_Types` y atributo `multiple`.
    5. Existencia del fichero `api/upload.php` con: bloque PHP de apertura, comprobación de método POST, comprobación de honeypot, validación de `$_FILES`, helpers `slugify`, `safe_filename`, `detect_mime`, `append_to_csv`, y un `MEDIA_CONFIG` con las claves esperadas.
    6. Ausencia de mojibake en el HTML servido (`Ã`, `Â`, `â`, `ð`).
3. THE Media_Form SHALL aparecer en el HTML estrictamente entre los marcadores `<!-- RSVP -->` y `<!-- NOSOTROS -->`, en su propio bloque `<!-- MEDIA -->`, verificable por un test que exija `position(<!-- RSVP -->) < position(<!-- MEDIA -->) < position(<!-- NOSOTROS -->)`.
4. THE round-trip de la fila CSV: dado un payload de prueba que pase por la lógica de construcción de fila (`build_csv_row` o equivalente, expuesta como función pura para tests) y de vuelta por una función de parseo simétrica, THE valores originales SHALL preservarse para los campos `Personas`, `Momento`, `Pie`, `Source`, incluyendo casos con tildes, ñ, comillas y separadores.
5. WHERE los tests necesiten ejecutar PHP, podrán lanzarse mediante `child_process.spawnSync` invocando `php` con un script de test específico, sin requerir un servidor real. SI el binario `php` no está en el PATH del sistema de tests, los tests de PHP SHALL marcarse como skipped en lugar de fallar.

### Requirement 15: Despliegue y migración GitHub → Hostinger

**User Story:** Como pareja iterando rápido, quiero seguir trabajando en el repo de GitHub y, cuando esté todo listo, desplegar a Hostinger sin reescribir nada.

#### Acceptance Criteria

1. THE repositorio SHALL contener TODA la feature en código versionado: `index.html`, `api/upload.php`, `.htaccess`, `tests/media.test.js`, documentación. Nada SHALL existir sólo en el servidor.
2. THE estructura del repositorio SHALL coincidir exactamente con la estructura que se subirá a `public_html/` de Hostinger:
    ```
    /                                 # raíz del repo == public_html
    ├── index.html
    ├── assets/
    ├── api/
    │   └── upload.php
    └── .htaccess (si aplica)
    ```
3. THE README SHALL documentar dos modos de deploy:
    1. **Manual via File Manager / FTP**: zip del contenido del repo (excluyendo `.kiro/`, `tests/`, `node_modules/`, `qa_shots/`) y subida.
    2. **Git deploy via Hostinger Git integration**: configuración del repositorio remoto en hPanel con la rama `main` y la ruta de despliegue `public_html/`.
4. THE configuración de Hostinger PHP (en hPanel → Avanzado → Configuración PHP) SHALL ajustarse a los valores documentados en el README (al menos `upload_max_filesize`, `post_max_size`, `max_execution_time`).
5. THE creación inicial de `Private_Dir` y de `_pepper.txt` SHALL documentarse como un paso manual de "primera vez" en el README, ya que ambos viven fuera del repositorio.
6. WHILE la feature aún se desarrolla en GitHub Pages, THE Media_Form SHALL seguir presente y mostrar un mensaje informativo en español si detecta que `window.location.hostname` NO es `milenayomar.es`, indicando que el endpoint todavía no está disponible y NO intentando enviar al endpoint inexistente. Esto evita errores 404 ruidosos durante la fase de iteración.

### Requirement 16: Documentación operativa para la pareja

**User Story:** Como pareja, necesito saber cómo desplegar todo, dónde mirar las fotos y cómo desactivar la sección si fuera necesario.

#### Acceptance Criteria

1. THE README principal SHALL incluir un apartado "Subida de medios (Hostinger)" en español que explique:
    1. Cómo crear `Private_Dir` por File Manager y dónde colocarlo (al lado de `public_html`, NO dentro).
    2. Cómo generar `_pepper.txt` con un valor aleatorio y dónde guardarlo.
    3. Cómo subir/desplegar `api/upload.php` y el `.htaccess`.
    4. Qué valores poner en la configuración PHP del panel de Hostinger.
    5. Dónde se anotan los metadatos (`Private_Dir/log.csv`) y cómo abrirlo con Excel/Numbers respetando UTF-8.
    6. Cómo cambiar `MEDIA_CONFIG` para ajustar tamaños y momentos.
    7. Cómo ocultar la `Media_Section` (un único interruptor en `index.html`).
2. THE README SHALL recordar que el repositorio es público y que ni el `Media_Endpoint` ni la estructura del CSV son secretos, pero los archivos subidos SÍ son privados y `_pepper.txt` NUNCA debe versionarse.
3. THE `.gitignore` SHALL incluir `_pepper.txt`, `private_uploads/`, `qa_shots/`, `node_modules/` y cualquier otro artefacto runtime para evitar fugas accidentales.
