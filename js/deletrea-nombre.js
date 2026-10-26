"use strict";

/* =========================================================
   SIGNBRIDGE - DELETREA TU NOMBRE
   Aprende: recorre tu nombre seña por seña.
   Pruébate: identifica cada letra de tu nombre.
========================================================= */

const CLAVE_NOMBRE = "signbridge_nombre_deletreo";


/* =========================================================
   ESTADO
========================================================= */

/* Letras del nombre sin espacios, con su posición en las fichas. */
let letras = [];
let indice = 0;
let reproduciendo = null;
let modo = "ver";

/* Práctica */
let pendientes = [];
let posicionPractica = 0;
let fallosPractica = 0;
let resuelta = false;


/* =========================================================
   ELEMENTOS
========================================================= */

const $ = (id) => document.getElementById(id);

const formNombre = $("formNombre");
const inputNombre = $("nombre");
const avisoNombre = $("avisoNombre");
const tabVer = $("tabVer");
const tabPracticar = $("tabPracticar");
const modoVer = $("modoVer");
const modoPracticar = $("modoPracticar");
const btnAnterior = $("anterior");
const btnSiguiente = $("siguiente");
const btnReproducir = $("reproducir");
const velocidad = $("velocidad");
const velocidadTexto = $("velocidadTexto");
const preguntaPractica = $("preguntaPractica");
const opciones = $("opciones");
const mensaje = $("mensaje");
const btnOtraVez = $("otraVez");
const carne = $("carne");
const senaGrande = $("senaGrande");
const sinFoto = $("sinFoto");
const letraFoto = $("letraFoto");
const fichas = $("fichas");
const idNumero = $("idNumero");


/* =========================================================
   CREAR CARNÉ
========================================================= */

function crearCarne(texto) {

    const limpio = ABC.limpiarTexto(texto);

    if (!limpio) {
        avisoNombre.textContent = "Escribe al menos una letra.";
        avisoNombre.classList.add("error");
        return;
    }

    avisoNombre.textContent = limpio.includes("Ñ")
        ? "La Ñ aún no tiene foto; la verás marcada en tu carné."
        : "Solo letras. Las tildes se ignoran.";

    avisoNombre.classList.remove("error");

    ABC.guardarLocal(CLAVE_NOMBRE, texto);

    detenerReproduccion();

    letras = limpio.replace(/ /g, "").split("");
    indice = 0;

    ABC.precargar(letras);

    dibujarFichas(limpio);

    /* Número del carné: sale del nombre, siempre el mismo. */
    let suma = 0;
    for (const c of limpio) {
        suma = (suma * 31 + c.charCodeAt(0)) % 10000;
    }
    idNumero.textContent = `N.º ${String(suma).padStart(4, "0")}`;

    carne.classList.remove("nuevo");
    void carne.offsetWidth;
    carne.classList.add("nuevo");

    if (modo === "practicar") {
        iniciarPractica();
    } else {
        mostrarLetra(0);
    }
}


function dibujarFichas(limpio) {

    fichas.innerHTML = "";

    let posicion = 0;

    for (const caracter of limpio) {

        if (caracter === " ") {
            const espacio = document.createElement("span");
            espacio.className = "chip-space";
            fichas.appendChild(espacio);
            continue;
        }

        const ficha = document.createElement("button");
        const miPosicion = posicion;

        ficha.type = "button";
        ficha.className = "chip";
        ficha.textContent = caracter;
        ficha.dataset.posicion = miPosicion;

        if (!ABC.tieneImagen(caracter)) {
            ficha.classList.add("sin-foto");
        }

        ficha.addEventListener("click", () => {
            if (modo !== "ver") {
                return;
            }
            detenerReproduccion();
            mostrarLetra(miPosicion);
        });

        fichas.appendChild(ficha);

        posicion++;
    }
}


function fichaEn(posicion) {
    return fichas.querySelector(`.chip[data-posicion="${posicion}"]`);
}


