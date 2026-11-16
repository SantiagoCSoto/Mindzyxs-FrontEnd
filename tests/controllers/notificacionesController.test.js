import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('notificacionesController.js', () => {
  const htmlPath = path.resolve(__dirname, '../../views/notificaciones_sistema.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/notificaciones_sistema.html';
    vi.restoreAllMocks();
  });

  it('debe requerir sesión de administrador', async () => {
    const { authService } = await import('../../js/services/authService.js');
    vi.spyOn(authService, 'getSesion').mockReturnValue(null);

    await expect(import('../../js/controllers/notificacionesController.js'))
      .rejects.toThrow('Sesión requerida');
    expect(window.location.href).toContain('login.html');
  });

  it('debe redirigir al panel correspondiente si el rol no es administrador', async () => {
    const { authService } = await import('../../js/services/authService.js');

    // Paciente
    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Paciente' });
    await expect(import('../../js/controllers/notificacionesController.js'))
      .rejects.toThrow('Acceso restringido');
    expect(window.location.href).toContain('panel_paciente.html');

    // Psicólogo
    vi.resetModules();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/notificaciones_sistema.html';
    const authService2 = (await import('../../js/services/authService.js')).authService;
    vi.spyOn(authService2, 'getSesion').mockReturnValue({ id: 2, rol: 'Psicologo' });
    await expect(import('../../js/controllers/notificacionesController.js'))
      .rejects.toThrow('Acceso restringido');
    expect(window.location.href).toContain('panel_psicologo.html');

    // Otro
    vi.resetModules();
    document.body.innerHTML = htmlContent;
    window.location.href = 'http://localhost/notificaciones_sistema.html';
    const authService3 = (await import('../../js/services/authService.js')).authService;
    vi.spyOn(authService3, 'getSesion').mockReturnValue({ id: 3, rol: 'Invitado' });
    await expect(import('../../js/controllers/notificacionesController.js'))
      .rejects.toThrow('Acceso restringido');
    expect(window.location.href).toContain('inicio.html');
  });

  it('debe listar eventos y renderizar diferentes iconos según tipo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const notificacionesService = await import('../../js/services/notificacionesService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(notificacionesService, 'listarNotificaciones').mockResolvedValue({
      ok: true,
      data: [
        { tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true },
        { tipo: 'PASSWORD_RESET', nombre: 'Recuperar clave', canales: [], activo: false },
        { tipo: 'APPROVAL_GRANTED', nombre: 'Aprobado', canales: ['correo'], activo: true },
        { tipo: 'APPROVAL_REJECTED', nombre: 'Rechazado', canales: [], activo: true },
        { tipo: 'REMINDER_ALERT', nombre: 'Recordatorio', canales: [], activo: true },
        { tipo: 'RISK_HIGH', nombre: 'Alerta riesgo', canales: [], activo: true },
        { tipo: 'OTRO_EVENTO', nombre: 'Otro', canales: ['push'], activo: true }
      ]
    });

    await import('../../js/controllers/notificacionesController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const listaEventos = document.getElementById('listaEventos');
    expect(listaEventos.innerHTML).toContain('Envío de código');
    expect(listaEventos.innerHTML).toContain('Recuperar clave');
    expect(listaEventos.innerHTML).toContain('Aprobado');
    expect(listaEventos.innerHTML).toContain('Rechazado');
    expect(listaEventos.innerHTML).toContain('Recordatorio');
    expect(listaEventos.innerHTML).toContain('Alerta riesgo');
    expect(listaEventos.innerHTML).toContain('Otro');

    const badgeContador = document.getElementById('badgeContador');
    const contadorTexto = document.getElementById('contadorTexto');
    expect(badgeContador.style.display).toBe('inline-block');
    expect(contadorTexto.textContent).toContain('7 eventos');
  });

  it('debe mostrar mensaje de vacío si el catálogo no tiene items', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const notificacionesService = await import('../../js/services/notificacionesService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(notificacionesService, 'listarNotificaciones').mockResolvedValue({
      ok: true,
      data: []
    });

    await import('../../js/controllers/notificacionesController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const vacio = document.getElementById('vacio');
    expect(vacio.style.display).toBe('block');
  });

  it('debe mostrar error si falla la carga del catálogo', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const notificacionesService = await import('../../js/services/notificacionesService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(notificacionesService, 'listarNotificaciones').mockResolvedValue({
      ok: false,
      error: 'Error de servidor'
    });

    await import('../../js/controllers/notificacionesController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const errCatalogo = document.getElementById('errCatalogo');
    expect(errCatalogo.textContent).toContain('Error de servidor');
  });

  it('debe permitir refrescar el catálogo con btnRefrescar', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const notificacionesService = await import('../../js/services/notificacionesService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    const spyListar = vi.spyOn(notificacionesService, 'listarNotificaciones').mockResolvedValue({
      ok: true,
      data: [{ tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true }]
    });

    await import('../../js/controllers/notificacionesController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const btnRefrescar = document.getElementById('btnRefrescar');
    btnRefrescar.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyListar).toHaveBeenCalledTimes(2);
  });

  it('debe permitir filtrar eventos por texto, canal y estado', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const notificacionesService = await import('../../js/services/notificacionesService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(notificacionesService, 'listarNotificaciones').mockResolvedValue({
      ok: true,
      data: [
        { tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true },
        { tipo: 'WELCOME', nombre: 'Bienvenida', canales: [], activo: false }
      ]
    });

    await import('../../js/controllers/notificacionesController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const fBuscar = document.getElementById('fBuscar');
    const fCanal = document.getElementById('fCanal');
    const fEstado = document.getElementById('fEstado');
    const listaEventos = document.getElementById('listaEventos');

    // Filtrar por texto
    fBuscar.value = 'código';
    fBuscar.dispatchEvent(new Event('input'));
    expect(listaEventos.innerHTML).toContain('Envío de código');
    expect(listaEventos.innerHTML).not.toContain('Bienvenida');

    // Limpiar texto y filtrar por canal
    fBuscar.value = '';
    fBuscar.dispatchEvent(new Event('input'));
    fCanal.value = 'correo';
    fCanal.dispatchEvent(new Event('change'));
    expect(listaEventos.innerHTML).toContain('Envío de código');
    expect(listaEventos.innerHTML).not.toContain('Bienvenida');

    // Filtrar por estado inactivo
    fCanal.value = '';
    fCanal.dispatchEvent(new Event('change'));
    fEstado.value = 'inactivo';
    fEstado.dispatchEvent(new Event('change'));
    expect(listaEventos.innerHTML).toContain('Bienvenida');
    expect(listaEventos.innerHTML).not.toContain('Envío de código');

    // Filtrar por estado activo
    fEstado.value = 'activo';
    fEstado.dispatchEvent(new Event('change'));
    expect(listaEventos.innerHTML).toContain('Envío de código');
  });

  it('debe manejar error al abrir edición si no existe el detalle', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const notificacionesService = await import('../../js/services/notificacionesService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(notificacionesService, 'listarNotificaciones').mockResolvedValue({
      ok: true,
      data: [{ tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true }]
    });
    vi.spyOn(notificacionesService, 'obtenerDetalleNotificacion').mockResolvedValue({
      ok: false,
      error: 'No encontrado'
    });

    await import('../../js/controllers/notificacionesController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const btnConfigurar = document.querySelector('.btn-editar');
    btnConfigurar.click();
    await new Promise(r => setTimeout(r, 40));

    const screenCatalogo = document.getElementById('screenCatalogo');
    expect(screenCatalogo.style.display).toBe('block');
  });

  it('debe permitir abrir edición de evento, modificar estado y guardar en modal', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const notificacionesService = await import('../../js/services/notificacionesService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(notificacionesService, 'listarNotificaciones').mockResolvedValue({
      ok: true,
      data: [{ tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true }]
    });
    vi.spyOn(notificacionesService, 'obtenerDetalleNotificacion').mockResolvedValue({
      ok: true,
      data: {
        tipo: 'CODE_SENT',
        nombre: 'Envío de código',
        canales: ['correo'],
        activo: true,
        asunto: 'Tu código de seguridad'
      }
    });
    const spyActualizar = vi.spyOn(notificacionesService, 'actualizarNotificacion').mockResolvedValue({
      ok: true,
      mensaje: 'Guardado'
    });

    await import('../../js/controllers/notificacionesController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const btnConfigurar = document.querySelector('.btn-editar');
    btnConfigurar.click();
    await new Promise(r => setTimeout(r, 40));

    const screenEditar = document.getElementById('screenEditar');
    expect(screenEditar.style.display).toBe('block');

    const chkActivo = document.getElementById('chkActivo');
    chkActivo.checked = false;
    chkActivo.dispatchEvent(new Event('change'));

    const formNotificacion = document.getElementById('formNotificacion');
    formNotificacion.dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise(r => setTimeout(r, 40));

    const btnModalSi = document.getElementById('btnModalSi');
    btnModalSi.click();
    await new Promise(r => setTimeout(r, 40));

    expect(spyActualizar).toHaveBeenCalledWith('CODE_SENT', expect.objectContaining({
      activo: false
    }));
  });

  it('debe validar que asunto no esté vacío si el canal de correo está habilitado y txtAsunto existe', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const notificacionesService = await import('../../js/services/notificacionesService.js');

    // Añadir txtAsunto al formulario antes de cargar el controller
    const inputAsunto = document.createElement('input');
    inputAsunto.id = 'txtAsunto';
    document.getElementById('formNotificacion').appendChild(inputAsunto);

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(notificacionesService, 'listarNotificaciones').mockResolvedValue({
      ok: true,
      data: [{ tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true }]
    });
    vi.spyOn(notificacionesService, 'obtenerDetalleNotificacion').mockResolvedValue({
      ok: true,
      data: { tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true, asunto: 'Código' }
    });

    await import('../../js/controllers/notificacionesController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const btnConfigurar = document.querySelector('.btn-editar');
    btnConfigurar.click();
    await new Promise(r => setTimeout(r, 40));

    const txtAsunto = document.getElementById('txtAsunto');
    txtAsunto.value = '   ';

    const formNotificacion = document.getElementById('formNotificacion');
    formNotificacion.dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise(r => setTimeout(r, 40));

    const errEditar = document.getElementById('errEditar');
    expect(errEditar.textContent).toContain('El asunto es obligatorio cuando el canal de correo está habilitado.');
  });

  it('debe validar que al menos un canal esté seleccionado si la notificación está habilitada', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const notificacionesService = await import('../../js/services/notificacionesService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(notificacionesService, 'listarNotificaciones').mockResolvedValue({
      ok: true,
      data: [{ tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true }]
    });
    vi.spyOn(notificacionesService, 'obtenerDetalleNotificacion').mockResolvedValue({
      ok: true,
      data: { tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true }
    });

    await import('../../js/controllers/notificacionesController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const btnConfigurar = document.querySelector('.btn-editar');
    btnConfigurar.click();
    await new Promise(r => setTimeout(r, 40));

    // Desmarcar canal correo
    const chkCanalCorreo = document.getElementById('chkCanalCorreo');
    chkCanalCorreo.checked = false;

    const formNotificacion = document.getElementById('formNotificacion');
    formNotificacion.dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise(r => setTimeout(r, 40));

    const errEditar = document.getElementById('errEditar');
    expect(errEditar.textContent).toContain('Debes seleccionar al menos un canal');
  });

  it('debe manejar error al guardar la notificación', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const notificacionesService = await import('../../js/services/notificacionesService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(notificacionesService, 'listarNotificaciones').mockResolvedValue({
      ok: true,
      data: [{ tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true }]
    });
    vi.spyOn(notificacionesService, 'obtenerDetalleNotificacion').mockResolvedValue({
      ok: true,
      data: { tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true, asunto: 'Prueba' }
    });
    vi.spyOn(notificacionesService, 'actualizarNotificacion').mockResolvedValue({
      ok: false,
      error: 'Error al persistir cambios'
    });

    await import('../../js/controllers/notificacionesController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const btnConfigurar = document.querySelector('.btn-editar');
    btnConfigurar.click();
    await new Promise(r => setTimeout(r, 40));

    const formNotificacion = document.getElementById('formNotificacion');
    formNotificacion.dispatchEvent(new Event('submit', { cancelable: true }));
    await new Promise(r => setTimeout(r, 40));

    const btnModalSi = document.getElementById('btnModalSi');
    btnModalSi.click();
    await new Promise(r => setTimeout(r, 40));

    const errEditar = document.getElementById('errEditar');
    expect(errEditar.textContent).toContain('Error al persistir cambios');
  });

  it('debe permitir actualizar previsualización interactiva con variables locales si existen elementos de preview', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const notificacionesService = await import('../../js/services/notificacionesService.js');

    // Añadir elementos de preview al DOM
    const varNombre = document.createElement('input');
    varNombre.id = 'varNombre';
    document.body.appendChild(varNombre);

    const txtAsunto = document.createElement('input');
    txtAsunto.id = 'txtAsunto';
    document.body.appendChild(txtAsunto);

    const prevAsunto = document.createElement('div');
    prevAsunto.id = 'prevAsunto';
    document.body.appendChild(prevAsunto);

    const btnActualizarPreview = document.createElement('button');
    btnActualizarPreview.id = 'btnActualizarPreview';
    document.body.appendChild(btnActualizarPreview);

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(notificacionesService, 'listarNotificaciones').mockResolvedValue({
      ok: true,
      data: [{ tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true }]
    });
    vi.spyOn(notificacionesService, 'obtenerDetalleNotificacion').mockResolvedValue({
      ok: true,
      data: { tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true, asunto: 'Hola {nombre}' }
    });
    vi.spyOn(notificacionesService, 'obtenerPreviewNotificacion').mockResolvedValue({
      ok: false
    });

    await import('../../js/controllers/notificacionesController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const btnConfigurar = document.querySelector('.btn-editar');
    btnConfigurar.click();
    await new Promise(r => setTimeout(r, 40));

    txtAsunto.value = 'Hola {nombre}';
    varNombre.value = 'Carlos';
    varNombre.dispatchEvent(new Event('input'));
    await new Promise(r => setTimeout(r, 40));

    expect(prevAsunto.textContent).toContain('Carlos');

    // Botón refrescar preview
    btnActualizarPreview.click();
    await new Promise(r => setTimeout(r, 40));
    expect(prevAsunto.textContent).toContain('Carlos');
  });

  it('debe cerrar modal con btnModalNo y clic fuera del modal', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const notificacionesService = await import('../../js/services/notificacionesService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(notificacionesService, 'listarNotificaciones').mockResolvedValue({
      ok: true,
      data: [{ tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true }]
    });
    vi.spyOn(notificacionesService, 'obtenerDetalleNotificacion').mockResolvedValue({
      ok: true,
      data: { tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true, asunto: 'Prueba' }
    });

    await import('../../js/controllers/notificacionesController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const btnConfigurar = document.querySelector('.btn-editar');
    btnConfigurar.click();
    await new Promise(r => setTimeout(r, 40));

    const formNotificacion = document.getElementById('formNotificacion');
    formNotificacion.dispatchEvent(new Event('submit', { cancelable: true }));

    const confirmModal = document.getElementById('confirmModal');
    expect(confirmModal.classList.contains('open')).toBe(true);

    const btnModalNo = document.getElementById('btnModalNo');
    btnModalNo.click();
    expect(confirmModal.classList.contains('open')).toBe(false);

    // Reabrir y cerrar clickeando el modal
    formNotificacion.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(confirmModal.classList.contains('open')).toBe(true);
    confirmModal.dispatchEvent(new MouseEvent('click', { bubbles: true, target: confirmModal }));
    expect(confirmModal.classList.contains('open')).toBe(false);
  });

  it('debe permitir cancelar edición y volver al catálogo con btnVolverCatalogo y btnCancelarEdicion', async () => {
    const { authService } = await import('../../js/services/authService.js');
    const notificacionesService = await import('../../js/services/notificacionesService.js');

    vi.spyOn(authService, 'getSesion').mockReturnValue({ id: 1, rol: 'Administrador' });
    vi.spyOn(notificacionesService, 'listarNotificaciones').mockResolvedValue({
      ok: true,
      data: [{ tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true }]
    });
    vi.spyOn(notificacionesService, 'obtenerDetalleNotificacion').mockResolvedValue({
      ok: true,
      data: { tipo: 'CODE_SENT', nombre: 'Envío de código', canales: ['correo'], activo: true }
    });

    await import('../../js/controllers/notificacionesController.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await new Promise(r => setTimeout(r, 40));

    const btnConfigurar = document.querySelector('.btn-editar');
    btnConfigurar.click();
    await new Promise(r => setTimeout(r, 40));

    const btnCancelarEdicion = document.getElementById('btnCancelarEdicion');
    btnCancelarEdicion.click();

    const screenCatalogo = document.getElementById('screenCatalogo');
    expect(screenCatalogo.style.display).toBe('block');

    // Volver a abrir y usar btnVolverCatalogo
    btnConfigurar.click();
    await new Promise(r => setTimeout(r, 40));
    const btnVolverCatalogo = document.getElementById('btnVolverCatalogo');
    btnVolverCatalogo.click();
    expect(screenCatalogo.style.display).toBe('block');
  });
});
