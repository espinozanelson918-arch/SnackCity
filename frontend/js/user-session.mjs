// user-session.mjs (ES module)
// Obtiene al usuario autenticado desde Firebase Auth y lee su perfil en Firestore
// Uso: incluir en las páginas con <script type="module" src="/js/user-session.mjs" defer></script>

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Pega aquí la misma configuración que tienes en script.js
const firebaseConfig = {
  apiKey: "AIzaSyAUcDxszHV4bVvnYBQT7OmOb3I0cnUwdpA",
  authDomain: "snackcity-2f551.firebaseapp.com",
  projectId: "snackcity-2f551",
  storageBucket: "snackcity-2f551.firebasestorage.app",
  messagingSenderId: "625609791401",
  appId: "1:625609791401:web:bd2d77452aee0f09ca56b8",
  measurementId: "G-G31FZ0EPKB",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function populateCommon(userProfile) {
  if (!userProfile) return;
  const nameEls = document.querySelectorAll('#userName, .user-name');
  const roleEls = document.querySelectorAll('#userRole, .user-role');
  const deptEls = document.querySelectorAll('#userDept, .user-department');

  const displayName = userProfile.nombre || userProfile.name || userProfile.email || userProfile.correo || userProfile.id;
  const role = userProfile.rol || '';
  const dept = userProfile.departamento || userProfile.sucursal || '';

  nameEls.forEach(el => { el.textContent = displayName; });
  roleEls.forEach(el => { el.textContent = role; });
  deptEls.forEach(el => { el.textContent = dept; });
}

// Also populate profile-specific spans if present (pfName, pfEmail, pfRole, pfDept)
function populateProfileSpans(userProfile) {
  if (!userProfile) return;
  try {
    const pfName = document.getElementById('pfName');
    const pfEmail = document.getElementById('pfEmail');
    const pfRole = document.getElementById('pfRole');
    const pfDept = document.getElementById('pfDept');

    if (pfName) pfName.textContent = userProfile.nombre || userProfile.correo || userProfile.email || '-';
    if (pfEmail) pfEmail.textContent = userProfile.correo || userProfile.email || '-';
    if (pfRole) pfRole.textContent = userProfile.rol || '-';
    if (pfDept) pfDept.textContent = userProfile.departamento || userProfile.sucursal || userProfile.rol || '-';
  } catch (err) {
    // non-fatal
    console.debug('populateProfileSpans error', err);
  }
}

export async function requireAuth(redirect = '/') {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = redirect;
        resolve(null);
        return;
      }
      // obtener perfil desde Firestore
      try {
        const docRef = doc(db, 'usuarios', user.uid);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          // si no existe el perfil, redirigimos al login
          window.location.href = redirect;
          resolve(null);
          return;
        }
  const profile = { id: snap.id, ...(snap.data() || {}) };
  populateCommon(profile);
  populateProfileSpans(profile);
  console.debug('requireAuth: profile loaded', profile);
  resolve(profile);
      } catch (err) {
        console.error('Error fetching user profile', err);
        window.location.href = redirect;
        resolve(null);
      }
    });
  });
}

// Auto-populate on load if authenticated
onAuthStateChanged(auth, async (user) => {
  if (!user) return;
  try {
    const snap = await getDoc(doc(db, 'usuarios', user.uid));
    if (!snap.exists()) return;
  const profile = { id: snap.id, ...(snap.data() || {}) };
  populateCommon(profile);
  populateProfileSpans(profile);
  console.debug('auto-populate: profile loaded', profile);
  } catch (err) {
    console.error('Error auto-populating profile', err);
  }
});
