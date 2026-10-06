/**
 * Header por sesión: oculta el enlace Inicio (.nav-inicio) cuando hay sesión
 * iniciada (registrada o invitado) para evitar confusiones. En vistas públicas
 * sin sesión, Inicio permanece visible.
 */
(function () {
  function conSesion() {
    try {
      if (sessionStorage.getItem('es_invitado') === 'true') return true;
      return !!sessionStorage.getItem('usuario') && sessionStorage.getItem('autenticado') === 'true';
    } catch (e) {
      return false;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!conSesion()) return;
    document.querySelectorAll('.nav-inicio').forEach(function (el) {
      el.style.display = 'none';
    });
    // El logo lleva al panel con sesión (no a la landing pública).
    var destino = destinoPanel();
    if (destino) {
      document.querySelectorAll('.logo-link[href="inicio.html"]').forEach(function (el) {
        el.setAttribute('href', destino);
      });
    }
  });

  function destinoPanel() {
    try {
      if (sessionStorage.getItem('es_invitado') === 'true') return 'panel_invitado.html';
      var s = JSON.parse(sessionStorage.getItem('usuario') || 'null');
      var rol = String((s && (s.rol || s.tipo_usuario)) || '').toLowerCase();
      if (rol.includes('paciente')) return 'panel_paciente.html';
      if (rol.includes('psicologo')) return 'panel_psicologo.html';
    } catch (e) {
      return null;
    }
    return null;
  }
})();
