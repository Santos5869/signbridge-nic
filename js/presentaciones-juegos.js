"use strict";

/* =========================================================
   SIGNBRIDGE - PRESENTACIONES: DATOS DE LOS JUEGOS
   Señas con material real (imagen o video), compartidas
   por el quiz, "Responde la pregunta" y la memoria.
   Necesita abc-comun.js cargado antes.
========================================================= */

const JUEGOS = (() => {

    const P = "../images/presentaciones/";
    const VP = "../videos/presentaciones/";
    const VS = "../videos/saludos/";

    /*
       "Me llamo…" se hace igual que "Mi nombre": no la
       usamos como seña aparte para que no haya dos opciones
       con la misma seña.
    */

    const SENAS = [
        { id: "mi-nombre",      texto: "Mi nombre",        emoji: "👤", imagen: P + "mi-nombre.png" },
        { id: "como-te-llamas", texto: "¿Cómo te llamas?", emoji: "❓", video: VP + "como-te-llamas.mp4" },
        { id: "mucho-gusto",    texto: "Mucho gusto",      emoji: "🤝", video: VP + "mucho-gusto.mp4" },
        { id: "yo",             texto: "Yo",               emoji: "🙋", imagen: P + "yo.png" },
        { id: "tu",             texto: "Tú",               emoji: "👉", imagen: P + "tu.png" },
        { id: "de-donde-eres",  texto: "¿De dónde eres?",  emoji: "🌎", video: VP + "de-donde-eres.mp4" },
        { id: "soy-de",         texto: "Soy de…",          emoji: "📍", video: VP + "soy-de.mp4" },
        { id: "como-estas",     texto: "¿Cómo estás?",     emoji: "💬", video: VP + "como-estas.mp4" },
        { id: "estoy-bien",     texto: "Estoy bien",       emoji: "😊", video: VP + "estoy-bien.mp4" },
        { id: "hola",           texto: "Hola",             emoji: "👋", video: VS + "hola.mp4" },
        { id: "buenos-dias",    texto: "Buenos días",      emoji: "🌅", video: VS + "buenos_dias.mp4" },
        { id: "buenas-tardes",  texto: "Buenas tardes",    emoji: "🌇", video: VS + "buenas_tardes.mp4" },
        { id: "buenas-noches",  texto: "Buenas noches",    emoji: "🌙", video: VS + "buenas_noches.mp4" },
        { id: "gracias",        texto: "Gracias",          emoji: "🙏", video: VS + "gracias.mp4" },
        { id: "de-nada",        texto: "De nada",          emoji: "😌", video: VS + "de_nada.mp4" },
        { id: "adios",          texto: "Adiós",            emoji: "✋", video: VS + "adios.mp4" }
    ];

    const porId = Object.fromEntries(SENAS.map(s => [s.id, s]));


    /*
       Diálogos para "Responde la pregunta": lo que te dicen
       y la seña con la que se responde.
    */

    const DIALOGOS = [
        {
            pregunta: "como-te-llamas",
            respuesta: { ...porId["mi-nombre"], texto: "Me llamo…" },
            explicacion: "Para decir tu nombre se usa la seña de «Mi nombre / Me llamo»."
        },
        {
            pregunta: "de-donde-eres",
            respuesta: porId["soy-de"],
            explicacion: "Respondes con «Soy de…» y luego tu lugar de origen."
        },
        {
            pregunta: "como-estas",
            respuesta: porId["estoy-bien"],
            explicacion: "Una respuesta común es «Estoy bien»."
        },
        {
            pregunta: "gracias",
            respuesta: porId["de-nada"],
            explicacion: "Cuando te dan las gracias, respondes «De nada»."
        },
        {
            pregunta: "buenos-dias",
            respuesta: porId["buenos-dias"],
            explicacion: "A un saludo se responde con el mismo saludo: «Buenos días»."
        },
        {
            pregunta: "buenas-noches",
            respuesta: porId["buenas-noches"],
            explicacion: "A un saludo se responde con el mismo saludo: «Buenas noches»."
        }
    ];


    /*
       Crea la imagen o el video de una seña. Los videos van
       sin sonido y en bucle para poder verlos varias veces.
    */

    function crearMedia(sena, { controles = false } = {}) {

        if (sena.video) {

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

        const img = document.createElement("img");

        img.src = sena.imagen;
        img.alt = "Seña para identificar";

        return img;
    }


    /* Las imágenes se bajan antes; los videos se piden al mostrarse. */

    function precargarImagenes() {
        SENAS.filter(s => s.imagen).forEach(s => { new Image().src = s.imagen; });
    }


    function opcionesPara(correcta, cantidad = 4) {

        const otras = ABC.mezclar(SENAS.filter(s => s.id !== correcta.id))
            .slice(0, cantidad - 1);

        return ABC.mezclar([correcta, ...otras]);
    }


    /* Estrellas según aciertos al primer intento. */

    function estrellas(aciertos, total) {

        const n = aciertos >= total ? 3 : aciertos >= total * 0.6 ? 2 : aciertos > 0 ? 1 : 0;

        return "⭐".repeat(n) + "☆".repeat(3 - n);
    }


    return {
        SENAS,
        DIALOGOS,
        porId,
        crearMedia,
        precargarImagenes,
        opcionesPara,
        estrellas
    };

})();
