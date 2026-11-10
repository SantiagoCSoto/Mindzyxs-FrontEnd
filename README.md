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
│   ├── cuestionario_paciente.css # Cuestionario de bienestar para pacientes autenticados (PB-11)
│   ├── perfil.css               # Perfil de usuario (paciente) y modal de verificación (PB-10)
│   ├── historial.css            # Historial emocional: tarjetas de eventos, filtros y detalle (PB-13)
│   ├── progreso_emocional.css   # Progreso emocional del paciente (rol psicólogo, PB-14)
│   ├── recordatorios.css        # Configuración de recordatorios emocionales (PB-15)
│   ├── gestion_usuarios.css     # Gestión y edición de usuarios del sistema (PB-25)
│   ├── validar_psicologos.css   # Cola de validación y credenciales de psicólogos (PB-26)
│   ├── notificaciones_sistema.css # Plantillas y canales de notificaciones (PB-30)
│   └── admin_bd.css             # Consola de administración de BD (PB-27)
├── views/                       # Las páginas (una por archivo)
│   ├── login.html               # Iniciar sesión y acceso a Modo Invitado
│   ├── registro.html            # Registro de Paciente/Psicólogo (multipart/form-data)
│   ├── verificacion.html        # Ingresar código de 6 dígitos del registro
│   ├── recuperar_contrasena.html# Correo para recuperar contraseña
│   ├── verificacion_recuperar.html # Código de recuperación
│   ├── nueva_contrasena.html    # Nueva contraseña
│   ├── inicio.html              # Inicio (paciente / invitado con 4 exclusivas bloqueadas)
│   ├── cuestionario_paciente.html # Cuestionario de bienestar emocional para paciente (PB-11)
│   ├── historial.html           # Historial emocional del paciente: lista, filtros por fecha y modal de detalle (PB-13)
│   ├── perfil.html              # Perfil de paciente: visualización, edición y verificación de correo (PB-10)
│   ├── progreso_emocional.html  # Progreso emocional: gráfico SVG, selector de pacientes y KPIs (PB-14)
│   ├── recordatorios.html       # Configuración de recordatorios de registro emocional (PB-15)
│   ├── encuesta_invitado.html   # Cuestionario de bienestar para invitados
│   ├── panel_admin.html         # Panel centralizado de administración (PB-25, PB-26, PB-27, PB-30)
│   ├── gestion_usuarios.html    # Gestión y administración de usuarios (PB-25)
│   ├── validar_psicologos.html  # Validación y revisión de credenciales de psicólogos (PB-26)
│   ├── notificaciones_sistema.html # Administración y preview de notificaciones (PB-30)
│   └── admin_bd.html            # Consola admin: respaldos y mantenimiento (PB-27)
└── js/
    ├── services/                # Comunicación con la API
    │   ├── apiClient.js         # Cliente HTTP base: postJson, postFormData, getJson, putJson, getBlob
    │   ├── authService.js       # Login, registro, verificación, recuperación, logout
    │   ├── cuestionarioService.js # PB-11: cuestionario de paciente y guardado en historial
    │   ├── historialService.js  # PB-13: consulta de historial por fechas, detalle de evento y auditoría
    │   ├── perfilService.js     # PB-10: actualización de perfil, solicitud y confirmación de cambio de correo
    │   ├── progresoService.js   # PB-14: consulta de pacientes autorizados y serie de progreso emocional
    │   ├── recordatorioService.js # PB-15: configuración de frecuencia, horario y avisos de hoy
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
    │   ├── cuestionarioPacienteController.js
    │   ├── historialController.js
    │   ├── perfilController.js
    │   ├── progresoController.js
    │   ├── recordatorioController.js
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
| Cuestionario (Paciente) | `views/cuestionario_paciente.html` | `cuestionarioPacienteController.js` | Cuestionario de 5 preguntas sobre bienestar emocional para pacientes autenticados; guarda respuestas en historial (`POST /api/cuestionario/paciente/finalizar`) (PB-11) |
| Historial emocional | `views/historial.html` | `historialController.js` | Consulta de eventos emocionales y cuestionarios ordenados por fecha (recientes primero). Filtro por rango de fechas (`GET /api/historial?desde=&hasta=`) y visualización de detalle con notas, respuestas y observaciones (`GET /api/historial/{id}`) (PB-13) |
| Perfil (Paciente) | `views/perfil.html` | `perfilController.js` | Visualiza y edita datos personales (nombres, apellidos, fecha de nacimiento, género y correo). `PUT /api/account/perfil` para actualización directa; `POST /api/account/correo/solicitar` y `POST /api/account/correo/confirmar` con código de 6 dígitos si se cambia el correo (PB-10) |
| Progreso emocional (Psicólogo) | `views/progreso_emocional.html` | `progresoController.js` | Exclusivo rol Psicólogo. Lista pacientes autorizados (`GET /api/progreso/pacientes`), filtra por rango de fechas y grafica la evolución emocional (1–5) mediante SVG dinámico. Calcula 3 KPIs (Promedio, Tendencia, Registros) y gestiona estados sin datos y paciente no autorizado 403 (PB-14) |
| Recordatorios (Paciente) | `views/recordatorios.html` | `recordatorioController.js` | Configuración de avisos para registro emocional con frecuencia diaria o semanal (días específicos), horario programado, switch toggle de activación (`POST /api/recordatorios`) y consulta de avisos vencidos hoy (`GET /api/recordatorios/hoy`) (PB-15) |
| Encuesta de invitado | `views/encuesta_invitado.html` | — | Cuestionario de bienestar emocional accesible para invitados |
| Panel Administrador | `views/panel_admin.html` | — | Acceso centralizado a los módulos administrativos del sistema (PB-25, PB-26, PB-27, PB-30) |
| Gestión de usuarios (Admin) | `views/gestion_usuarios.html` | `gestionUsuariosController.js` | Consulta con filtros (rol, estado, texto), edición de datos y restablecimiento forzado de contraseña (`GET /api/admin/usuarios`, `PUT /api/admin/usuarios/{id}`, `PUT /api/admin/usuarios/{id}/estado`, `POST /api/admin/usuarios/{id}/reset-password`) (PB-25) |
| Validación de psicólogos (Admin) | `views/validar_psicologos.html` | `validarPsicologosController.js` | Cola de psicólogos pendientes de aprobación, detalle de credenciales, descarga de PDF de tarjeta profesional, y aprobación/rechazo (`GET /api/admin/psicologos/pendientes`, `GET /api/admin/psicologos/{id}/validacion`, `GET /api/admin/psicologos/{id}/tarjeta`, `POST /api/admin/psicologos/{id}/aprobar`, `POST /api/admin/psicologos/{id}/rechazar`) (PB-26) |
| Notificaciones del sistema (Admin) | `views/notificaciones_sistema.html` | `notificacionesController.js` | Catálogo de eventos, canal correo, editor de plantillas con variables y simulador de preview (`GET /api/admin/notificaciones`, `GET /api/admin/notificaciones/{tipo}`, `PUT /api/admin/notificaciones/{tipo}`, `POST /api/admin/notificaciones/{tipo}/preview`) (PB-30) |
| Consola admin BD (PB-27) | `views/admin_bd.html` | `adminBdController.js` | `POST /api/admin/backup`, `GET /api/admin/backups`, `GET /api/admin/backups/{id}/download`, `POST /api/admin/maintenance` |

