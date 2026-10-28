"use strict";

/* =========================================================
   SIGNBRIDGE - JUEGO GENÉRICO: QUIZ DE SEÑAS
   10 señas al azar; eliges su significado entre 4.
   Los aciertos seguidos suben la racha y dan más puntos.

   Las señas vienen de JUEGOS (presentaciones-juegos.js,
   colores-juegos.js...). La página indica dónde guardar
   el progreso con <body data-progreso="clave">.
========================================================= */

const PREGUNTAS = 10;
const PUNTOS_BASE = 10;
const CLAVE_PROGRESO = document.body.dataset.progreso || "presentacionesQuiz";


/* =========================================================
   ESTADO
========================================================= */

let rondas = [];
let ronda = 0;
let puntos = 0;
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
const elPuntos = $("puntos");
const barra = $("barra");
const sena = $("sena");
const opciones = $("opciones");
const mensaje = $("mensaje");
const btnSiguiente = $("siguiente");
const final = $("final");


/* =========================================================
   JUEGO
========================================================= */

function iniciar() {

    rondas = ABC.mezclar(JUEGOS.SENAS).slice(0, PREGUNTAS);
    ronda = 0;
    puntos = 0;
    racha = 0;
    aciertos = 0;
    falladas = new Set();

    final.classList.add("hidden");

    actualizarMarcador();
    mostrarRonda();
}


function mostrarRonda() {

    const correcta = rondas[ronda];

    resuelta = false;
    fallo = false;

    elRonda.textContent = `Pregunta ${ronda + 1} / ${rondas.length}`;
    barra.style.width = `${(ronda / rondas.length) * 100}%`;

    mensaje.textContent = "";
    btnSiguiente.classList.add("hidden");

    sena.innerHTML = "";
    sena.appendChild(JUEGOS.crearMedia(correcta, { controles: true }));

    opciones.innerHTML = "";

    JUEGOS.opcionesPara(correcta).forEach((opcion, i) => {

        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "opcion";
        boton.dataset.tecla = i + 1;
        boton.textContent = opcion.texto;

        boton.addEventListener("click", () => responder(boton, opcion));

        opciones.appendChild(boton);
    });
}


function responder(boton, opcion) {

    if (resuelta) {
        return;
    }

    const correcta = rondas[ronda];

    if (opcion.id !== correcta.id) {

        fallo = true;
        racha = 0;

        falladas.add(correcta.texto);

        boton.classList.add("mal");
        boton.disabled = true;

        mensaje.textContent = `No es «${opcion.texto}». Mira otra vez la seña.`;

        actualizarMarcador();

        return;
    }

    resuelta = true;

    if (!fallo) {
        aciertos++;
        racha++;
        puntos += PUNTOS_BASE * Math.min(racha, 5);
    }

    boton.classList.add("bien");

    opciones.querySelectorAll("button").forEach(b => { b.disabled = true; });

    mensaje.textContent = fallo
        ? `Esa es: ${correcta.emoji} ${correcta.texto}`
        : `¡Correcto! ${correcta.emoji} ${correcta.texto}`;

    actualizarMarcador();

    btnSiguiente.textContent =
        ronda === rondas.length - 1 ? "Ver resultado →" : "Siguiente →";
    btnSiguiente.classList.remove("hidden");
    btnSiguiente.focus();
}


function siguiente() {

    if (ronda < rondas.length - 1) {
        ronda++;
        mostrarRonda();
        return;
    }

    terminar();
}


function actualizarMarcador() {

    elRacha.textContent = `🔥 ${racha}`;
    elPuntos.textContent = `⭐ ${puntos} pts`;
}


function terminar() {

    barra.style.width = "100%";

    sena.innerHTML = "";

    $("estrellas").textContent = JUEGOS.estrellas(aciertos, rondas.length);

    $("finalTexto").textContent =
        `Acertaste ${aciertos} de ${rondas.length} al primer intento y sumaste ${puntos} puntos.`;

    const repasar = $("repasar");

    if (falladas.size) {
        repasar.textContent = `Repasa: ${[...falladas].join(", ")}`;
        repasar.classList.remove("hidden");
    } else {
        repasar.classList.add("hidden");
    }

    final.classList.remove("hidden");

    ABC.guardarProgreso(CLAVE_PROGRESO, (aciertos / rondas.length) * 100);
}


/* =========================================================
   EVENTOS
========================================================= */

btnSiguiente.addEventListener("click", siguiente);
$("otraVez").addEventListener("click", iniciar);


/* Teclas 1-4 para responder. */

document.addEventListener("keydown", (evento) => {

    if (!final.classList.contains("hidden")) {
        return;
    }

    const boton = opciones.querySelector(`[data-tecla="${evento.key}"]`);

    if (boton && !boton.disabled) {
        boton.click();
    }
});


JUEGOS.precargarImagenes();
iniciar();
