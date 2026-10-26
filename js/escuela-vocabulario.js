"use strict";

/* =========================================================
   SIGNBRIDGE - ESCUELA / VOCABULARIO
   Explorar: toca lugares y personas del mapa.
   ¿Dónde está?: mira la seña y tócala en el mapa.
========================================================= */

const PALABRAS = ESCUELA.VOCABULARIO;
const RONDAS = 10;
const CLAVE_VISTOS = "signbridge_escuela_vocabulario_vistos";


/* =========================================================
   ESTADO
========================================================= */

let vistos = new Set(ABC.leerLocal(CLAVE_VISTOS, []));
let modo = "explorar";

let rondas = [];
let ronda = 0;
let aciertos = 0;
let falloEnRonda = false;
let resuelta = false;


/* =========================================================
   ELEMENTOS
========================================================= */

const $ = (id) => document.getElementById(id);

const mapa = $("mapa");
const tabExplorar = $("tabExplorar");
const tabJugar = $("tabJugar");
const fichaExplorar = $("fichaExplorar");
const fichaJugar = $("fichaJugar");
const tipo = $("tipo");
const titulo = $("titulo");
const senaExplorar = $("senaExplorar");
const etiquetaVistos = $("vistos");
const etiquetaRonda = $("ronda");
const puntos = $("puntos");
const senaJugar = $("senaJugar");
const mensaje = $("mensaje");
const final = $("final");


/* =========================================================
   DIBUJAR EL MAPA
   Cada lugar es una zona; las personas son fichas
   dentro de la zona donde trabajan o estudian.
========================================================= */

const botones = new Map();

function dibujarMapa() {

    mapa.innerHTML = "";

    const lugares = PALABRAS.filter(p => p.tipo === "lugar");

    for (const lugar of lugares) {

        const zona = document.createElement("div");
        zona.className = `zone zone-${lugar.zona}`;
        zona.style.gridArea = lugar.zona;

        const botonLugar = crearBoton(lugar, "place");
        botonLugar.innerHTML = `<span class="place-emoji">${lugar.emoji}</span><span class="place-name">${lugar.palabra}</span>`;
        zona.appendChild(botonLugar);

        const personas = PALABRAS.filter(p => p.tipo === "persona" && p.zona === lugar.zona);

        if (personas.length) {

            const grupo = document.createElement("div");
            grupo.className = "people";

            for (const persona of personas) {
                const ficha = crearBoton(persona, "person");
                ficha.innerHTML = `<span>${persona.emoji}</span>${persona.palabra}`;
                grupo.appendChild(ficha);
            }

            zona.appendChild(grupo);
        }

        mapa.appendChild(zona);
    }

    actualizarVistos();
}


function crearBoton(item, clase) {

    const boton = document.createElement("button");

    boton.type = "button";
    boton.className = clase;
    boton.dataset.id = item.id;
    boton.setAttribute("aria-label", item.palabra);

    if (vistos.has(item.id)) {
        boton.classList.add("visto");
    }

    boton.addEventListener("click", (evento) => {
        evento.stopPropagation();
        tocar(item, boton);
    });

    botones.set(item.id, boton);

    return boton;
}


function tocar(item, boton) {

    if (modo === "explorar") {
        explorar(item, boton);
    } else {
        responder(item, boton);
    }
}


/* =========================================================
   EXPLORAR
========================================================= */

function explorar(item, boton) {

    botones.forEach(b => b.classList.remove("current"));
    boton.classList.add("current");

    tipo.textContent = item.tipo === "persona" ? "👤 Persona" : "📍 Lugar";
    titulo.textContent = `${item.emoji} ${item.palabra}`;

    ESCUELA.mostrarSena(senaExplorar, item);

    if (!vistos.has(item.id)) {

        vistos.add(item.id);

        ABC.guardarLocal(CLAVE_VISTOS, [...vistos]);

        boton.classList.add("visto");

        actualizarVistos();
    }
}


function actualizarVistos() {

    etiquetaVistos.textContent = `Descubiertos ${vistos.size} / ${PALABRAS.length}`;

    ABC.guardarProgreso("escuelaVocabulario", (vistos.size / PALABRAS.length) * 50);
}


/* =========================================================
   ¿DÓNDE ESTÁ?
========================================================= */

function iniciarJuego() {

    rondas = ABC.mezclar(PALABRAS).slice(0, RONDAS);
    ronda = 0;
    aciertos = 0;

    final.classList.add("hidden");

    mostrarRonda();
}


function mostrarRonda() {

    resuelta = false;
    falloEnRonda = false;

    botones.forEach(b => b.classList.remove("current", "right", "wrong"));

    etiquetaRonda.textContent = `${ronda + 1} / ${rondas.length}`;
    puntos.textContent = `⭐ ${aciertos}`;

    mensaje.textContent = "Toca la respuesta en el mapa.";
    mensaje.className = "feedback";

    ESCUELA.mostrarSena(senaJugar, rondas[ronda], { conLetras: false });
}


function responder(item, boton) {

    if (resuelta) {
        return;
    }

    const correcta = rondas[ronda];

    if (item.id !== correcta.id) {

        falloEnRonda = true;

        boton.classList.remove("wrong");
        void boton.offsetWidth;
        boton.classList.add("wrong");

        mensaje.textContent = `Ese es: ${item.palabra}. Busca otra vez.`;
        mensaje.className = "feedback bad";

        return;
    }

    resuelta = true;

    if (!falloEnRonda) {
        aciertos++;
    }

    boton.classList.add("right");

    puntos.textContent = `⭐ ${aciertos}`;

    mensaje.textContent = `¡Sí! ${correcta.emoji} ${correcta.palabra}`;
    mensaje.className = "feedback good";

    setTimeout(() => {

        ronda++;

        if (ronda < rondas.length) {
            mostrarRonda();
        } else {
            terminarJuego();
        }

    }, 1000);
}


function terminarJuego() {

    $("finalTexto").textContent =
        `Encontraste ${aciertos} de ${rondas.length} al primer intento.`;

    final.classList.remove("hidden");

    ABC.guardarProgreso("escuelaVocabulario", 50 + (aciertos / rondas.length) * 50);
}


/* =========================================================
   PESTAÑAS
========================================================= */

function cambiarModo(nuevo) {

    modo = nuevo;

    const jugar = nuevo === "jugar";

    tabExplorar.classList.toggle("active", !jugar);
    tabJugar.classList.toggle("active", jugar);
    tabExplorar.setAttribute("aria-selected", String(!jugar));
    tabJugar.setAttribute("aria-selected", String(jugar));

    fichaExplorar.classList.toggle("hidden", jugar);
    fichaJugar.classList.toggle("hidden", !jugar);

    mapa.classList.toggle("playing", jugar);

    botones.forEach(b => b.classList.remove("current", "right", "wrong"));

    if (jugar) {
        senaExplorar.innerHTML = "";
        iniciarJuego();
    } else {
        senaJugar.innerHTML = "";
    }
}


/* =========================================================
   EVENTOS
========================================================= */

tabExplorar.addEventListener("click", () => cambiarModo("explorar"));
tabJugar.addEventListener("click", () => cambiarModo("jugar"));
$("jugarOtraVez").addEventListener("click", iniciarJuego);


dibujarMapa();
