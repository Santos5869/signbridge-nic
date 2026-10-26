"use strict";

/* =========================================================
   SIGNBRIDGE - DELETREO BÁSICO
   1) Aprende: mira la palabra letra por letra.
   2) Comprueba: adivina la palabra viendo solo las señas.
========================================================= */

const PALABRAS = [
    { palabra: "SOL",   pista: "☀️" },
    { palabra: "MAR",   pista: "🌊" },
    { palabra: "PAN",   pista: "🍞" },
    { palabra: "GATO",  pista: "🐱" },
    { palabra: "CASA",  pista: "🏠" },
    { palabra: "LUNA",  pista: "🌙" },
    { palabra: "FLOR",  pista: "🌸" },
    { palabra: "AGUA",  pista: "💧" },
    { palabra: "LIBRO", pista: "📖" },
    { palabra: "PERRO", pista: "🐶" }
];

const VELOCIDAD_REPRODUCCION = 1100;


/* =========================================================
   ESTADO
========================================================= */

let indicePalabra = 0;
let indiceLetra = 0;
let letrasVistas = new Set();
let reproduciendo = null;
let fallos = 0;
let aciertosPrimerIntento = 0;
let resuelta = false;


/* =========================================================
   ELEMENTOS
========================================================= */

const $ = (id) => document.getElementById(id);

const contador = $("contador");
const pista = $("pista");
const faseEtiqueta = $("faseEtiqueta");
const fichas = $("fichas");
const faseAprender = $("faseAprender");
const fasePrueba = $("fasePrueba");
const senaGrande = $("senaGrande");
const letraActual = $("letraActual");
const btnAnterior = $("anterior");
const btnReproducir = $("reproducir");
const btnSiguienteLetra = $("siguienteLetra");
const btnAPrueba = $("aPrueba");
const tira = $("tira");
const opciones = $("opciones");
const mensaje = $("mensaje");
const btnSiguientePalabra = $("siguientePalabra");
const sello = $("sello");
const barra = $("barra");
const final = $("final");


function palabraActual() {
    return PALABRAS[indicePalabra];
}


/* =========================================================
   FASE 1: APRENDER
========================================================= */

function iniciarPalabra() {

    detenerReproduccion();

    const { palabra, pista: emoji } = palabraActual();

    indiceLetra = 0;
    letrasVistas = new Set();
    fallos = 0;
    resuelta = false;

    contador.textContent = `Palabra ${indicePalabra + 1} / ${PALABRAS.length}`;
    pista.textContent = emoji;
    faseEtiqueta.textContent = "Paso 1 · Aprende la palabra";

    faseAprender.classList.remove("hidden");
    fasePrueba.classList.add("hidden");

    barra.style.width = `${(indicePalabra / PALABRAS.length) * 100}%`;

    dibujarFichas(false);
    mostrarLetra(0);

    /* La siguiente palabra se descarga mientras tanto. */
    const siguiente = PALABRAS[indicePalabra + 1];
    ABC.precargar(palabra + (siguiente ? siguiente.palabra : ""));
}


function dibujarFichas(ocultas) {

    fichas.innerHTML = "";

    palabraActual().palabra.split("").forEach((letra, i) => {

        const ficha = document.createElement("button");

        ficha.type = "button";
        ficha.className = "tile";
        ficha.textContent = ocultas ? "?" : letra;
        ficha.disabled = ocultas;
        ficha.setAttribute("aria-label", ocultas ? "Letra oculta" : `Letra ${letra}`);

        ficha.addEventListener("click", () => {
            detenerReproduccion();
            mostrarLetra(i);
        });

        fichas.appendChild(ficha);
    });
}


function mostrarLetra(i) {

    const palabra = palabraActual().palabra;

    indiceLetra = Math.max(0, Math.min(palabra.length - 1, i));

    const letra = palabra[indiceLetra];

    senaGrande.src = ABC.rutaLetra(letra);
    senaGrande.alt = `Seña de la letra ${letra}`;
    letraActual.textContent = letra;

    senaGrande.classList.remove("flip");
    void senaGrande.offsetWidth;
    senaGrande.classList.add("flip");

    fichas.querySelectorAll(".tile").forEach((ficha, j) => {
        ficha.classList.toggle("current", j === indiceLetra);
    });

    letrasVistas.add(indiceLetra);

    btnAnterior.disabled = indiceLetra === 0;
    btnSiguienteLetra.disabled = indiceLetra === palabra.length - 1;

    if (letrasVistas.size === palabra.length) {
        btnAPrueba.disabled = false;
        btnAPrueba.textContent = "¡Ponme a prueba! →";
    } else {
        btnAPrueba.disabled = true;
        btnAPrueba.textContent = `Mira todas las letras (${letrasVistas.size}/${palabra.length})`;
    }
}


function alternarReproduccion() {

    if (reproduciendo) {
        detenerReproduccion();
        return;
    }

    btnReproducir.textContent = "⏸ Pausar";

    mostrarLetra(0);

    reproduciendo = setInterval(() => {

        if (indiceLetra >= palabraActual().palabra.length - 1) {
            detenerReproduccion();
            return;
        }

        mostrarLetra(indiceLetra + 1);

    }, VELOCIDAD_REPRODUCCION);
}


