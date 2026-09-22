# Mindzyxs-FrontEnd

Front-end SPA multi-página (HTML + CSS + JavaScript vanilla con ES modules) de `Mindzyxs 1.1`. Consume la API REST `Mindzyxs-API` en `http://localhost:5015/api` — nunca toca la BD directamente.

## 1. Levantar el front

Estática pura, sin build ni dependencias. Se sirve con cualquier servidor estático:

```bash
npx serve . -l 3000
# → http://localhost:3000
```

Requisitos en `index.html`:

```html
<!-- Si hay sesión activa (sessionStorage.usuario o sessionStorage.es_invitado === 'true') → views/inicio.html, sino → views/login.html -->
```

**Importante:** tener la API corriendo en `http://localhost:5015` (ver `Mindzyxs-API/README.md`). La base URL se define en `js/services/apiClient.js:API_BASE_URL`.

## 2. Estructura del proyecto

```
Mindzyxs-FrontEnd/
├── index.html                   # Punto de entrada: redirige a inicio.html o login.html según sesión
├── assets/
│   └── Logo1.png                # Logo de la aplicación
├── css/                         # Hoja de estilos por vista
│   ├── base.css                 # Reset, tipografía y estilos compartidos
│   ├── login.css                # Pantalla de inicio de sesión y botón de modo invitado
│   ├── registro.css             # Pantalla de registro
│   ├── verificacion.css         # Verificación de correo de registro
│   ├── recuperar_contrasena.css # Solicitud de recuperación de contraseña
│   ├── verificacion_recuperar.css # Verificación del código de recuperación
│   ├── nueva_contrasena.css     # Definición de la nueva contraseña
│   ├── inicio.css               # Página de inicio / bienvenida (paciente e invitado, PB-06)
│   ├── encuesta_invitado.css    # Cuestionario de bienestar para modo invitado
│   └── admin_bd.css             # Consola de administración de BD (PB-27)
├── views/                       # Las páginas (una por archivo)
│   ├── login.html               # Iniciar sesión y acceso a Modo Invitado
│   ├── registro.html            # Registro de Paciente/Psicólogo (multipart/form-data)
│   ├── verificacion.html        # Ingresar código de 6 dígitos del registro
│   ├── recuperar_contrasena.html# Correo para recuperar contraseña
│   ├── verificacion_recuperar.html # Código de recuperación
│   ├── nueva_contrasena.html    # Nueva contraseña
│   ├── inicio.html              # Inicio (paciente / invitado con 4 exclusivas bloqueadas)
│   ├── encuesta_invitado.html   # Cuestionario de bienestar para invitados
│   ├── consultar_recomendaciones.html # Consulta de recomendaciones de apoyo
│   └── admin_bd.html            # Consola admin: respaldos y mantenimiento (PB-27)
└── js/
    ├── services/                # Comunicación con la API
    │   ├── apiClient.js         # Cliente HTTP base: postJson, postFormData, getJson, getBlob
    │   ├── authService.js       # Login, registro, verificación, recuperación, logout
    │   ├── adminService.js      # PB-27: crear/listar/descargar respaldos y mantenimiento
    │   ├── avisoService.js      # PB-04: visualización y aceptación del mensaje aclaratorio
    │   └── invitadoService.js   # PB-06: modo invitado, auditoría de accesos y bloqueos
    ├── controllers/             # Lógica por vista (un controlador por página)
    │   ├── loginController.js
    │   ├── registroController.js
    │   ├── verificacionController.js
    │   ├── recuperarContrasenaController.js
    │   ├── verificacionRecuperarController.js
    │   ├── nuevaContrasenaController.js
    │   ├── inicioController.js
    │   └── adminBdController.js
    └── utils/
        ├── validators.js        # esCampoVacio, tieneArroba, etc.
        └── alerts.js            # marcarErrorInput, mostrarBanner, abrirModal, etc.
```

## 3. Vistas y flujos

