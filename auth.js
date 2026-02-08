/* =====================================================
   AUTH LAYER
===================================================== */
import { login, logout, onUserChanged } from "./firebase-db.js";

/* =====================================================
   INIT AUTH
===================================================== */
export function initAuth(onLogin) {
  const loginBox = document.getElementById("login-box");
  const appBox = document.getElementById("app");
  const btnLogin = document.getElementById("btn-login");
  const inputEmail = document.getElementById("login-email");
  const inputPassword = document.getElementById("login-password");
  const btnLogout = document.getElementById("btn-logout");

  /* =====================
     LOGIN
  ===================== */
  if (btnLogin && inputEmail && inputPassword) {
    btnLogin.addEventListener("click", async () => {
      const email = inputEmail.value.trim();
      const password = inputPassword.value.trim();

      if (!email || !password) {
        alert("Inserisci email e password");
        return;
      }

      try {
        await login(email, password);
      } catch (err) {
        alert("Email o password errate");
      }
    });
  }

  /* =====================
     LOGOUT
  ===================== */
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      await logout();
      // UI aggiornata da onUserChanged
    });
  }

  /* =====================
     SESSIONE
  ===================== */
  onUserChanged(user => {
    if (user) {
      if (loginBox) loginBox.classList.add("hidden");
      if (appBox) appBox.classList.remove("hidden");

      if (typeof onLogin === "function") {
        onLogin();
      }
    } else {
      if (loginBox) loginBox.classList.remove("hidden");
      if (appBox) appBox.classList.add("hidden");
    }
  });
}