## 4. Servicios

### `js/services/apiClient.js`

Base URL fija `http://localhost:5015/api`. Expone:

* `postJson(endpoint, data, opciones)` — POST JSON.
* `postFormData(endpoint, formData, opciones)` — POST `multipart/form-data`.
* `getJson(endpoint, opciones)` — GET JSON.
* `putJson(endpoint, data, opciones)` — PUT JSON.
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

### `js/services/perfilService.js` (PB-10)

Gestiona la actualización de datos personales del paciente y el flujo de verificación al modificar el correo electrónico.

| Método | Endpoint | Uso |
|--------|----------|-----|
| `actualizarPerfil(datos)` | `PUT /account/perfil` | Actualiza nombres, apellidos, fechaNacimiento e idGenero |
| `solicitarCambioCorreo(nuevoCorreo)` | `POST /account/correo/solicitar` | Solicita envío de código de 6 dígitos al nuevo correo (retorna 409 si ya existe) |
| `confirmarCambioCorreo(nuevoCorreo, codigo)` | `POST /account/correo/confirmar` | Valida código de 6 dígitos y confirma el cambio de correo |
| `obtenerPerfilActual()` | — | Lee los datos de la sesión actual (`sessionStorage`/`localStorage`) con fallback estructurado |
| `guardarPerfilEnSesion(nuevosDatos)` | — | Actualiza el objeto de usuario en sesión y almacenamiento local |
| `calcularEdad(fechaStr)` | — | Calcula la edad exacta en años a partir de la fecha de nacimiento |
| `formatearFecha(fechaStr)` | — | Convierte fecha YYYY-MM-DD a formato amigable DD/MM/YYYY |
| `logAuditoria(accion, detalle)` | — | Emite logs estructurados en consola con prefijo `[HU1-PB10]` |