| Vista | Archivo | Controlador | Flujo |
|-------|---------|-------------|-------|
| Punto de entrada | `index.html` | — | `sessionStorage.usuario` o `sessionStorage.es_invitado === 'true'` → `inicio.html`, sino `login.html` |
| Iniciar sesión / Invitado | `views/login.html` | `loginController.js` | `POST /api/account/login`; por rol redirige a `admin_bd.html` o `inicio.html`. Botón "Entrar como invitado" → `POST /api/invitado/acceso` y va a `inicio.html` |
| Registro | `views/registro.html` | `registroController.js` | `POST /api/account/register` `multipart/form-data` → redirige a verificación |
| Verificación de correo | `views/verificacion.html` | `verificacionController.js` | `POST /api/account/verify` + `resend` |
| Recuperar contraseña | `views/recuperar_contrasena.html` | `recuperarContrasenaController.js` | `POST /api/account/forgot` |
| Verificar código recuperación | `views/verificacion_recuperar.html` | `verificacionRecuperarController.js` | `POST /api/account/forgot/verify` + `resend` |
| Nueva contraseña | `views/nueva_contrasena.html` | `nuevaContrasenaController.js` | `POST /api/account/forgot/reset` |
| Inicio (Paciente e Invitado) | `views/inicio.html` | `inicioController.js` | Modo invitado: 3 opciones básicas y 4 exclusivas bloqueadas (`POST /api/invitado/bloqueo`). Registrado: servicios completos. Integra mensaje aclaratorio (PB-04) |
| Encuesta de invitado | `views/encuesta_invitado.html` | — | Cuestionario de bienestar emocional accesible para invitados |
| Recomendaciones | `views/consultar_recomendaciones.html` | — | Consejos y recomendaciones generales de bienestar |
| Consola admin BD (PB-27) | `views/admin_bd.html` | `adminBdController.js` | `POST /api/admin/backup`, `GET /api/admin/backups`, `GET /api/admin/backups/{id}/download`, `POST /api/admin/maintenance` |

## 4. Servicios

### `js/services/apiClient.js`

Base URL fija `http://localhost:5015/api`. Expone:

* `postJson(endpoint, data, opciones)` — POST JSON.
* `postFormData(endpoint, formData, opciones)` — POST `multipart/form-data`.
* `getJson(endpoint, opciones)` — GET JSON.
* `getBlob(endpoint, opciones)` — GET como Blob (descarga de archivos).

Agrega automáticamente `Authorization: Bearer <token>` si existe `token` en `localStorage`/`sessionStorage`. Errores: devuelven `{ ok:false, status, error }`; si no hay backend → `{ ok:false, isNetworkError:true, error:"No fue posible conectar con el servidor backend." }`.

### `js/services/authService.js`

| Método | Endpoint | Uso |
|--------|----------|-----|
| `login(correo, password)` | `POST /account/login` | Guarda `token`, `usuario`, `rol` y devuelve `{exito, rol, destino}` |
| `register(formData)` | `POST /account/register` | Registro con `FormData` |
| `verifyCode(correo, codigo)` | `POST /account/verify` | Verifica código del registro |
| `resendCode(correo)` | `POST /account/resend` | Reenvía código del registro |
| `getCatalogos()` | `GET /account/catalogos` | Tipos de cuenta y géneros |
| `getSesion()` | — | Lee `usuario` de `sessionStorage`/`localStorage` |
| `logout()` | — | Limpia todo el storage (sin llamar API) |
| `requestPasswordReset(correo)` | `POST /account/forgot` | Solicita código de recuperación |
| `verifyPasswordResetCode(correo, codigo)` | `POST /account/forgot/verify` | Valida el código |
| `resendRecoveryCode(correo)` | `POST /account/forgot/resend` | Reenvía código de recuperación |
| `resetPassword(correo, codigo, nueva)` | `POST /account/forgot/reset` | Guarda la nueva contraseña |

Los métodos devuelven `{ exito:boolean, mensaje }` — nunca lanzan excepción hacia el controlador. `expirado: res.status === 410` en verificación/reinicio para mostrar el enlace "Reenviar código".

### `js/services/avisoService.js` (PB-04)

Gestiona la visualización obligatoria previa del mensaje aclaratorio (no diagnóstico ni sustituto clínico) y el enlace permanente del pie de página.