/* =========================================================
   FOTO DEL CARNÉ
========================================================= */

function pintarFoto(letra, mostrarLetraEscrita) {

    if (ABC.tieneImagen(letra)) {

        senaGrande.src = ABC.rutaLetra(letra);
        senaGrande.alt = mostrarLetraEscrita ? `Seña de la letra ${letra}` : "Seña para identificar";
        senaGrande.classList.remove("hidden");
        sinFoto.classList.add("hidden");

        senaGrande.classList.remove("aparecer");
        void senaGrande.offsetWidth;
        senaGrande.classList.add("aparecer");

    } else {

        senaGrande.classList.add("hidden");
        sinFoto.classList.remove("hidden");
        sinFoto.querySelector("strong").textContent = letra;
    }

    letraFoto.textContent = mostrarLetraEscrita ? letra : "?";
}


/* =========================================================
   MODO APRENDER
========================================================= */

function mostrarLetra(i) {

    if (letras.length === 0) {
        return;
    }

    indice = Math.max(0, Math.min(letras.length - 1, i));

    pintarFoto(letras[indice], true);

    fichas.querySelectorAll(".chip").forEach(ficha => {
        ficha.classList.toggle("current", Number(ficha.dataset.posicion) === indice);
        ficha.classList.remove("oculta", "hecha");
    });

    btnAnterior.disabled = indice === 0;
    btnSiguiente.disabled = indice === letras.length - 1;
}


function alternarReproduccion() {

    if (reproduciendo) {
        detenerReproduccion();
        return;
    }

    btnReproducir.textContent = "⏸ Pausar";

    mostrarLetra(0);

    const paso = () => {

        if (indice >= letras.length - 1) {
            detenerReproduccion();
            return;
        }

        mostrarLetra(indice + 1);

        reproduciendo = setTimeout(paso, Number(velocidad.value));
    };

    reproduciendo = setTimeout(paso, Number(velocidad.value));
}


function detenerReproduccion() {

    clearTimeout(reproduciendo);

    reproduciendo = null;

    btnReproducir.textContent = "▶ Reproducir";
}


function actualizarTextoVelocidad() {

    const valor = Number(velocidad.value);

    velocidadTexto.textContent =
        valor <= 800 ? "Rápida" :
        valor >= 1600 ? "Lenta" : "Normal";
}


/* =========================================================
   MODO PRUÉBATE
========================================================= */

/*
   Recorremos el nombre en orden: aparece la seña de cada
   posición y eliges la letra. La Ñ (sin foto) se salta.
*/

function iniciarPractica() {

    detenerReproduccion();

    pendientes = letras
        .map((letra, posicion) => ({ letra, posicion }))
        .filter(item => ABC.tieneImagen(item.letra));

    posicionPractica = 0;

    btnOtraVez.classList.add("hidden");

    fichas.querySelectorAll(".chip").forEach(ficha => {
        ficha.classList.remove("current", "hecha");
        ficha.classList.toggle("oculta", !ficha.classList.contains("sin-foto"));
    });

    siguientePregunta();
}


function siguientePregunta() {

    if (posicionPractica >= pendientes.length) {
        terminarPractica();
        return;
    }

    const { letra, posicion } = pendientes[posicionPractica];

    resuelta = false;
    fallosPractica = 0;

    mensaje.textContent = "";
    mensaje.className = "feedback";

    preguntaPractica.textContent =
        `Letra ${posicionPractica + 1} de ${pendientes.length}: ¿qué letra es esta seña?`;

    pintarFoto(letra, false);

    fichas.querySelectorAll(".chip").forEach(ficha => ficha.classList.remove("current"));
    const ficha = fichaEn(posicion);
    if (ficha) {
        ficha.classList.add("current");
    }


    /* Opciones: la correcta y 3 al azar distintas. */

    const otras = ABC.mezclar(ABC.LETRAS.filter(l => l !== letra)).slice(0, 3);

    opciones.innerHTML = "";

    ABC.mezclar([letra, ...otras]).forEach(opcion => {

        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "letter-option";
        boton.textContent = opcion;

        boton.addEventListener("click", () => responder(boton, opcion));

        opciones.appendChild(boton);
    });
}


