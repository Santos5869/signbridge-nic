/* ==========================================
   SIGNBRIDGE
   FLUIDEZ DE NAVEGACIÓN
========================================== */

(() => {

    "use strict";


    /*
       PRECARGA
       Cuando el usuario pasa el mouse (o toca)
       un enlace, descargamos esa página antes del
       clic. Así la siguiente pantalla abre casi
       al instante.
    */

    const precargadas = new Set();

    function precargar(enlace) {

        if (!enlace || !enlace.href) {
            return;
        }

        let url;

        try {
            url = new URL(enlace.href, location.href);
        } catch (error) {
            return;
        }

        if (
            url.origin !== location.origin ||
            !url.pathname.endsWith(".html") ||
            url.pathname === location.pathname ||
            precargadas.has(url.pathname)
        ) {
            return;
        }

        precargadas.add(url.pathname);

        const link = document.createElement("link");

        link.rel = "prefetch";
        link.href = url.pathname;

        document.head.appendChild(link);
    }


    function alApuntar(evento) {

        const enlace =
            evento.target.closest &&
            evento.target.closest("a[href]");

        precargar(enlace);
    }


    document.addEventListener("pointerover", alApuntar, { passive: true });
    document.addEventListener("touchstart", alApuntar, { passive: true });
    document.addEventListener("focusin", alApuntar);


    /*
       VOLVER ATRÁS
       Si el navegador restaura la página desde
       su caché (botón atrás), quitamos la clase
       de salida para que no quede invisible.
    */

    window.addEventListener("pageshow", (evento) => {

        if (!evento.persisted) {
            return;
        }

        document.body.classList.remove(
            "page-exit",
            "page-exiting"
        );

        document.body.classList.add("page-ready");

        document.body.style.opacity = "1";
        document.body.style.transform = "translateY(0)";
    });

})();
