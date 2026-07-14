// =========================================
// ANIMACIÓN SCROLL PREMIUM (OPTIMIZADA)
// =========================================

// Seleccionamos todas las cards
const cards = document.querySelectorAll(".card");

// Observer (mucho más eficiente que scroll)
const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add("show");

            // Opcional: dejar de observar una vez animado
            observer.unobserve(entry.target);

        }

    });

}, {

    threshold: 0.15  // Se activa cuando el 15% de la card es visible

});

// Aplicamos observer a cada card
cards.forEach(card => {

    observer.observe(card);

});

