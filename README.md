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
<!-- Si hay sesión activa (sessionStorage.usuario) → views/inicio.html, sino → views/login.html -->
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
│   ├── login.css                # Pantalla de inicio de sesión
│   ├── registro.css             # Pantalla de registro
│   ├── verificacion.css         # Verificación de correo de registro
│   ├── recuperar_contrasena.css # Solicitud de recuperación de contraseña
│   ├── verificacion_recuperar.css # Verificación del código de recuperación
│   ├── nueva_contrasena.css     # Definición de la nueva contraseña
│   ├── inicio.css               # Página de inicio / bienvenida del paciente
│   └── admin_bd.css             # Consola de administración de BD (PB-27)
├── views/                       # Las páginas (una por archivo)
│   ├── login.html               # Iniciar sesión
│   ├── registro.html            # Registro de Paciente/Psicólogo (multipart/form-data)
│   ├── verificacion.html        # Ingresar código de 6 dígitos del registro
│   ├── recuperar_contrasena.html# Correo para recuperar contraseña
│   ├── verificacion_recuperar.html # Código de recuperación
│   ├── nueva_contrasena.html    # Nueva contraseña
│   ├── inicio.html              # Página de inicio del paciente (bienvenida + logout)
│   └── admin_bd.html            # Consola admin: respaldos y mantenimiento (PB-27)
└── js/
    ├── services/                # Comunicación con la API
    │   ├── apiClient.js         # Cliente HTTP base: postJson, postFormData, getJson, getBlob
    │   ├── authService.js       # Login, registro, verificación, recuperación, logout
    │   └── adminService.js      # PB-27: crear/listar/descargar respaldos y mantenimiento
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
| Punto de entrada | `index.html` | — | `sessionStorage.usuario` → `inicio.html`, sino `login.html` |
| Iniciar sesión | `views/login.html` | `loginController.js` | `POST /api/account/login`; por rol redirige a `admin_bd.html` (admin) o `inicio.html` |
| Registro | `views/registro.html` | `registroController.js` | `POST /api/account/register` `multipart/form-data` → redirige a verificación |
| Verificación de correo | `views/verificacion.html` | `verificacionController.js` | `POST /api/account/verify` + `resend` |
| Recuperar contraseña | `views/recuperar_contrasena.html` | `recuperarContrasenaController.js` | `POST /api/account/forgot` |
| Verificar código recuperación | `views/verificacion_recuperar.html` | `verificacionRecuperarController.js` | `POST /api/account/forgot/verify` + `resend` |
| Nueva contraseña | `views/nueva_contrasena.html` | `nuevaContrasenaController.js` | `POST /api/account/forgot/reset` |
| Inicio del paciente | `views/inicio.html` | `inicioController.js` | Muestra sesión activa y cierra sesión (limpia storage y va a `login.html`) |
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
* Redirección por rol en `loginController.js:destinoPorRol()`: `administrador`/`admin` → `admin_bd.html`, resto → `inicio.html`.

## 6. Notas front

* No usa frameworks ni bundlers: ES modules (`type="module"`), sin `package.json`.
* Los mensajes de error se muestran tal cual los envía la API (banners bajo los campos).
* La página de bienvenida (`inicio.html`) es la referencia de estilo; `admin_bd.css` reutiliza esa línea visual (hero degradado, tarjetas de sesión, `btn-logout`).
* El front de PB-27 (consola admin) no incluye restauración de respaldos — solo crear, listar/descargar y mantenimiento.