| Método | Endpoint | Uso |
|--------|----------|-----|
| `registrarVisualizacion(origen, resultado)` | `POST /aviso/visualizacion` | Registra en auditoría la visualización del aviso aclaratorio |
| `obtenerEstado()` | — | Consulta en `sessionStorage` si ya fue aceptado en la sesión |
| `marcarAvisoAceptado()` | — | Marca en `sessionStorage` que el aviso fue aceptado |
| `haAceptadoAviso()` | — | Retorna `true` si ya fue aceptado en la sesión actual |
| `resetearAviso()` | — | Limpia el estado de aceptación del aviso (usado en logout) |
| `logAuditoria(mensaje)` | — | Emite logs estructurados en consola con prefijo `[PB-04]` |

### `js/services/invitadoService.js` (PB-06)

Controla el flujo de acceso sin cuenta a la plataforma y audita ingresos, bloqueos y salidas hacia el backend.

| Método | Endpoint | Uso |
|--------|----------|-----|
| `obtenerConfiguracionPanel()` | `GET /invitado/panel` | Obtiene lista oficial de opciones disponibles y exclusivas (con fallback local) |
| `iniciarModoInvitado(origen)` | `POST /invitado/acceso` | Limpia credenciales previas, fija `sessionStorage.es_invitado = 'true'` y registra acceso |
| `registrarBloqueo(funcion)` | `POST /invitado/bloqueo` | Registra intento bloqueado de acceder a función exclusiva |
| `salirModoInvitado(origen)` | `POST /invitado/salida` | Registra salida y limpia el estado de invitado |
| `esInvitado()` | — | Retorna `true` si la sesión actual está en modo invitado |
| `logAuditoria(mensaje)` | — | Emite logs estructurados en consola con prefijo `[HU1-PB6]` |

### `js/services/adminService.js` (PB-27)

| Método | Endpoint | Uso |
|--------|----------|-----|
| `crearRespaldo()` | `POST /admin/backup` | Crea respaldo nativo SQL (`.bak`) |
| `listarRespaldos()` | `GET /admin/backups` | Lista los respaldos existentes |
| `descargarRespaldo(id, nombre)` | `GET /admin/backups/{id}/download` | Descarga el archivo como Blob |
| `ejecutarMantenimiento()` | `POST /admin/maintenance` | Limpieza de códigos/sesiones/logs expirados |

> **Nota:** el respaldo `POST /admin/backup` descarga el `.bak` creado en la misma respuesta; `GET /admin/backups/{id}/download` permite descargar cualquier respaldo listado.

## 5. Manejo de sesión

* `authService.login` guarda el **token** en `localStorage` + `sessionStorage`, y los datos del usuario en `sessionStorage.usuario` como JSON (`{id, correo, nombre, rol, panel}`), además de `localStorage.rol`.
* `authService.getSesion()` se usa en páginas protegidas (`inicio.html`) para nombre/rol y para redirigir a `login.html` si no hay sesión.
* `logout()` limpia `sessionStorage` y `localStorage` y navega a `login.html`.
* **Modo Invitado (PB-06):** se almacena en `sessionStorage.es_invitado = 'true'`. No requiere token JWT. Al pulsar "Salir del modo invitado" o "Iniciar sesión" en el header, `invitadoService.salirModoInvitado()` limpia el storage y redirige a `login.html`.
* **Mensaje Aclaratorio (PB-04):** se almacena en `sessionStorage.avisoAclaratorioAceptado = 'true'` para no volver a interrumpir la navegación del usuario/invitado durante la misma sesión tras haberlo aceptado.
* Redirección por rol en `loginController.js:destinoPorRol()`: `administrador`/`admin` → `admin_bd.html`, resto → `inicio.html`.

## 6. Notas front

* No usa frameworks ni bundlers: ES modules (`type="module"`), sin `package.json`.
* Los mensajes de error se muestran tal cual los envía la API (banners bajo los campos).
* La página de bienvenida (`inicio.html`) es la referencia de estilo; se adapta dinámicamente según el rol o si el usuario navega en modo invitado.
* **PB-04 (Mensaje aclaratorio):** se muestra obligatoriamente la primera vez que un paciente o invitado intenta acceder al cuestionario en la sesión, además de estar disponible permanentemente desde el enlace del footer.
* **PB-06 (Modo invitado):** ofrece 3 opciones permitidas (cuestionario, recomendaciones básicas y modal de líneas de ayuda) y bloquea 4 funciones exclusivas con toast explicativo y auditoría en consola/backend.
* El front de PB-27 (consola admin) no incluye restauración de respaldos — solo crear, listar/descargar y mantenimiento.