function detenerReproduccion() {

    clearInterval(reproduciendo);

    reproduciendo = null;

    btnReproducir.textContent = "▶ Reproducir";
}


/* =========================================================
   FASE 2: COMPROBAR
========================================================= */

function iniciarPrueba() {

    detenerReproduccion();

    const { palabra } = palabraActual();

    faseEtiqueta.textContent = "Paso 2 · ¿Qué palabra es?";
    pista.textContent = "🤔";

    faseAprender.classList.add("hidden");
    fasePrueba.classList.remove("hidden");

    mensaje.textContent = "";
    mensaje.className = "feedback";
    btnSiguientePalabra.classList.add("hidden");

    dibujarFichas(true);


    /* Tira de señas, sin la letra escrita. */

    tira.innerHTML = "";

    palabra.split("").forEach((letra, i) => {

        const img = document.createElement("img");

        img.src = ABC.rutaLetra(letra);
        img.alt = `Seña ${i + 1}`;
        img.style.animationDelay = `${i * 120}ms`;

        tira.appendChild(img);
    });


    /*
       Opciones: preferimos palabras del mismo largo,
       que son las que más se confunden.
    */

    const otras = PALABRAS.map(p => p.palabra).filter(p => p !== palabra);

    const mismoLargo = ABC.mezclar(otras.filter(p => p.length === palabra.length));
    const resto = ABC.mezclar(otras.filter(p => p.length !== palabra.length));

    const incorrectas = [...mismoLargo, ...resto].slice(0, 3);

    opciones.innerHTML = "";

    ABC.mezclar([palabra, ...incorrectas]).forEach(opcion => {

        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "word-option";
        boton.textContent = opcion;

        boton.addEventListener("click", () => responder(boton, opcion));

        opciones.appendChild(boton);
    });
}


function responder(boton, opcion) {

    if (resuelta) {
        return;
    }

    const { palabra, pista: emoji } = palabraActual();

    if (opcion !== palabra) {

        fallos++;

        boton.classList.add("wrong");
        boton.disabled = true;

        mensaje.textContent = "Casi. Mira otra vez cada seña de la tira.";
        mensaje.className = "feedback bad";

        return;
    }

    resuelta = true;

    if (fallos === 0) {
        aciertosPrimerIntento++;
    }

    boton.classList.add("right");

    opciones.querySelectorAll("button").forEach(b => { b.disabled = true; });

    dibujarFichas(false);
    pista.textContent = emoji;

    mensaje.textContent = `¡Correcto! ${emoji} ${palabra}`;
    mensaje.className = "feedback good";

    sello.classList.remove("show");
    void sello.offsetWidth;
    sello.classList.add("show");

    btnSiguientePalabra.classList.remove("hidden");
    btnSiguientePalabra.textContent =
        indicePalabra === PALABRAS.length - 1 ? "Ver calificación →" : "Siguiente palabra →";
    btnSiguientePalabra.focus();

    ABC.guardarProgreso("deletreoBasico", ((indicePalabra + 1) / PALABRAS.length) * 100);
}


function siguientePalabra() {

    sello.classList.remove("show");

    if (indicePalabra < PALABRAS.length - 1) {
        indicePalabra++;
        iniciarPalabra();
        return;
    }

    terminar();
}


/* =========================================================
   FINAL
========================================================= */

function terminar() {

    barra.style.width = "100%";

    const total = PALABRAS.length;

    const estrellas =
        aciertosPrimerIntento >= total - 1 ? 3 :
        aciertosPrimerIntento >= total * 0.6 ? 2 : 1;

    $("estrellas").textContent = "⭐".repeat(estrellas) + "☆".repeat(3 - estrellas);

    $("finalTexto").textContent =
        `Acertaste ${aciertosPrimerIntento} de ${total} palabras al primer intento.`;

    final.classList.remove("hidden");
}


function reiniciar() {

    final.classList.add("hidden");

    indicePalabra = 0;
    aciertosPrimerIntento = 0;

    iniciarPalabra();
}


/* =========================================================
   EVENTOS
========================================================= */

btnAnterior.addEventListener("click", () => { detenerReproduccion(); mostrarLetra(indiceLetra - 1); });
btnSiguienteLetra.addEventListener("click", () => { detenerReproduccion(); mostrarLetra(indiceLetra + 1); });
btnReproducir.addEventListener("click", alternarReproduccion);
btnAPrueba.addEventListener("click", iniciarPrueba);
btnSiguientePalabra.addEventListener("click", siguientePalabra);
$("repetir").addEventListener("click", reiniciar);


/* Flechas del teclado para moverse entre letras. */

document.addEventListener("keydown", (evento) => {

    if (faseAprender.classList.contains("hidden")) {
        return;
    }

    if (evento.key === "ArrowRight") {
        detenerReproduccion();
        mostrarLetra(indiceLetra + 1);
    }

    if (evento.key === "ArrowLeft") {
        detenerReproduccion();
        mostrarLetra(indiceLetra - 1);
    }
});


iniciarPalabra();
