"use strict";

/* =========================================================
   SIGNBRIDGE - ESCUELA / ÓRDENES EN CLASE
   Aprende: lista escrita con tiza en la pizarra.
   El profe dice: mira la seña y elige qué acción te piden.
========================================================= */

const ORDENES = ESCUELA.ORDENES;
const RONDAS = 10;
const CLAVE_VISTAS = "signbridge_escuela_ordenes_vistas";

const FELICITACIONES = ["¡Muy bien!", "¡Excelente!", "¡Eso es!", "¡Perfecto!"];


/* =========================================================
   ESTADO
========================================================= */

let vistas = new Set(ABC.leerLocal(CLAVE_VISTAS, []));
let seleccionada = 0;

let rondas = [];
let ronda = 0;
let aciertos = 0;
let falloEnRonda = false;
let resuelta = false;


/* =========================================================
   ELEMENTOS
========================================================= */

const $ = (id) => document.getElementById(id);

const tabAprender = $("tabAprender");
const tabJugar = $("tabJugar");
const modoAprender = $("modoAprender");
const modoJugar = $("modoJugar");
const zonaJuego = $("zonaJuego");
const lista = $("lista");
const senaAprender = $("senaAprender");
const ordenTitulo = $("ordenTitulo");
const ordenDetalle = $("ordenDetalle");
const senaJuego = $("senaJuego");
const etiquetaRonda = $("ronda");
const marcas = $("marcas");
const burbuja = $("burbuja");
const opciones = $("opciones");
const final = $("final");


/* =========================================================
   APRENDER
========================================================= */

function dibujarLista() {

    lista.innerHTML = "";

    ORDENES.forEach((orden, i) => {

        const li = document.createElement("li");
        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "chalk-item";
        boton.innerHTML = `<span>${orden.emoji}</span>${orden.palabra}`;

        if (vistas.has(orden.id)) {
            boton.classList.add("visto");
        }

        boton.addEventListener("click", () => seleccionar(i));

        li.appendChild(boton);
        lista.appendChild(li);
    });
}


function seleccionar(i) {

    seleccionada = i;

    const orden = ORDENES[i];

    ESCUELA.mostrarSena(senaAprender, orden);

    ordenTitulo.textContent = `${orden.emoji} ${orden.palabra}`;
    ordenDetalle.textContent = orden.detalle;

    lista.querySelectorAll(".chalk-item").forEach((boton, j) => {
        boton.classList.toggle("current", j === i);
    });

    if (!vistas.has(orden.id)) {

        vistas.add(orden.id);

        ABC.guardarLocal(CLAVE_VISTAS, [...vistas]);

        lista.children[i].firstChild.classList.add("visto");

        ABC.guardarProgreso("escuelaOrdenes", (vistas.size / ORDENES.length) * 50);
    }
}


/* =========================================================
   EL PROFE DICE
========================================================= */

function iniciarJuego() {

    rondas = ABC.mezclar(ORDENES).slice(0, RONDAS);
    ronda = 0;
    aciertos = 0;

    marcas.textContent = "";
    final.classList.add("hidden");

    mostrarRonda();
}


function mostrarRonda() {

    const orden = rondas[ronda];

    resuelta = false;
    falloEnRonda = false;

    etiquetaRonda.textContent = `Orden ${ronda + 1} de ${rondas.length}`;
    burbuja.textContent = "¿Qué te estoy pidiendo?";
    burbuja.className = "bubble";

    ESCUELA.mostrarSena(senaJuego, orden, { conLetras: false });

    opciones.innerHTML = "";

    ESCUELA.opcionesPara(orden, ORDENES).forEach((opcion, i) => {

        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "action";
        boton.style.setProperty("--giro", `${(i % 2 ? 1 : -1) * (1 + i)}deg`);
        boton.innerHTML = `<span>${opcion.emoji}</span>${opcion.palabra}`;

        boton.addEventListener("click", () => responder(boton, opcion));

        opciones.appendChild(boton);
    });
}


function responder(boton, opcion) {

    if (resuelta) {
        return;
    }

    const orden = rondas[ronda];

    if (opcion.id !== orden.id) {

        falloEnRonda = true;

        boton.classList.add("wrong");
        boton.disabled = true;

        burbuja.textContent = "Mmm, no es eso. Mira otra vez.";
        burbuja.className = "bubble bad";

        return;
    }

    resuelta = true;

    if (!falloEnRonda) {
        aciertos++;
        marcas.textContent += "✔";
    }

    boton.classList.add("right");

    opciones.querySelectorAll("button").forEach(b => { b.disabled = true; });

    burbuja.textContent = `${ABC.azar(FELICITACIONES)} ${orden.detalle}`;
    burbuja.className = "bubble good";

    setTimeout(() => {

        ronda++;

        if (ronda < rondas.length) {
            mostrarRonda();
        } else {
            terminarJuego();
        }

    }, 1100);
}


function terminarJuego() {

    const nota = Math.round((aciertos / rondas.length) * 10);

    $("nota").textContent = nota;
    $("nota").className = nota >= 7 ? "good" : "bad";
    $("finalTexto").textContent =
        `Entendiste ${aciertos} de ${rondas.length} órdenes al primer intento.`;

    final.classList.remove("hidden");

    ABC.guardarProgreso("escuelaOrdenes", 50 + (aciertos / rondas.length) * 50);
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
    zonaJuego.classList.toggle("hidden", !jugar);

    if (jugar) {
        senaAprender.innerHTML = "";
        iniciarJuego();
    } else {
        senaJuego.innerHTML = "";
        seleccionar(seleccionada);
    }
}


/* =========================================================
   EVENTOS
========================================================= */

tabAprender.addEventListener("click", () => cambiarModo(false));
tabJugar.addEventListener("click", () => cambiarModo(true));
$("jugarOtraVez").addEventListener("click", iniciarJuego);


dibujarLista();
seleccionar(0);
