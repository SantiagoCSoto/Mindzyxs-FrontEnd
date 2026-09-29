/**
 * Banner de cookies (script clásico, sin módulos): se auto-renderiza en cualquier
 * vista que lo incluya con <script src="../js/cookies-banner.js"></script>.
 * No bloquea el sitio. Re-abrible con window.reabrirCookies() (enlace del footer).
 */
(function () {
  var KEY = 'mz_consent';

  function leer() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      return (typeof c.funcionales === 'boolean') ? c : null;
    } catch (e) { return null; }
  }

  function guardar(funcionales) {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        necesarias: true, funcionales: !!funcionales, fecha: new Date().toISOString()
      }));
    } catch (e) { /* sin almacenamiento: no otorgado */ }
  }

  function estilos() {
    var css = '.mzck{position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;' +
      'background:#fff;border:1px solid #DFDAEE;border-radius:14px;' +
      'box-shadow:0 8px 24px rgba(30,41,59,.18);padding:14px 16px;' +
      'font-family:inherit;font-size:13px;color:#1E293B;max-width:640px;margin:0 auto;}' +
      '.mzck p{margin:0 0 10px;line-height:1.5;}' +
      '.mzck a{color:#0E7490;font-weight:700;}' +
      '.mzck-btns{display:flex;gap:8px;flex-wrap:wrap;}' +
      '.mzck button{border-radius:18px;padding:9px 18px;min-height:44px;font-weight:700;' +
      'font-size:12.5px;cursor:pointer;font-family:inherit;}' +
      '.mzck-ok{background:#0E7490;color:#fff;border:none;}' +
      '.mzck-no{background:#fff;color:#1E293B;border:1.5px solid #DFDAEE;}' +
      '.mzck-cfg{background:#EDE7FF;color:#4A38B0;border:none;}' +
      '.mzck label{display:flex;gap:8px;align-items:flex-start;margin:8px 0;font-size:12.5px;}' +
      '@media (max-width:480px){.mzck-btns button{flex:1 1 100%;}}';
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
  }

  function mostrar(configurar) {
    cerrar();
    estilos();
    var box = document.createElement('div');
    box.className = 'mzck';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Consentimiento de cookies');
    var html = '<p>Usamos almacenamiento <b>necesario</b> (sesión) y <b>funcional</b> ' +
      '(progreso de invitado y borradores). Sin analytics ni publicidad. ' +
      '<a href="cookies.html">Política de Cookies</a></p>';
    if (configurar) {
      html += '<label><input type="checkbox" id="mzck-nec" checked disabled /> ' +
        '<span><b>Necesarias</b> (siempre activas): sesión y autenticación.</span></label>' +
        '<label><input type="checkbox" id="mzck-fun" /> ' +
        '<span><b>Funcionales</b>: recordar cuestionarios de invitado y borradores.</span></label>';
    }
    html += '<div class="mzck-btns">' +
      '<button type="button" class="mzck-ok" id="mzck-aceptar">Aceptar</button>' +
      '<button type="button" class="mzck-no" id="mzck-rechazar">Rechazar</button>';
    if (!configurar) {
      html += '<button type="button" class="mzck-cfg" id="mzck-conf">Configurar</button>';
    } else {
      html += '<button type="button" class="mzck-ok" id="mzck-guardar">Guardar</button>';
    }
    html += '</div>';
    box.innerHTML = html;
    document.body.appendChild(box);

    document.getElementById('mzck-aceptar').addEventListener('click', function () {
      guardar(true); cerrar();
    });
    document.getElementById('mzck-rechazar').addEventListener('click', function () {
      guardar(false); cerrar();
    });
    var conf = document.getElementById('mzck-conf');
    if (conf) conf.addEventListener('click', function () { mostrar(true); });
    var save = document.getElementById('mzck-guardar');
    if (save) save.addEventListener('click', function () {
      guardar(document.getElementById('mzck-fun').checked); cerrar();
    });
  }

  function cerrar() {
    var b = document.querySelector('.mzck');
    if (b) b.remove();
  }

  window.reabrirCookies = function () { mostrar(true); };

  document.addEventListener('DOMContentLoaded', function () {
    if (!leer()) mostrar(false);
  });
})();
