/* =========================================================
   SIGNBRIDGE - SISTEMA DE POSTURAS
========================================================= */

const CONFIG_POSTURAS = {
    muestrasPorLetra: 5,
    puntosPorMano: 21,
    almacenamiento: "signbridge_posturas"
};


/* =========================================================
   CARGAR POSTURAS GUARDADAS
========================================================= */

let posturas = cargarPosturas();


function cargarPosturas() {

    try {

        const datos =
            localStorage.getItem(
                CONFIG_POSTURAS.almacenamiento
            );

        if (!datos) {
            return {};
        }

        return JSON.parse(datos);

    } catch (error) {

        console.error(
            "Error cargando posturas:",
            error
        );

        return {};
    }
}


/* =========================================================
   GUARDAR EN LOCALSTORAGE
========================================================= */

function guardarEnAlmacenamiento() {

    try {

        localStorage.setItem(
            CONFIG_POSTURAS.almacenamiento,
            JSON.stringify(posturas)
        );

        console.log(
            "✓ Posturas guardadas permanentemente."
        );

        return true;

    } catch (error) {

        console.error(
            "Error guardando posturas:",
            error
        );

        return false;
    }
}


/* =========================================================
   NORMALIZAR POSTURA
========================================================= */

/*
   MediaPipe entrega X e Y en proporción al ancho y alto
   de la imagen. Multiplicamos X por el aspecto
   (ancho / alto) para que la mano tenga su forma real,
   igual en una laptop (16:9) que en un celular vertical.
*/

const ASPECTO_POR_DEFECTO = 16 / 9;


function normalizarPostura(
    landmarks,
    aspecto = ASPECTO_POR_DEFECTO
) {

    if (
        !Array.isArray(landmarks) ||
        landmarks.length !== 21
    ) {

        return null;
    }


    if (
        !Number.isFinite(aspecto) ||
        aspecto <= 0
    ) {

        aspecto = ASPECTO_POR_DEFECTO;
    }


    landmarks =
        landmarks.map(
            punto => ({
                x: punto.x * aspecto,
                y: punto.y,
                z: punto.z || 0
            })
        );


    const muñeca =
        landmarks[0];

    const palma =
        landmarks[9];


    const dx =
        palma.x - muñeca.x;

    const dy =
        palma.y - muñeca.y;

    const dz =
        (palma.z || 0) -
        (muñeca.z || 0);


    let escala =
        Math.sqrt(
            dx * dx +
            dy * dy +
            dz * dz
        );


    if (
        !Number.isFinite(escala) ||
        escala < 0.001
    ) {

        escala = 1;
    }


    return landmarks.map(
        punto => ({

            x:
                (punto.x - muñeca.x) /
                escala,

            y:
                (punto.y - muñeca.y) /
                escala,

            z:
                ((punto.z || 0) -
                    (muñeca.z || 0)) /
                escala

        })
    );
}


/* =========================================================
   PREPARAR MUESTRA GUARDADA
========================================================= */

/*
   Formato nuevo: { v: 2, puntos: [...] }, ya corregido
   por aspecto.

   Formato anterior: arreglo de 21 puntos sin corregir.
   Se grabó con la cámara a 1280x720, así que le
   aplicamos el aspecto 16:9 y volvemos a normalizar.
*/

function prepararMuestra(muestra) {

    if (
        muestra &&
        !Array.isArray(muestra) &&
        Array.isArray(muestra.puntos) &&
        muestra.puntos.length === 21
    ) {

        return muestra.puntos;
    }


    if (
        Array.isArray(muestra) &&
        muestra.length === 21
    ) {

        return normalizarPostura(
            muestra,
            ASPECTO_POR_DEFECTO
        );
    }


    return null;
}


/* =========================================================
   GUARDAR POSTURA
========================================================= */

function guardarPostura(
    letra,
    landmarks,
    aspecto = ASPECTO_POR_DEFECTO
) {

    letra =
        String(letra)
            .trim()
            .toUpperCase();


    if (!letra) {

        console.error(
            "Letra inválida."
        );

        return false;
    }


    const puntos =
        normalizarPostura(
            landmarks,
            aspecto
        );

    const postura =
        puntos
            ? { v: 2, puntos }
            : null;


    if (!postura) {

        console.error(
            "No se pudo normalizar la postura."
        );

        return false;
    }


    if (!posturas[letra]) {

        posturas[letra] = [];
    }


    if (
        posturas[letra].length >=
        CONFIG_POSTURAS.muestrasPorLetra
    ) {

        console.warn(
            `La letra ${letra} ya está completa.`
        );

        return false;
    }


    posturas[letra].push(
        postura
    );


    guardarEnAlmacenamiento();


    console.log(
        `✓ ${letra}: ${posturas[letra].length}/${CONFIG_POSTURAS.muestrasPorLetra}`
    );


    return true;
}