function responder(boton, opcion) {

    if (resuelta) {
        return;
    }

    const { letra, posicion } = pendientes[posicionPractica];

    if (opcion !== letra) {

        fallosPractica++;

        boton.classList.add("wrong");
        boton.disabled = true;

        mensaje.textContent = "No es esa. Fíjate en la posición de los dedos.";
        mensaje.className = "feedback bad";

        return;
    }

    resuelta = true;

    boton.classList.add("right");

    opciones.querySelectorAll("button").forEach(b => { b.disabled = true; });

    letraFoto.textContent = letra;

    const ficha = fichaEn(posicion);
    if (ficha) {
        ficha.classList.remove("oculta");
        ficha.classList.add("hecha");
    }

    mensaje.textContent = fallosPractica === 0 ? "¡Exacto!" : "¡Bien! Esa es.";
    mensaje.className = "feedback good";

    ABC.guardarProgreso(
        "deletreaNombre",
        ((posicionPractica + 1) / pendientes.length) * 100
    );

    posicionPractica++;

    setTimeout(siguientePregunta, 700);
}


function terminarPractica() {

    opciones.innerHTML = "";

    fichas.querySelectorAll(".chip").forEach(ficha => {
        ficha.classList.remove("current", "oculta");
    });

    preguntaPractica.textContent = "🎉 ¡Ya sabes deletrear tu nombre!";

    mensaje.textContent = "Tu carné está completo.";
    mensaje.className = "feedback good";

    btnOtraVez.classList.remove("hidden");

    carne.classList.add("completo");

    ABC.guardarProgreso("deletreaNombre", 100);
}


/* =========================================================
   CAMBIO DE MODO
========================================================= */

function cambiarModo(nuevo) {

    modo = nuevo;

    const ver = nuevo === "ver";

    tabVer.classList.toggle("active", ver);
    tabPracticar.classList.toggle("active", !ver);
    tabVer.setAttribute("aria-selected", String(ver));
    tabPracticar.setAttribute("aria-selected", String(!ver));

    modoVer.classList.toggle("hidden", !ver);
    modoPracticar.classList.toggle("hidden", ver);

    carne.classList.remove("completo");

    if (ver) {
        mostrarLetra(0);
    } else {
        iniciarPractica();
    }
}


/* =========================================================
   EVENTOS
========================================================= */

formNombre.addEventListener("submit", (evento) => {
    evento.preventDefault();
    crearCarne(inputNombre.value);
});

tabVer.addEventListener("click", () => cambiarModo("ver"));
tabPracticar.addEventListener("click", () => cambiarModo("practicar"));
btnAnterior.addEventListener("click", () => { detenerReproduccion(); mostrarLetra(indice - 1); });
btnSiguiente.addEventListener("click", () => { detenerReproduccion(); mostrarLetra(indice + 1); });
btnReproducir.addEventListener("click", alternarReproduccion);
velocidad.addEventListener("input", actualizarTextoVelocidad);
btnOtraVez.addEventListener("click", () => { carne.classList.remove("completo"); iniciarPractica(); });


/* =========================================================
   INICIO
   Usamos el último nombre escrito o el del usuario.
========================================================= */

const usuario = ABC.obtenerUsuario();

const nombreInicial =
    ABC.leerLocal(CLAVE_NOMBRE, "") ||
    (usuario && usuario.nombre ? String(usuario.nombre).split(" ")[0] : "") ||
    "SignBridge";

inputNombre.value = nombreInicial;

actualizarTextoVelocidad();

crearCarne(nombreInicial);
