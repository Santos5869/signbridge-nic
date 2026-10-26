"use strict";

/* =========================================================
   SIGNBRIDGE - ESCUELA
   Datos y utilidades compartidas por los 3 mini cursos.
   Necesita abc-comun.js cargado antes.

   VIDEOS DE LAS SEÑAS
   Cada palabra busca su video en:
       videos/escuela/<carpeta>/<id>.mp4
   Ejemplo: videos/escuela/materiales/tijeras.mp4
   Si el video no existe todavía, se muestra la palabra
   deletreada con el abecedario.
========================================================= */

const ESCUELA = (() => {

    const MATERIALES = [
        { id: "lapiz",     palabra: "Lápiz",     emoji: "✏️" },
        { id: "lapicero",  palabra: "Lapicero",  emoji: "🖊️" },
        { id: "cuaderno",  palabra: "Cuaderno",  emoji: "📓" },
        { id: "libro",     palabra: "Libro",     emoji: "📕" },
        { id: "tijeras",   palabra: "Tijeras",   emoji: "✂️" },
        { id: "borrador",  palabra: "Borrador",  emoji: "🧽" },
        { id: "regla",     palabra: "Regla",     emoji: "📏" },
        { id: "mochila",   palabra: "Mochila",   emoji: "🎒" },
        { id: "pegamento", palabra: "Pegamento", emoji: "🧴" },
        { id: "colores",   palabra: "Colores",   emoji: "🖍️" }
    ].map(item => ({ ...item, carpeta: "materiales" }));


    const ORDENES = [
        { id: "observar",        palabra: "Observar",          emoji: "👀", detalle: "Mira con atención." },
        { id: "repetir",         palabra: "Repetir",           emoji: "🔁", detalle: "Hazlo otra vez." },
        { id: "explicar",        palabra: "Explicar",          emoji: "🗣️", detalle: "Cuenta cómo lo entendiste." },
        { id: "abrir-libro",     palabra: "Abrir el libro",    emoji: "📖", detalle: "Abre tu libro." },
        { id: "cerrar-libro",    palabra: "Cerrar el libro",   emoji: "📕", detalle: "Cierra tu libro." },
        { id: "escribir",        palabra: "Escribir",          emoji: "✍️", detalle: "Escribe en tu cuaderno." },
        { id: "leer",            palabra: "Leer",              emoji: "📚", detalle: "Lee el texto." },
        { id: "prestar-atencion", palabra: "Prestar atención",  emoji: "🧏", detalle: "Atiende a quien habla." },
        { id: "levantar-mano",   palabra: "Levantar la mano",  emoji: "✋", detalle: "Pide la palabra." },
        { id: "silencio",        palabra: "Silencio",          emoji: "🤫", detalle: "Guarda silencio." },
        { id: "sentarse",        palabra: "Sentarse",          emoji: "🪑", detalle: "Toma asiento." },
        { id: "trabajar-grupo",  palabra: "Trabajar en grupo", emoji: "👥", detalle: "Reúnete con tus compañeros." }
    ].map(item => ({ ...item, carpeta: "ordenes" }));


    /*
       "zona" ubica cada palabra en el mapa de la escuela
       del curso de vocabulario.
    */

    const VOCABULARIO = [
        { id: "director",     palabra: "Director",     emoji: "👔",    tipo: "persona", zona: "direccion" },
        { id: "profesor",     palabra: "Profesor",     emoji: "🧑‍🏫", tipo: "persona", zona: "aula" },
        { id: "estudiante",   palabra: "Estudiante",   emoji: "🧑‍🎓", tipo: "persona", zona: "aula" },
        { id: "bibliotecario", palabra: "Bibliotecario", emoji: "🤓",  tipo: "persona", zona: "biblioteca" },
        { id: "direccion",    palabra: "Dirección",    emoji: "🗂️",   tipo: "lugar",   zona: "direccion" },
        { id: "aula",         palabra: "Aula",         emoji: "🏫",    tipo: "lugar",   zona: "aula" },
        { id: "biblioteca",   palabra: "Biblioteca",   emoji: "📚",    tipo: "lugar",   zona: "biblioteca" },
        { id: "laboratorio",  palabra: "Laboratorio",  emoji: "🔬",    tipo: "lugar",   zona: "laboratorio" },
        { id: "computacion",  palabra: "Computación",  emoji: "💻",    tipo: "lugar",   zona: "computacion" },
        { id: "comedor",      palabra: "Comedor",      emoji: "🍽️",   tipo: "lugar",   zona: "comedor" },
        { id: "enfermeria",   palabra: "Enfermería",   emoji: "🩺",    tipo: "lugar",   zona: "enfermeria" },
        { id: "bano",         palabra: "Baño",         emoji: "🚻",    tipo: "lugar",   zona: "bano" },
        { id: "patio",        palabra: "Patio",        emoji: "🌳",    tipo: "lugar",   zona: "patio" }
    ].map(item => ({ ...item, carpeta: "vocabulario" }));


    function rutaVideo(item) {
        return `../videos/escuela/${item.carpeta}/${item.id}.mp4`;
    }


    /* =====================================================
       MOSTRAR LA SEÑA
       Recordamos qué videos no existen para no volver a
       pedirlos en cada pregunta.
    ===================================================== */

    const CLAVE_FALTANTES = "signbridge_escuela_sin_video";

    let faltantes = new Set();

    try {
        faltantes = new Set(JSON.parse(sessionStorage.getItem(CLAVE_FALTANTES)) || []);
    } catch (error) {
        /* sin sessionStorage: seguimos sin caché */
    }

    function marcarFaltante(ruta) {

        faltantes.add(ruta);

        try {
            sessionStorage.setItem(CLAVE_FALTANTES, JSON.stringify([...faltantes]));
        } catch (error) {
            /* no es grave */
        }
    }


    /*
       Pinta la seña de "item" dentro de "contenedor".
       Con video si existe; si no, la palabra deletreada.
       En los juegos se pasa { conLetras: false } para que
       el deletreo no muestre la respuesta escrita.
    */

    function mostrarSena(contenedor, item, { conLetras = true } = {}) {

        contenedor.innerHTML = "";
        contenedor.classList.add("sena");

        const ruta = rutaVideo(item);

        if (faltantes.has(ruta)) {
            contenedor.appendChild(crearDeletreo(item, conLetras));
            return;
        }

        const video = document.createElement("video");

        video.src = ruta;
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.preload = "auto";
        video.className = "sena-video";

        video.addEventListener("error", () => {

            marcarFaltante(ruta);

            if (video.isConnected) {
                video.replaceWith(crearDeletreo(item, conLetras));
            }

        }, { once: true });

        contenedor.appendChild(video);
    }


    function crearDeletreo(item, conLetras) {

        const caja = document.createElement("div");
        caja.className = "sena-deletreo";

        const letras = ABC.limpiarTexto(item.palabra);

        const tira = document.createElement("div");
        tira.className = "sena-tira";

        for (const palabra of letras.split(" ")) {

            const grupo = document.createElement("div");
            grupo.className = "sena-palabra";

            for (const letra of palabra) {

                const figura = document.createElement("figure");

                const img = document.createElement("img");
                img.src = ABC.rutaLetra(letra);
                img.alt = `Letra ${letra}`;
                img.loading = "lazy";

                figura.appendChild(img);

                if (conLetras) {
                    const pie = document.createElement("figcaption");
                    pie.textContent = letra;
                    figura.appendChild(pie);
                } else {
                    img.alt = "Seña de una letra";
                }
                grupo.appendChild(figura);
            }

            tira.appendChild(grupo);
        }

        const nota = document.createElement("p");
        nota.className = "sena-nota";
        nota.textContent = conLetras
            ? "Deletreo con el abecedario · video de la seña próximamente"
            : "Lee el deletreo con el abecedario · video de la seña próximamente";

        caja.append(tira, nota);

        return caja;
    }


    /* Opciones de respuesta: la correcta y otras al azar. */

    function opcionesPara(correcta, lista, cantidad = 4) {

        const otras = ABC.mezclar(lista.filter(item => item.id !== correcta.id))
            .slice(0, cantidad - 1);

        return ABC.mezclar([correcta, ...otras]);
    }


    return {
        MATERIALES,
        ORDENES,
        VOCABULARIO,
        mostrarSena,
        opcionesPara
    };

})();