/* =========================================================
   OBTENER POSTURAS
========================================================= */

function obtenerPosturas(letra) {

    letra =
        String(letra)
            .trim()
            .toUpperCase();


    return posturas[letra] || [];
}


/* =========================================================
   COMPROBAR SI ESTÁ COMPLETA
========================================================= */

function posturaCompleta(letra) {

    return (
        obtenerPosturas(letra).length >=
        CONFIG_POSTURAS.muestrasPorLetra
    );
}


/* =========================================================
   OBTENER TODAS LAS LETRAS COMPLETAS
========================================================= */

function obtenerLetrasCompletas() {

    return Object.keys(posturas)
        .filter(
            letra =>
                posturaCompleta(letra)
        );
}


/* =========================================================
   ELIMINAR UNA LETRA
========================================================= */

function eliminarPosturas(letra) {

    letra =
        String(letra)
            .trim()
            .toUpperCase();


    if (!posturas[letra]) {
        return false;
    }


    delete posturas[letra];

    guardarEnAlmacenamiento();


    console.log(
        `✓ Posturas de ${letra} eliminadas.`
    );


    return true;
}


/* =========================================================
   ELIMINAR TODO
========================================================= */

function eliminarTodasLasPosturas() {

    posturas = {};

    localStorage.removeItem(
        CONFIG_POSTURAS.almacenamiento
    );


    console.log(
        "✓ Todas las posturas fueron eliminadas."
    );
}


/* =========================================================
   MOSTRAR INFORMACIÓN
========================================================= */

function mostrarPosturasGuardadas() {

    console.log(
        "========== SIGNBRIDGE =========="
    );


    const letras =
        Object.keys(posturas);


    if (letras.length === 0) {

        console.log(
            "No hay posturas guardadas."
        );

        return;
    }


    letras.forEach(
        letra => {

            console.log(
                `${letra}: ${posturas[letra].length}/${CONFIG_POSTURAS.muestrasPorLetra}`
            );

        }
    );


    console.log(
        "================================"
    );
}


/* =========================================================
   DESCARGAR POSTURAS COMO posturas-base.js
   (se copia en la carpeta js/ para que la página
   funcione en cualquier navegador)
========================================================= */

function exportarPosturas() {

    const total =
        Object.values(posturas)
            .reduce(
                (suma, lista) =>
                    suma + lista.length,
                0
            );


    if (total === 0) {

        alert(
            "No hay posturas guardadas en este navegador."
        );

        return;
    }


    const contenido =
        "/* Posturas base de SignBridge, generadas con el capturador. */\n" +
        "window.POSTURAS_BASE = " +
        JSON.stringify(posturas) +
        ";\n";


    const blob =
        new Blob(
            [contenido],
            { type: "text/javascript" }
        );


    const enlace =
        document.createElement("a");

    enlace.href =
        URL.createObjectURL(blob);

    enlace.download =
        "posturas-base.js";

    document.body.appendChild(enlace);

    enlace.click();

    enlace.remove();


    setTimeout(
        () => URL.revokeObjectURL(enlace.href),
        1000
    );


    console.log(
        `✓ ${total} posturas exportadas.`
    );
}


/* =========================================================
   EXPORTAR
========================================================= */

window.exportarPosturas =
    exportarPosturas;

window.posturas =
    posturas;

window.CONFIG_POSTURAS =
    CONFIG_POSTURAS;

window.normalizarPostura =
    normalizarPostura;

window.prepararMuestra =
    prepararMuestra;

window.guardarPostura =
    guardarPostura;

window.obtenerPosturas =
    obtenerPosturas;

window.posturaCompleta =
    posturaCompleta;

window.obtenerLetrasCompletas =
    obtenerLetrasCompletas;

window.eliminarPosturas =
    eliminarPosturas;

window.eliminarTodasLasPosturas =
    eliminarTodasLasPosturas;

window.mostrarPosturasGuardadas =
    mostrarPosturasGuardadas;