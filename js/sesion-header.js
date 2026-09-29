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
  });
})();
