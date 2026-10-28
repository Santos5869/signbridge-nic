"use strict";

/* =========================================================
   SIGNBRIDGE - JUEGO GENÉRICO: MEMORIA DE SEÑAS
   6 parejas al azar: cada seña se une con su significado.

   Las señas vienen de JUEGOS. La página indica las claves
   con <body data-progreso="..." data-record="...">.
========================================================= */

const PAREJAS = 6;
const ESPERA_ERROR_MS = 1100;
const CLAVE_RECORD = document.body.dataset.record || "signbridge_memoria_record";
const CLAVE_PROGRESO = document.body.dataset.progreso || "presentacionesMemoria";


/* =========================================================
   ESTADO
========================================================= */

let cartas = [];
let volteadas = [];
let encontradas = 0;
let intentos = 0;
let bloqueado = false;
let inicio = 0;
let reloj = null;


/* =========================================================
   ELEMENTOS
========================================================= */

const $ = (id) => document.getElementById(id);

const tablero = $("tablero");
const elParejas = $("parejas");
const elIntentos = $("intentos");
const elTiempo = $("tiempo");
const elRecord = $("record");
const mensaje = $("mensaje");
const final = $("final");


/* =========================================================
   PREPARAR TABLERO
========================================================= */

function iniciar() {

    clearInterval(reloj);
    reloj = null;
    inicio = 0;

    volteadas = [];
    encontradas = 0;
    intentos = 0;
    bloqueado = false;

    final.classList.add("hidden");
    mensaje.textContent = "Voltea una carta para empezar.";

    const elegidas = ABC.mezclar(JUEGOS.SENAS).slice(0, PAREJAS);

    /* Cada seña da dos cartas: la seña y su texto. */
    cartas = ABC.mezclar(
        elegidas.flatMap(sena => [
            { sena, tipo: "sena" },
            { sena, tipo: "texto" }
        ])
    );

    tablero.innerHTML = "";

    cartas.forEach((carta, i) => {

        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "carta";
        boton.setAttribute("aria-label", `Carta ${i + 1}`);

        boton.innerHTML = `
            <div class="carta-interior">
                <div class="cara reverso" aria-hidden="true">?</div>
                <div class="cara frente"></div>
            </div>
        `;

        boton.addEventListener("click", () => voltear(i));

        carta.boton = boton;

        tablero.appendChild(boton);
    });

    actualizarMarcador();
    elTiempo.textContent = "⏱ 0:00";
}


/* El contenido se crea al voltear: así no se descargan
   todos los videos al abrir la página. */

function pintarFrente(carta) {

    const frente = carta.boton.querySelector(".cara.frente");

    if (frente.childElementCount) {
        return;
    }

    if (carta.tipo === "sena") {

        frente.appendChild(JUEGOS.crearMedia(carta.sena));

    } else {

        frente.innerHTML = `
            <span class="emoji-carta" aria-hidden="true">${carta.sena.emoji}</span>
            <span class="texto-carta">${carta.sena.texto}</span>
        `;
    }
}


/* =========================================================
   JUGAR
========================================================= */

function voltear(i) {

    const carta = cartas[i];

    if (
        bloqueado ||
        carta.boton.classList.contains("volteada") ||
        carta.boton.classList.contains("hecha")
    ) {
        return;
    }

    if (!reloj) {
        inicio = performance.now();
        reloj = setInterval(actualizarTiempo, 500);
    }

    pintarFrente(carta);

    carta.boton.classList.add("volteada");
    carta.boton.setAttribute(
        "aria-label",
        carta.tipo === "sena" ? "Seña" : carta.sena.texto
    );

    volteadas.push(carta);

    if (volteadas.length < 2) {
        return;
    }

    intentos++;

    const [a, b] = volteadas;
    volteadas = [];

    const pareja = a.sena.id === b.sena.id && a.tipo !== b.tipo;

    if (pareja) {

        a.boton.classList.add("hecha");
        b.boton.classList.add("hecha");

        encontradas++;

        mensaje.textContent = `¡Pareja! ${a.sena.emoji} ${a.sena.texto}`;

        actualizarMarcador();

        if (encontradas === PAREJAS) {
            setTimeout(terminar, 600);
        }

        return;
    }

    mensaje.textContent = "No son pareja. Intenta recordar dónde estaban.";

    bloqueado = true;

    a.boton.classList.add("error");
    b.boton.classList.add("error");

    setTimeout(() => {

        [a, b].forEach(c => {
            c.boton.classList.remove("volteada", "error");
            c.boton.setAttribute("aria-label", "Carta tapada");
        });

        bloqueado = false;

    }, ESPERA_ERROR_MS);

    actualizarMarcador();
}


function actualizarMarcador() {

    elParejas.textContent = `Parejas ${encontradas} / ${PAREJAS}`;
    elIntentos.textContent = `🔁 ${intentos} ${intentos === 1 ? "intento" : "intentos"}`;

    const record = ABC.leerLocal(CLAVE_RECORD, null);
    elRecord.textContent = record ? `🏆 Récord: ${record} intentos` : "🏆 Récord: —";
}


function segundos() {
    return Math.floor((performance.now() - inicio) / 1000);
}


function formatoTiempo(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}


function actualizarTiempo() {
    elTiempo.textContent = `⏱ ${formatoTiempo(segundos())}`;
}


/* =========================================================
   FINAL
========================================================= */

function terminar() {

    clearInterval(reloj);

    const tiempo = segundos();

    const record = ABC.leerLocal(CLAVE_RECORD, null);
    const esRecord = record === null || intentos < record;

    if (esRecord) {
        ABC.guardarLocal(CLAVE_RECORD, intentos);
    }

    /* Con 6 parejas, 6 intentos es perfecto. */
    const n = intentos <= 9 ? 3 : intentos <= 14 ? 2 : 1;

    $("estrellas").textContent = "⭐".repeat(n) + "☆".repeat(3 - n);

    $("finalTexto").textContent =
        `Encontraste las ${PAREJAS} parejas en ${intentos} intentos y ${formatoTiempo(tiempo)}.` +
        (esRecord ? " ¡Nuevo récord!" : "");

    actualizarMarcador();

    final.classList.remove("hidden");

    ABC.guardarProgreso(CLAVE_PROGRESO, 100);
}


/* =========================================================
   EVENTOS
========================================================= */

$("otraVez").addEventListener("click", iniciar);


JUEGOS.precargarImagenes();
iniciar();
