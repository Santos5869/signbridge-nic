"use strict";

/* =========================================================
   SIGNBRIDGE - ESCUELA / MATERIALES ESCOLARES
   Aprende: tablero de corcho con fotos clavadas.
   Juego: mira la seña y guarda el material en la mochila.
========================================================= */

const ITEMS = ESCUELA.MATERIALES;
const RONDAS = 8;
const CLAVE_VISTOS = "signbridge_escuela_materiales_vistos";


/* =========================================================
   ESTADO
========================================================= */

let vistos = new Set(ABC.leerLocal(CLAVE_VISTOS, []));
let indiceVisor = 0;

let rondas = [];
let ronda = 0;
let falloEnRonda = false;
let aciertos = 0;
let resuelta = false;


/* =========================================================
   ELEMENTOS
========================================================= */

const $ = (id) => document.getElementById(id);

const tablero = $("tablero");
const etiquetaVistos = $("vistos");
const tabAprender = $("tabAprender");
const tabJugar = $("tabJugar");
const modoAprender = $("modoAprender");
const modoJugar = $("modoJugar");
const visor = $("visor");
const senaVisor = $("senaVisor");
const visorTitulo = $("visorTitulo");
const visorEmoji = $("visorEmoji");
const senaJuego = $("senaJuego");
const etiquetaRonda = $("ronda");
const opciones = $("opciones");
const mochila = $("mochila");
const dentro = $("dentro");
const final = $("final");


/* =========================================================
   TABLERO
========================================================= */

function dibujarTablero() {

    tablero.innerHTML = "";

    ITEMS.forEach((item, i) => {

        const tarjeta = document.createElement("button");

        tarjeta.type = "button";
        tarjeta.className = "polaroid pin-card";
        tarjeta.style.setProperty("--giro", `${((i * 37) % 9) - 4}deg`);

        if (vistos.has(item.id)) {
            tarjeta.classList.add("visto");
        }

        tarjeta.innerHTML = `
            <span class="pin" aria-hidden="true"></span>
            <span class="pin-emoji">${item.emoji}</span>
            <span class="polaroid-caption">${item.palabra}</span>
        `;

        tarjeta.addEventListener("click", () => abrirVisor(i));

        tablero.appendChild(tarjeta);
    });

    actualizarVistos();
}


function actualizarVistos() {

    etiquetaVistos.textContent = `Vistos ${vistos.size} / ${ITEMS.length}`;

    ABC.guardarProgreso("escuelaMateriales", (vistos.size / ITEMS.length) * 50);
}


/* =========================================================
   VISOR
========================================================= */

function abrirVisor(i) {

    indiceVisor = (i + ITEMS.length) % ITEMS.length;

    const item = ITEMS[indiceVisor];

    ESCUELA.mostrarSena(senaVisor, item);

    visorTitulo.textContent = item.palabra;
    visorEmoji.textContent = item.emoji;

    visor.classList.remove("hidden");

    if (!vistos.has(item.id)) {

        vistos.add(item.id);

        ABC.guardarLocal(CLAVE_VISTOS, [...vistos]);

        tablero.children[indiceVisor].classList.add("visto");

        actualizarVistos();
    }
}


function cerrarVisor() {

    visor.classList.add("hidden");

    senaVisor.innerHTML = "";
}


/* =========================================================
   JUEGO DE LA MOCHILA
========================================================= */

function iniciarJuego() {

    rondas = ABC.mezclar(ITEMS).slice(0, RONDAS);
    ronda = 0;
    aciertos = 0;

    dentro.innerHTML = "";
    final.classList.add("hidden");

    mostrarRonda();
}


function mostrarRonda() {

    const item = rondas[ronda];

    resuelta = false;
    falloEnRonda = false;

    etiquetaRonda.textContent = `${ronda + 1} / ${rondas.length}`;

    ESCUELA.mostrarSena(senaJuego, item, { conLetras: false });

    opciones.innerHTML = "";

    ESCUELA.opcionesPara(item, ITEMS).forEach(opcion => {

        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "option";
        boton.innerHTML = `<span>${opcion.emoji}</span>${opcion.palabra}`;

        boton.addEventListener("click", () => responder(boton, opcion));

        opciones.appendChild(boton);
    });
}


