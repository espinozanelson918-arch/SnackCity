// user-session.js
// Helper para páginas de frontend: lee el perfil cargado en localStorage por el login
// y rellena elementos comunes (userName, userRole, userDept). Si no hay sesión, redirige al login.

(function () {
  const KEY = 'snackcity_user';

  function getUser() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Error parseando snackcity_user', e);
      return null;
    }
  }

  function requireAuth(redirect = '/') {
    const user = getUser();
    if (!user) {
      // no autenticado -> redirigir
      window.location.href = redirect;
      return null;
    }
    return user;
  }

  function populateCommon(user) {
    if (!user) return;
    const nameEls = document.querySelectorAll('#userName, .user-name');
    const roleEls = document.querySelectorAll('#userRole, .user-role');
    const deptEls = document.querySelectorAll('#userDept, .user-department');

    const displayName = user.nombre || user.name || user.email || user.correo || user.id;
    const role = user.rol || '';
    const dept = user.departamento || user.sucursal || '';

    nameEls.forEach(el => { el.textContent = displayName; });
    roleEls.forEach(el => { el.textContent = role; });
    deptEls.forEach(el => { el.textContent = dept; });
  }

  // Expose on window for manual use
  window.SnackCitySession = {
    getUser,
    requireAuth,
    populateCommon,
    STORAGE_KEY: KEY,
  };

  // Auto-run: if this script is included on a page, try to populate common fields.
  document.addEventListener('DOMContentLoaded', () => {
    const user = getUser();
    if (!user) return; // no auth, don't redirect automatically here (pages can call requireAuth)
    populateCommon(user);
  });
})();
