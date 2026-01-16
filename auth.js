/* =====================================================
   AUTH LAYER
===================================================== */
import { login, onUserChanged } from "./firebase-db.js";

/* =====================================================
   INIT AUTH
===================================================== */
export function initAuth(onLogin) {
  const loginBox = document.getElementById("login-box");
  const appBox = document.getElementById("app");
  const btnLogin = document.getElementById("btn-login");
  const inputEmail = document.getElementById("login-email");
  const inputPassword = document.getElementById("login-password");

  // LOGIN
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

  // SESSIONE
  onUserChanged(user => {
    if (user) {
      loginBox.classList.add("hidden");
      appBox.classList.remove("hidden");
      onLogin(); // 👈 avvia l’app
    } else {
      loginBox.classList.remove("hidden");
      appBox.classList.add("hidden");
    }
  });
}
