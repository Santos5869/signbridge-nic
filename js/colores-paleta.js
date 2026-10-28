"use strict";

/* =========================================================
   SIGNBRIDGE - COLORES: TOCA EL COLOR
   Aparece la seña de un color y se toca la muestra correcta
   en una paleta de 6 colores, sin ningún texto.
========================================================= */

const MUESTRAS = 6;
const ESPERA_ACIERTO_MS = 900;


/* =========================================================
   ESTADO
========================================================= */

let rondas = [];
let ronda = 0;
let racha = 0;
let aciertos = 0;
let fallo = false;
let resuelta = false;
let falladas = new Set();


/* =========================================================
   ELEMENTOS
========================================================= */

const $ = (id) => document.getElementById(id);

const elRonda = $("ronda");
const elRacha = $("racha");
const elAciertos = $("aciertos");
const barra = $("barra");
const sena = $("sena");
const paleta = $("paleta");
const mensaje = $("mensaje");
const final = $("final");


/* =========================================================
   JUEGO
========================================================= */

function iniciar() {

    /* Cada color sale una vez, en orden aleatorio. */
    rondas = ABC.mezclar(JUEGOS.SENAS);
    ronda = 0;
    racha = 0;
    aciertos = 0;
    falladas = new Set();

    final.classList.add("hidden");

    actualizarMarcador();
    mostrarRonda();
}


function mostrarRonda() {

    const correcto = rondas[ronda];

    resuelta = false;
    fallo = false;

    elRonda.textContent = `Color ${ronda + 1} / ${rondas.length}`;
    barra.style.width = `${(ronda / rondas.length) * 100}%`;

    mensaje.textContent = "¿Qué color es? Tócalo en la paleta.";

    sena.innerHTML = "";
    sena.appendChild(JUEGOS.crearMedia(correcto, { controles: true }));

    paleta.innerHTML = "";

    JUEGOS.opcionesPara(correcto, MUESTRAS).forEach((color, i) => {

        const muestra = document.createElement("button");

        muestra.type = "button";
        muestra.className = "muestra";
        muestra.style.setProperty("--color", color.hex);
        muestra.dataset.tecla = i + 1;

        /* El nombre solo lo leen los lectores de pantalla. */
        muestra.setAttribute("aria-label", color.texto);

        muestra.addEventListener("click", () => responder(muestra, color));

        paleta.appendChild(muestra);
    });
}


function responder(muestra, color) {

    if (resuelta) {
        return;
    }

    const correcto = rondas[ronda];

    if (color.id !== correcto.id) {

        fallo = true;
        racha = 0;

        falladas.add(correcto.texto);

        muestra.classList.add("descartada");
        muestra.disabled = true;

        mensaje.textContent = `Ese es el ${color.texto.toLowerCase()}. Mira otra vez la seña.`;

        actualizarMarcador();

        return;
    }

    resuelta = true;

    if (!fallo) {
        aciertos++;
        racha++;
    }

    muestra.classList.add("elegida");

    paleta.querySelectorAll("button").forEach(b => { b.disabled = true; });

    mensaje.textContent = `${fallo ? "Ese es:" : "¡Correcto!"} ${correcto.emoji} ${correcto.texto}`;

    actualizarMarcador();

    setTimeout(() => {

        if (ronda < rondas.length - 1) {
            ronda++;
            mostrarRonda();
        } else {
            terminar();
        }

    }, ESPERA_ACIERTO_MS);
}


function actualizarMarcador() {

    elRacha.textContent = `🔥 ${racha}`;
    elAciertos.textContent = `✓ ${aciertos}`;
}


function terminar() {

    barra.style.width = "100%";

    sena.innerHTML = "";

    $("estrellas").textContent = JUEGOS.estrellas(aciertos, rondas.length);

    $("finalTexto").textContent =
        `Tocaste el color correcto ${aciertos} de ${rondas.length} veces al primer intento.`;

    const repasar = $("repasar");

    if (falladas.size) {
        repasar.textContent = `Repasa: ${[...falladas].join(", ")}`;
        repasar.classList.remove("hidden");
    } else {
        repasar.classList.add("hidden");
    }

    final.classList.remove("hidden");

    ABC.guardarProgreso("coloresPaleta", (aciertos / rondas.length) * 100);
}


/* =========================================================
   EVENTOS
========================================================= */

$("otraVez").addEventListener("click", iniciar);

/* Teclas 1-6 para elegir una muestra. */

document.addEventListener("keydown", (evento) => {

    if (!final.classList.contains("hidden")) {
        return;
    }

    const muestra = paleta.querySelector(`[data-tecla="${evento.key}"]`);

    if (muestra && !muestra.disabled) {
        muestra.click();
    }
});


iniciar();
