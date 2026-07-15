// ======================================
// MODO CLARO Y OSCURO
// ======================================

const THEME_STORAGE_KEY = "automundo_theme";

function readSavedTheme() {
    try {
        return localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
        return null;
    }
}

function saveTheme(theme) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
        // La página seguirá funcionando aunque localStorage esté bloqueado.
    }
}

let currentTheme = readSavedTheme() === "light" ? "light" : "dark";
let themeToggleButton = null;

function applyTheme(theme, persist = false) {
    currentTheme = theme;

    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;

    if (persist) {
        saveTheme(theme);
    }

    if (themeToggleButton) {
        const nextThemeName = theme === "dark" ? "claro" : "oscuro";

        themeToggleButton.setAttribute(
            "aria-label",
            `Activar modo ${nextThemeName}`
        );

        themeToggleButton.setAttribute(
            "title",
            `Activar modo ${nextThemeName}`
        );
    }
}

applyTheme(currentTheme);

const themeNavbar = document.querySelector(".navbar");
const mobileMenuButton = document.querySelector(".menu-toggle");

if (themeNavbar && mobileMenuButton) {
    themeToggleButton = document.createElement("button");
    themeToggleButton.type = "button";
    themeToggleButton.className = "theme-toggle";

    themeToggleButton.innerHTML = `
        <span class="theme-toggle-icon" aria-hidden="true"></span>
    `;

    themeNavbar.insertBefore(themeToggleButton, mobileMenuButton);

    themeToggleButton.addEventListener("click", () => {
        const nextTheme = currentTheme === "dark" ? "light" : "dark";
        applyTheme(nextTheme, true);
    });

    applyTheme(currentTheme);
}

const counters =
document.querySelectorAll(".counter");

counters.forEach(counter=>{

    const update=()=>{

        const target=
        +counter.dataset.target;

        const current=
        +counter.innerText;

        const increment=
        target/80;

        if(current<target){

            counter.innerText=
            Math.ceil(current+increment);

            setTimeout(update,25);

        }else{

            counter.innerText=target;

        }

    };

    update();

});

// ======================================
// ANIMACIÓN CON INTERSECTIONOBSERVER
// ======================================
const reveals = document.querySelectorAll(".reveal");
if (reveals.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: "0px 0px -100px 0px",
        threshold: 0.1
    });

    reveals.forEach(el => revealObserver.observe(el));
}

// ======================================
// NAVBAR SCROLL CLASSE TOGGLE
// ======================================
window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    if (navbar) {
        navbar.classList.toggle("scroll", window.scrollY > 50);
    }
}, { passive: true });

// ======================================
// NAV-BAR RESPONSIVA UNIFICADA
// ======================================
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        const active = navLinks.classList.toggle("active");
        menuToggle.classList.toggle("active", active);
        menuToggle.setAttribute("aria-expanded", active);
    });

    // Cerrar menú al pulsar un enlace en móvil/tablet
    document.querySelectorAll(".nav-links a").forEach(link => {
        link.addEventListener("click", () => {
            if (window.innerWidth <= 992) {
                navLinks.classList.remove("active");
                menuToggle.classList.remove("active");
                menuToggle.setAttribute("aria-expanded", "false");
            }
        });
    });
}

// Enlace activo automático
const paginaActual = window.location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".nav-links a").forEach(link => {
    const href = link.getAttribute("href");
    if (href === paginaActual) {
        link.classList.add("active");
    } else {
        link.classList.remove("active");
    }
});

// =========================
// CALCULADORA FINANCIERA
// =========================

const btnCalcular = document.querySelector("#btnCalcular");

if(btnCalcular){

    btnCalcular.addEventListener("click",()=>{

        const precio =
        Number(document.querySelector("#precioVehiculo").value);

        const inicial =
        Number(document.querySelector("#inicialVehiculo").value);

        const cuotas =
        Number(document.querySelector("#cuotas").value);

        const resultado =
        document.querySelector("#resultadoPago");

        if(precio <= 0){

            resultado.textContent =
            "Ingresa un precio válido";

            return;

        }

        const monto =
        precio - inicial;

        const mensual =
        monto / cuotas;

        resultado.textContent =

        "$" +

        mensual.toLocaleString(

            "es-ES",

            {

                minimumFractionDigits:2,

                maximumFractionDigits:2

            }

        );

    });

}

/*=========================================
=            VEHÍCULOS (ENCAPSULADO)
=========================================*/
{
const vehiculos = [
    {
        id: 1,
        nombre: "BMW X5",
        marca: "BMW",
        tipo: "SUV",
        precio: 65000,
        año: 2025,
        imagen: "img/bmw-x5.jpg"
    },
    {
        id: 2,
        nombre: "Audi Q8",
        marca: "Audi",
        tipo: "SUV Coupé",
        precio: 72000,
        año: 2025,
        imagen: "img/audi-q8.jpg"
    },
    {
        id: 3,
        nombre: "Mercedes GLE",
        marca: "Mercedes-Benz",
        tipo: "SUV",
        precio: 78000,
        año: 2025,
        imagen: "img/mercedes-gle.jpg"
    }
];

/*=========================================
=            ELEMENTOS
=========================================*/

const modal = document.getElementById("modalVehiculo");

const modalImagen = document.getElementById("modalImagen");
const modalNombre = document.getElementById("modalNombre");
const modalMarca = document.getElementById("modalMarca");
const modalTipo = document.getElementById("modalTipo");
const modalAnio = document.getElementById("modalAnio");
const modalPrecio = document.getElementById("modalPrecio");

const botones = document.querySelectorAll(".btn-modal");
const cerrar = document.querySelector(".cerrar-modal");

/*=========================================
=            ABRIR MODAL
=========================================*/

if (botones.length > 0 && modal) {
    botones.forEach(boton => {
        boton.addEventListener("click", () => {
            const id = Number(boton.dataset.id);
            const vehiculo = vehiculos.find(v => v.id === id);
            if (!vehiculo) return;

            modalImagen.src = vehiculo.imagen;
            modalImagen.alt = vehiculo.nombre;
            modalNombre.textContent = vehiculo.nombre;
            modalMarca.textContent = vehiculo.marca;
            modalTipo.textContent = vehiculo.tipo;
            modalAnio.textContent = vehiculo.año;
            modalPrecio.textContent = vehiculo.precio.toLocaleString("es-ES");
            modal.classList.add("activo");
        });
    });
}

/*=========================================
=            CERRAR MODAL
=========================================*/

if (cerrar && modal) {
    cerrar.addEventListener("click", () => {
        modal.classList.remove("activo");
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("activo");
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            modal.classList.remove("activo");
        }
    });
}
}

// =========================
// NEWSLETTER
// =========================

const newsletterForm = document.querySelector("#newsletterForm");

if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = newsletterForm.querySelector("input[name='email']")?.value;
        const API_BASE_URL = window.AUTOMUNDO_API_BASE_URL || "http://localhost:3000/api";

        if (!email) return;

        try {
            await fetch(`${API_BASE_URL}/newsletter`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            newsletterForm.reset();
            alert("Suscripción registrada correctamente.");
        } catch (error) {
            alert("No se pudo registrar la suscripción. Revisa que el backend esté activo.");
            console.error(error);
        }
    });
}
