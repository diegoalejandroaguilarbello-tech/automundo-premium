const API_URL = window.AUTOMUNDO_API_BASE_URL || "http://localhost:3000/api";

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

function showMessage(text, type = "error") {
  if (!loginMessage) return;
  loginMessage.textContent = text;
  loginMessage.className = `message ${type}`;
}

function goToPanel() {
  window.location.href = "panel-admin.html";
}

async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

async function checkExistingSession() {
  const token = localStorage.getItem("adminToken");
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      goToPanel();
      return;
    }
  } catch (error) {
    console.warn("No se pudo validar la sesión:", error.message);
  }

  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
      showMessage("Ingresa correo y contraseña.", "error");
      return;
    }

    showMessage("Validando acceso...", "success");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        if (response.status >= 500) {
          const reference = data.requestId ? ` Referencia: ${data.requestId}.` : "";
          showMessage(`El servidor no pudo iniciar la sesión.${reference}`, "error");
        } else {
          showMessage(data.message || "Credenciales incorrectas.", "error");
        }
        return;
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.user));
      goToPanel();
    } catch (error) {
      console.error(error);
      showMessage("No se pudo conectar con el servidor. Intenta nuevamente.", "error");
    }
  });
}

checkExistingSession();
