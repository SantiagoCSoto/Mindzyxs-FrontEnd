/**
 * Mindzyxs - Accesibilidad Web Universal (WCAG 2.1 Nivel AA)
 * Criterio 2.1.1: Teclado (Nivel A)
 * Criterio 2.1.2: Sin trampas de foco (Nivel A)
 *
 * Características:
 * 1. Trampa de foco (Focus Trap) universal en todos los modales y diálogos.
 * 2. Cierre accesible con tecla Escape y restauración de foco al elemento activador.
 * 3. Activación con teclado (Enter y Espacio) para elementos con role="button".
 * 4. Detección reactiva mediante MutationObserver para soportar cualquier controlador.
 */

(function () {
  'use strict';

  var FOCUSABLE_SELECTOR = [
    'a[href]:not([tabindex="-1"])',
    'button:not([disabled]):not([tabindex="-1"])',
    'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ');

  var activeModal = null;
  var lastFocusedElement = null;

  /**
   * Determina si un modal está actualmente abierto/visible.
   */
  function isModalOpen(modal) {
    if (!modal) return false;
    var style = window.getComputedStyle(modal);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (modal.classList.contains('activo') || modal.classList.contains('open') || modal.classList.contains('show')) {
      return true;
    }
    if (modal.getAttribute('aria-hidden') === 'false') return true;
    if (modal.style.display && modal.style.display !== 'none') return true;
    return false;
  }

  /**
   * Obtiene todos los elementos enfocables dentro de un contenedor.
   */
  function getFocusableElements(container) {
    if (!container) return [];
    var elements = Array.prototype.slice.call(container.querySelectorAll(FOCUSABLE_SELECTOR));
    return elements.filter(function (el) {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
    });
  }

  /**
   * Enfoca el primer elemento adecuado dentro de un modal.
   */
  function focusInitialElement(modal) {
    var focusables = getFocusableElements(modal);
    if (focusables.length > 0) {
      var primaryInput = modal.querySelector('input:not([type="hidden"]), textarea, select');
      if (primaryInput && focusables.indexOf(primaryInput) !== -1) {
        primaryInput.focus();
      } else {
        focusables[0].focus();
      }
    } else {
      if (!modal.hasAttribute('tabindex')) {
        modal.setAttribute('tabindex', '-1');
      }
      modal.focus();
    }
  }

  /**
   * Activa el modo modal accesible.
   */
  function onModalOpened(modal) {
    if (activeModal === modal) return;

    var currentActive = document.activeElement;
    if (currentActive && !modal.contains(currentActive)) {
      lastFocusedElement = currentActive;
      modal._triggerElement = currentActive;
    }

    activeModal = modal;
    modal.setAttribute('aria-hidden', 'false');

    setTimeout(function () {
      if (isModalOpen(modal)) {
        focusInitialElement(modal);
      }
    }, 40);
  }

  /**
   * Cierra o desactiva el modal accesible y restaura el foco.
   */
  function onModalClosed(modal) {
    if (activeModal === modal) {
      activeModal = null;
    }
    modal.setAttribute('aria-hidden', 'true');

    var returnTarget = modal._triggerElement || lastFocusedElement;
    if (returnTarget && typeof returnTarget.focus === 'function' && document.body.contains(returnTarget)) {
      setTimeout(function () {
        try {
          returnTarget.focus();
        } catch (e) { /* ignore */ }
      }, 30);
    }
    modal._triggerElement = null;
  }

  /**
   * Intenta cerrar un modal buscando su botón de cancelar o cerrar.
   */
  function requestModalClose(modal) {
    if (!modal) return;
    var closeBtn = modal.querySelector(
      '.btn-close, .close, .modal-x, [id*="Cancel"], [id*="cancel"], ' +
      '[id*="Cerrar"], [id*="cerrar"], [id*="exitNo"], [id*="btnNo"], ' +
      '[aria-label="Cerrar"], [id*="Ok"], [id*="ok"]'
    );

    if (closeBtn && typeof closeBtn.click === 'function') {
      closeBtn.click();
    } else {
      modal.classList.remove('activo', 'open', 'show');
      modal.style.display = 'none';
      onModalClosed(modal);
    }
  }

  /**
   * Manejador global de eventos de teclado (Escape, Tab, Enter/Space en role=button).
   */
  document.addEventListener('keydown', function (e) {
    var key = e.key;

    // 1. Manejo de tecla Escape para cerrar modales abiertos
    if (key === 'Escape' || key === 'Esc') {
      var openModals = document.querySelectorAll('.modal-overlay, [role="dialog"], [role="alertdialog"]');
      for (var i = 0; i < openModals.length; i++) {
        if (isModalOpen(openModals[i])) {
          e.preventDefault();
          e.stopPropagation();
          requestModalClose(openModals[i]);
          return;
        }
      }
    }

    // 2. Trampa de foco (Focus Trap) al presionar Tab en un modal abierto
    if (key === 'Tab') {
      var currentModal = activeModal;
      if (!currentModal || !isModalOpen(currentModal)) {
        var openModalsList = document.querySelectorAll('.modal-overlay, [role="dialog"], [role="alertdialog"]');
        for (var j = 0; j < openModalsList.length; j++) {
          if (isModalOpen(openModalsList[j])) {
            currentModal = openModalsList[j];
            activeModal = currentModal;
            break;
          }
        }
      }

      if (currentModal && isModalOpen(currentModal)) {
        var focusable = getFocusableElements(currentModal);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        var active = document.activeElement;

        if (e.shiftKey) {
          if (active === first || !currentModal.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !currentModal.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    // 3. Activación con Teclado (Enter y Espacio) para elementos con role="button"
    var target = e.target;
    if (target && target.getAttribute && target.getAttribute('role') === 'button') {
      var tagName = target.tagName ? target.tagName.toUpperCase() : '';
      if (tagName !== 'BUTTON') {
        if (key === ' ' || key === 'Spacebar') {
          e.preventDefault();
          target.click();
        } else if (key === 'Enter') {
          if (tagName !== 'A' || !target.hasAttribute('href')) {
            e.preventDefault();
            target.click();
          }
        }
      }
    }
  }, true);

  /**
   * Asegurar que cualquier elemento con role="button" sea enfocable con Tab
   */
  function ensureRoleButtonFocusable() {
    var roleButtons = document.querySelectorAll('[role="button"]:not(button):not(input)');
    roleButtons.forEach(function (btn) {
      if (!btn.hasAttribute('tabindex')) {
        btn.setAttribute('tabindex', '0');
      }
    });
  }

  /**
   * Observer para detectar dinámicamente cuando un modal se abre o cierra
   */
  function initModalObserver() {
    ensureRoleButtonFocusable();

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        var target = mutation.target;
        if (!target || !target.classList) return;

        var isOverlay = target.classList.contains('modal-overlay') ||
          target.getAttribute('role') === 'dialog' ||
          target.getAttribute('role') === 'alertdialog';

        if (isOverlay) {
          if (isModalOpen(target)) {
            onModalOpened(target);
          } else if (activeModal === target) {
            onModalClosed(target);
          }
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class', 'style', 'aria-hidden']
    });

    // Cerrar al hacer clic en el backdrop exterior del modal
    document.addEventListener('click', function (e) {
      if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
        if (isModalOpen(e.target)) {
          requestModalClose(e.target);
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModalObserver);
  } else {
    initModalObserver();
  }

  window.MindzyxsA11y = {
    isModalOpen: isModalOpen,
    onModalOpened: onModalOpened,
    onModalClosed: onModalClosed,
    requestModalClose: requestModalClose,
    getFocusableElements: getFocusableElements
  };
})();
