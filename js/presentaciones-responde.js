"use strict";

/* =========================================================
   SIGNBRIDGE - JUEGO: RESPONDE LA PREGUNTA
   Te muestran una seña (pregunta o saludo) y eliges, entre
   3 señas, la que usarías para responder.
========================================================= */

const OPCIONES_POR_DIALOGO = 3;


/* =========================================================
   ESTADO
========================================================= */

let dialogos = [];
let ronda = 0;
let aciertos = 0;
let fallo = false;
let resuelta = false;
let opcionesActuales = [];


/* =========================================================
   ELEMENTOS
========================================================= */

const $ = (id) => document.getElementById(id);

const elRonda = $("ronda");
const elAciertos = $("aciertos");
const barra = $("barra");
const pregunta = $("pregunta");
const preguntaTexto = $("preguntaTexto");
const opciones = $("opciones");
const mensaje = $("mensaje");
const btnSiguiente = $("siguiente");
const final = $("final");


/* =========================================================
   JUEGO
========================================================= */

function iniciar() {

    dialogos = ABC.mezclar(JUEGOS.DIALOGOS);
    ronda = 0;
    aciertos = 0;

    final.classList.add("hidden");

    actualizarAciertos();
    mostrarRonda();
}


function mostrarRonda() {

    const dialogo = dialogos[ronda];
    const senaPregunta = JUEGOS.porId[dialogo.pregunta];

    resuelta = false;
    fallo = false;

    elRonda.textContent = `Diálogo ${ronda + 1} / ${dialogos.length}`;
    barra.style.width = `${(ronda / dialogos.length) * 100}%`;

    mensaje.textContent = "";
    btnSiguiente.classList.add("hidden");

    pregunta.innerHTML = "";
    pregunta.appendChild(JUEGOS.crearMedia(senaPregunta, { controles: true }));

    preguntaTexto.textContent = "¿Qué te están diciendo?";


    /*
       La respuesta correcta y otras señas al azar. Los
       nombres se ocultan hasta responder, para que el
       juego sea leer la seña y no el texto.
    */

    const otras = ABC.mezclar(
        JUEGOS.SENAS.filter(s => s.id !== dialogo.respuesta.id)
    ).slice(0, OPCIONES_POR_DIALOGO - 1);

    opcionesActuales = ABC.mezclar([dialogo.respuesta, ...otras]);

    opciones.innerHTML = "";

    opcionesActuales.forEach((opcion, i) => {

        const carta = document.createElement("button");

        carta.type = "button";
        carta.className = "carta-opcion";
        carta.dataset.tecla = i + 1;
        carta.setAttribute("aria-label", `Opción ${i + 1}`);

        const etiqueta = document.createElement("span");
        etiqueta.className = "etiqueta";
        etiqueta.textContent = `Opción ${i + 1}`;

        carta.append(JUEGOS.crearMedia(opcion), etiqueta);

        carta.addEventListener("click", () => responder(carta, opcion));

        opciones.appendChild(carta);
    });
}


function responder(carta, opcion) {

    if (resuelta) {
        return;
    }

    const dialogo = dialogos[ronda];

    if (opcion.id !== dialogo.respuesta.id) {

        fallo = true;

        carta.classList.add("mal");
        carta.disabled = true;
        carta.querySelector(".etiqueta").textContent = opcion.texto;

        mensaje.textContent = `Esa seña significa «${opcion.texto}». Prueba con otra.`;

        return;
    }

    resuelta = true;

    if (!fallo) {
        aciertos++;
        actualizarAciertos();
    }

    carta.classList.add("bien");


    /* Revelamos todo para aprender del diálogo completo. */

    preguntaTexto.textContent =
        `Te dijeron: ${JUEGOS.porId[dialogo.pregunta].emoji} ${JUEGOS.porId[dialogo.pregunta].texto}`;

    opciones.querySelectorAll(".carta-opcion").forEach((c, i) => {
        c.disabled = true;
        c.querySelector(".etiqueta").textContent = opcionesActuales[i].texto;
    });

    mensaje.textContent = `${fallo ? "Esa es." : "¡Muy bien!"} ${dialogo.explicacion}`;

    btnSiguiente.textContent =
        ronda === dialogos.length - 1 ? "Ver resultado →" : "Siguiente →";
    btnSiguiente.classList.remove("hidden");
    btnSiguiente.focus();
}


function siguiente() {

    if (ronda < dialogos.length - 1) {
        ronda++;
        mostrarRonda();
        return;
    }

    terminar();
}


function actualizarAciertos() {
    elAciertos.textContent = `✓ ${aciertos} ${aciertos === 1 ? "acierto" : "aciertos"}`;
}


function terminar() {

    barra.style.width = "100%";

    pregunta.innerHTML = "";
    opciones.innerHTML = "";

    $("estrellas").textContent = JUEGOS.estrellas(aciertos, dialogos.length);

    $("finalTexto").textContent =
        `Respondiste bien ${aciertos} de ${dialogos.length} diálogos al primer intento.`;

    final.classList.remove("hidden");

    ABC.guardarProgreso("presentacionesResponde", (aciertos / dialogos.length) * 100);
}


/* =========================================================
   EVENTOS
========================================================= */

btnSiguiente.addEventListener("click", siguiente);
$("otraVez").addEventListener("click", iniciar);

document.addEventListener("keydown", (evento) => {

    if (!final.classList.contains("hidden")) {
        return;
    }

    const carta = opciones.querySelector(`[data-tecla="${evento.key}"]`);

    if (carta && !carta.disabled) {
        carta.click();
    }
});


JUEGOS.precargarImagenes();
iniciar();