### `js/services/historialService.js` (PB-13)

Gestiona la consulta del historial de eventos emocionales y cuestionarios del paciente con filtros por rango de fechas y detalle interactivo.

| Método | Endpoint | Uso |
|--------|----------|-----|
| `obtenerHistorial(desde, hasta)` | `GET /historial` | Consulta el historial propio con filtros opcionales de fecha (`?desde=&hasta=`) |
| `obtenerDetalle(id)` | `GET /historial/{id}` | Obtiene nota propia, respuestas de cuestionario y observaciones del psicólogo |
| `normalizarItem(item)` | — | Mapea fecha, hora, categorías visuales (`pos`, `neu`, `low`) y emojis |
| `normalizarDetalle(detalle)` | — | Estructura respuestas y observaciones para el modal de detalle |
| `obtenerHistorialFallback(desde, hasta)` | — | Datos de respaldo para pruebas sin conexión |
| `logAuditoria(accion, detalle)` | — | Emite logs estructurados en consola con prefijo `[HU1-PB13]` |

### `js/services/progresoService.js` (PB-14)

Gestiona la consulta del progreso emocional de pacientes autorizados asignados al psicólogo en sesión (`/api/progreso`).

| Método | Endpoint | Uso |
|--------|----------|-----|
| `obtenerPacientesAutorizados()` | `GET /progreso/pacientes` | Lista los pacientes autorizados asignados al psicólogo |
| `obtenerProgresoPaciente(idPaciente, desde, hasta)` | `GET /progreso/{idPaciente}?desde=&hasta=` | Obtiene serie temporal, promedio, tendencia, distribución y total de registros (maneja 403 Forbidden) |
| `normalizarProgreso(data)` | — | Normaliza datos del backend a estructura homogénea para el gráfico y KPIs |
| `formatearTendencia(tendencia)` | — | Convierte tendencia del backend a texto con indicador direccional (`↗ Mejorando`, `↘ Bajando`, `→ Estable`) |
| `formatearFechaCorta(fechaStr)` | — | Convierte fechas ISO a formato `DD/MM` para los nodos y el eje X |
| `logAuditoria(accion, detalle)` | — | Emite logs estructurados en consola con prefijo `[HU1-PB14]` |

### `js/services/recordatorioService.js` (PB-15)

Gestiona la configuración y consulta de avisos periódicos para el registro emocional del paciente (`/api/recordatorios`).

| Método | Endpoint | Uso |
|--------|----------|-----|
| `obtenerConfiguracion()` | `GET /recordatorios` | Consulta la configuración actual del paciente (frecuencia, hora, días, estado activo) o 204 si nunca configuró |
| `guardarConfiguracion(datos)` | `POST /recordatorios` | Guarda o actualiza la configuración (valida frecuencia y hora obligatorias; días 1-7 si es semanal) |
| `obtenerAvisosHoy()` | `GET /recordatorios/hoy` | Consulta los avisos programados vencidos hoy para notificación al paciente |
| `normalizarConfig(data)` | — | Estructura homogénea de campos, días numéricos y nombres legibles |
| `formatearTextoResumen(config)` | — | Genera texto descriptivo para el banner de estado actual (`Diaria 08:00 · Activa`, etc.) |
| `logAuditoria(accion, detalle)` | — | Emite logs estructurados en consola con prefijo `[HU1-PB15]` |

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

### `js/services/gestionUsuariosService.js` (PB-25)

| Método | Endpoint | Uso |
|--------|----------|-----|
| `listarUsuarios(params)` | `GET /admin/usuarios` | Lista usuarios con filtros por rol, estado y búsqueda |
| `obtenerDetalleUsuario(id)` | `GET /admin/usuarios/{id}` | Obtiene información detallada del usuario |
| `actualizarUsuario(id, datos)` | `PUT /admin/usuarios/{id}` | Actualiza datos personales (nombres, apellidos, correo, fecha, género) |
| `cambiarEstadoUsuario(id, estado)` | `PUT /admin/usuarios/{id}/estado` | Modifica estado de cuenta (Activa, Suspendida, Inactiva) |
| `forzarRestablecimientoPassword(id)` | `POST /admin/usuarios/{id}/reset-password` | Envía código de restablecimiento forzado al correo |

