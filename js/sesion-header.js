/**
 * Header por sesión y control de navegación:
 * - Oculta el enlace Inicio (.nav-inicio) cuando hay sesión iniciada (registrada o invitado).
 * - Redirige el logo al panel correspondiente según el rol.
 * - Inyecta el botón de cerrar sesión dinámico en el header.
 * - Bloquea la navegación hacia atrás (flecha retroceder del navegador) en la landing/panel de cualquier rol
 *   para evitar que regrese a la pantalla de inicio de sesión o a paneles de otros roles.
 * - Valida la coherencia del rol evitando acceder al panel de un rol diferente al activo.
 */
(function () {
  function conSesion() {
    try {
      if (sessionStorage.getItem('es_invitado') === 'true') return true;
      var tieneUsuario = !!sessionStorage.getItem('usuario') || !!localStorage.getItem('usuario');
      var auth = sessionStorage.getItem('autenticado') === 'true' || localStorage.getItem('autenticado') === 'true' || !!localStorage.getItem('token');
      return tieneUsuario && auth;
    } catch (e) {
      return false;
    }
  }

  function destinoPanel() {
    try {
      if (sessionStorage.getItem('es_invitado') === 'true') return 'panel_invitado.html';
      var s = JSON.parse(sessionStorage.getItem('usuario') || localStorage.getItem('usuario') || 'null');
      var rol = String((s && (s.rol || s.tipo_usuario)) || localStorage.getItem('rol') || '').toLowerCase();
      if (rol.includes('paciente')) return 'panel_paciente.html';
      if (rol.includes('psicologo')) return 'panel_psicologo.html';
      if (rol.includes('admin')) return 'panel_admin.html';
    } catch (e) {
      return null;
    }
    return null;
  }

  // Prevenir que en la landing page / panel de cualquier rol el usuario pueda usar la flecha de retroceso
  function bloquearRetrocesoEnPanel() {
    try {
      var p = (window.location.pathname || '').toLowerCase();
      var esLanding = p.includes('panel_paciente.html') ||
                      p.includes('panel_psicologo.html') ||
                      p.includes('panel_admin.html') ||
                      p.includes('panel_invitado.html');

      if (esLanding && window.history && typeof window.history.pushState === 'function') {
        window.history.pushState(null, '', window.location.href);

        window.addEventListener('popstate', function () {
          window.history.pushState(null, '', window.location.href);
        });

        window.addEventListener('pageshow', function (evt) {
          if (evt && evt.persisted) {
            window.history.pushState(null, '', window.location.href);
          }
        });
      }
    } catch (e) {
      /* ignore */
    }
  }

  function redirigir(destino) {
    try {
      if (typeof window.location.replace === 'function') {
        window.location.replace(destino);
      } else {
        window.location.href = destino;
      }
    } catch (_) {
      window.location.href = destino;
    }
  }

  // Si tiene sesión activa y aterriza en login o en el panel de otro rol, redirigir a su propio panel
  function validarCoherenciaRol() {
    try {
      if (!conSesion()) return;
      var p = (window.location.pathname || '').toLowerCase();
      var destino = destinoPanel();
      if (!destino) return;

      if (p.includes('login.html')) {
        redirigir(destino);
        return;
      }

      var esPanel = p.includes('panel_paciente.html') ||
                    p.includes('panel_psicologo.html') ||
                    p.includes('panel_admin.html') ||
                    p.includes('panel_invitado.html');

      if (esPanel && !p.includes(destino)) {
        redirigir(destino);
      }
    } catch (e) {
      /* ignore */
    }
  }

  bloquearRetrocesoEnPanel();
  validarCoherenciaRol();

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
    // Botón de cerrar sesión dinámico en el header.
    document.querySelectorAll('.header-auth-buttons').forEach(function (box) {
      if (box.querySelector('.btn-logout')) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-logout';
      btn.textContent = 'Cerrar sesión';
      btn.addEventListener('click', function () {
        try {
          sessionStorage.clear();
          localStorage.removeItem('token');
          localStorage.removeItem('rol');
          localStorage.removeItem('usuario');
          localStorage.removeItem('autenticado');
        } catch (e) { /* ignore */ }
        window.location.href = 'login.html';
      });
      box.appendChild(btn);
    });
  });
})();
