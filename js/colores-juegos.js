"use strict";

/* =========================================================
   SIGNBRIDGE - COLORES: DATOS DE LOS JUEGOS
   Misma interfaz que presentaciones-juegos.js (JUEGOS),
   así juego-quiz.js y juego-memoria.js funcionan igual.
   Necesita abc-comun.js cargado antes.

   Solo entran los colores que ya tienen video.
   (Naranja se suma cuando exista videos/colores/naranja.mp4)
========================================================= */

const JUEGOS = (() => {

    const V = "../videos/colores/";

    const SENAS = [
        { id: "rojo",     texto: "Rojo",     emoji: "🔴", hex: "#e53935", video: V + "rojo.mp4" },
        { id: "azul",     texto: "Azul",     emoji: "🔵", hex: "#1e63d6", video: V + "azul.mp4" },
        { id: "amarillo", texto: "Amarillo", emoji: "🟡", hex: "#ffd731", video: V + "amarillo.mp4" },
        { id: "verde",    texto: "Verde",    emoji: "🟢", hex: "#2e9d4f", video: V + "verde.mp4" },
        { id: "negro",    texto: "Negro",    emoji: "⚫", hex: "#000000", video: V + "negro.mp4" },
        { id: "blanco",   texto: "Blanco",   emoji: "⚪", hex: "#ffffff", video: V + "blanco.mp4" },
        { id: "morado",   texto: "Morado",   emoji: "🟣", hex: "#7b3fc4", video: V + "morado.mp4" },
        { id: "rosado",   texto: "Rosado",   emoji: "🩷", hex: "#ff8fc4", video: V + "rosado.mp4" },
        { id: "cafe",     texto: "Café",     emoji: "🟤", hex: "#7a4a24", video: V + "cafe.mp4" }
    ];

    const porId = Object.fromEntries(SENAS.map(s => [s.id, s]));


    function crearMedia(sena, { controles = false } = {}) {

        const video = document.createElement("video");

        video.src = sena.video;
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.preload = "auto";
        video.controls = controles;
        video.setAttribute("controlsList", "nodownload");

        return video;
    }


    /* Todos son videos: no hay imágenes que precargar. */

    function precargarImagenes() {}


    function opcionesPara(correcta, cantidad = 4) {

        const otras = ABC.mezclar(SENAS.filter(s => s.id !== correcta.id))
            .slice(0, cantidad - 1);

        return ABC.mezclar([correcta, ...otras]);
    }


    function estrellas(aciertos, total) {

        const n = aciertos >= total ? 3 : aciertos >= total * 0.6 ? 2 : aciertos > 0 ? 1 : 0;

        return "⭐".repeat(n) + "☆".repeat(3 - n);
    }


    return {
        SENAS,
        porId,
        crearMedia,
        precargarImagenes,
        opcionesPara,
        estrellas
    };

})();