### `js/services/validarPsicologosService.js` (PB-26)

| Método | Endpoint | Uso |
|--------|----------|-----|
| `listarSolicitudesPendientes()` | `GET /admin/psicologos/pendientes` | Lista solicitudes en espera de validación |
| `obtenerDetalleSolicitud(id)` | `GET /admin/psicologos/{id}/validacion` | Consulta credenciales, especialidades y estado de tarjeta |
| `descargarTarjetaProfesional(id)` | `GET /admin/psicologos/{id}/tarjeta` | Descarga el archivo de tarjeta profesional en PDF como Blob |
| `aprobarPsicologo(id)` | `POST /admin/psicologos/{id}/aprobar` | Aprueba la solicitud y activa la cuenta del psicólogo |
| `rechazarPsicologo(id, motivo)` | `POST /admin/psicologos/{id}/rechazar` | Rechaza la solicitud con motivo opcional y notificación |

### `js/services/notificacionesService.js` (PB-30)

| Método | Endpoint | Uso |
|--------|----------|-----|
| `listarNotificaciones()` | `GET /admin/notificaciones` | Consulta catálogo de eventos y estado de canales |
| `obtenerDetalleNotificacion(tipo)` | `GET /admin/notificaciones/{tipo}` | Obtiene configuración de un evento específico |
| `actualizarNotificacion(tipo, cfg)` | `PUT /admin/notificaciones/{tipo}` | Actualiza canales, activación, asunto y plantilla |
| `obtenerPreviewNotificacion(tipo, vars)` | `POST /admin/notificaciones/{tipo}/preview` | Simula renderizado con variables dinámicas |

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
* **PB-10 (Editar perfil de paciente):** permite visualizar el perfil con avatar generado dinámicamente con las iniciales, nombres, apellidos, fecha de nacimiento calculando la edad en años (mínimo 14 años, sin fechas futuras), género y correo. Si el correo se modifica, se activa un modal de verificación con código numérico de 6 dígitos y reenvío.
* **PB-13 (Historial emocional del paciente):** permite visualizar el registro cronológico (recientes primero) de estados de ánimo y cuestionarios respondidos. Incluye filtro interactivo por rango de fechas (desde / hasta), estado vacío con botón de registro si no hay eventos y modal interactivo para consultar el detalle (notas personales "Cómo me sentí", respuestas del cuestionario y notas de apoyo del psicólogo asignado).
* **PB-14 (Progreso emocional del paciente - Rol Psicólogo):** Permite al profesional de la salud mental consultar la evolución emocional (escala de 1 a 5) de sus pacientes autorizados a través de un gráfico SVG dinámico (`viewBox="0 0 620 280"`) con guía punteada de estabilidad en nivel 3, filtros de fecha desde/hasta con validación cronológica, 3 KPIs (Promedio, Tendencia direccional y Total de registros) y manejo de estados especiales (bloqueo por 403 no autorizado con solicitud de acceso, estado vacío para `< 2` registros y estado sin pacientes asignados).
* **PB-15 (Recordatorios para el registro emocional - Rol Paciente):** Permite al paciente programar avisos para registrar su bienestar emocional con periodicidad diaria o semanal (seleccionando días específicos de 1 a 7), definir la hora del aviso mediante un selector nativo, activar/desactivar recordatorios con un switch toggle sin perder la configuración guardada, consultar el resumen en un panel de estado visual y recibir notificaciones periódicas sincronizadas con el backend (`/api/recordatorios`).
* **PB-25 (Gestión de usuarios del sistema - Rol Administrador):** Permite al administrador consultar y filtrar a todos los usuarios por rol, estado y búsqueda de texto, editar su información de contacto y estado de cuenta, y forzar el restablecimiento de contraseña mediante envío seguro de código por correo.
* **PB-26 (Validación de psicólogos - Rol Administrador):** Permite al administrador revisar la cola de profesionales en espera de validación, examinar sus credenciales y especialidades declaradas, descargar la tarjeta profesional en formato PDF y aprobar o rechazar la solicitud con notificación formal por correo electrónico.
* **PB-30 (Notificaciones del sistema - Rol Administrador):** Permite al administrador configurar las plantillas de mensajes automáticos del sistema por correo electrónico, habilitar/deshabilitar eventos y validar el renderizado en tiempo real con previsualización interactiva.
* El front de PB-27 (consola admin) no incluye restauración de respaldos — solo crear, listar/descargar y mantenimiento.