function responder(boton, opcion) {

    if (resuelta) {
        return;
    }

    const item = rondas[ronda];

    if (opcion.id !== item.id) {

        falloEnRonda = true;

        boton.classList.add("wrong");
        boton.disabled = true;

        return;
    }

    resuelta = true;

    if (!falloEnRonda) {
        aciertos++;
    }

    boton.classList.add("right");

    opciones.querySelectorAll("button").forEach(b => { b.disabled = true; });

    guardarEnMochila(boton, item);

    setTimeout(() => {

        ronda++;

        if (ronda < rondas.length) {
            mostrarRonda();
        } else {
            terminarJuego();
        }

    }, 900);
}


/* El material "vuela" desde el botón hasta la mochila. */

function guardarEnMochila(boton, item) {

    const origen = boton.getBoundingClientRect();
    const destino = mochila.getBoundingClientRect();

    const volador = document.createElement("span");

    volador.className = "flyer";
    volador.textContent = item.emoji;
    volador.style.left = `${origen.left + origen.width / 2}px`;
    volador.style.top = `${origen.top + origen.height / 2}px`;

    document.body.appendChild(volador);

    requestAnimationFrame(() => {
        volador.style.transform =
            `translate(${destino.left + destino.width / 2 - (origen.left + origen.width / 2)}px,
                       ${destino.top + destino.height / 2 - (origen.top + origen.height / 2)}px) scale(.4)`;
        volador.style.opacity = "0";
    });

    setTimeout(() => {

        volador.remove();

        const guardado = document.createElement("span");
        guardado.textContent = item.emoji;
        guardado.title = item.palabra;
        dentro.appendChild(guardado);

        mochila.classList.remove("bounce");
        void mochila.offsetWidth;
        mochila.classList.add("bounce");

    }, 600);
}


function terminarJuego() {

    $("finalTexto").textContent =
        `Reconociste ${aciertos} de ${rondas.length} materiales al primer intento.`;

    final.classList.remove("hidden");

    ABC.guardarProgreso("escuelaMateriales", 50 + (aciertos / rondas.length) * 50);
}


/* =========================================================
   PESTAÑAS
========================================================= */

function cambiarModo(jugar) {

    tabAprender.classList.toggle("active", !jugar);
    tabJugar.classList.toggle("active", jugar);
    tabAprender.setAttribute("aria-selected", String(!jugar));
    tabJugar.setAttribute("aria-selected", String(jugar));

    modoAprender.classList.toggle("hidden", jugar);
    modoJugar.classList.toggle("hidden", !jugar);

    if (jugar) {
        iniciarJuego();
    } else {
        senaJuego.innerHTML = "";
    }
}


/* =========================================================
   EVENTOS
========================================================= */

tabAprender.addEventListener("click", () => cambiarModo(false));
tabJugar.addEventListener("click", () => cambiarModo(true));
$("cerrarVisor").addEventListener("click", cerrarVisor);
$("anterior").addEventListener("click", () => abrirVisor(indiceVisor - 1));
$("siguiente").addEventListener("click", () => abrirVisor(indiceVisor + 1));
$("jugarOtraVez").addEventListener("click", iniciarJuego);

visor.addEventListener("click", (evento) => {
    if (evento.target === visor) {
        cerrarVisor();
    }
});

document.addEventListener("keydown", (evento) => {

    if (visor.classList.contains("hidden")) {
        return;
    }

    if (evento.key === "Escape") cerrarVisor();
    if (evento.key === "ArrowRight") abrirVisor(indiceVisor + 1);
    if (evento.key === "ArrowLeft") abrirVisor(indiceVisor - 1);
});


dibujarTablero();
