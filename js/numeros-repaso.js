"use strict";

/* =========================================================
   SIGNBRIDGE - REPASO DE NÚMEROS ALEATORIO (1 AL 20)
========================================================= */

/*
   Del 1 al 10 la seña es una imagen.
   Del 11 al 20 es un video.
*/

const numeros = Array.from(
    { length: 20 },
    (_, i) => i + 1
);

function rutaSena(numero) {

    return numero <= 10
        ? `../images/numeros/${numero}.webp`
        : `../videos/numeros/${numero}.mp4`;
}


/* =========================================================
   VARIABLES
========================================================= */

let ordenRepaso = [];
let ejercicioActual = 0;
let respuestaCorrecta = false;
let cambiando = false;

/* Aciertos al primer intento. */
let aciertos = 0;
let falloEnEsteEjercicio = false;


/* =========================================================
   ELEMENTOS
========================================================= */

const imagenNumero = document.getElementById("imagenNumero");
const videoNumero = document.getElementById("videoNumero");
const contador = document.getElementById("contador");
const opciones = document.getElementById("opciones");
const resultado = document.getElementById("resultado");
const resultadoTitulo = document.getElementById("resultadoTitulo");
const resultadoMensaje = document.getElementById("resultadoMensaje");
const resultadoIcono = document.getElementById("resultadoIcono");
const siguiente = document.getElementById("siguiente");
const barraProgreso = document.getElementById("barraProgreso");
const progresoTexto = document.getElementById("progresoTexto");
const contadorAciertos = document.getElementById("aciertos");
const finalScreen = document.getElementById("finalScreen");
const finalAciertos = document.getElementById("finalAciertos");
const volver = document.getElementById("volver");
const volverInicio = document.getElementById("volverInicio");
const repetir = document.getElementById("repetir");


/* =========================================================
   CREAR ORDEN ALEATORIO
========================================================= */

function mezclar(lista) {

    const copia = [...lista];

    for (let i = copia.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [copia[i], copia[j]] = [copia[j], copia[i]];
    }

    return copia;
}


/* =========================================================
   USUARIO Y PROGRESO
========================================================= */

function obtenerUsuario() {

    try {

        const datos = localStorage.getItem("usuarioSignbridge");

        return datos ? JSON.parse(datos) : null;

    } catch (error) {

        console.error("Error leyendo usuario:", error);

        return null;
    }
}


function guardarUsuario(usuario) {

    localStorage.setItem(
        "usuarioSignbridge",
        JSON.stringify(usuario)
    );

    try {

        const usuarios =
            JSON.parse(localStorage.getItem("usuariosSignbridge")) || [];

        const indice = usuarios.findIndex(
            user => String(user.id) === String(usuario.id)
        );

        if (indice !== -1) {

            usuarios[indice] = usuario;

            localStorage.setItem(
                "usuariosSignbridge",
                JSON.stringify(usuarios)
            );
        }

    } catch (error) {

        console.error("Error guardando usuarios:", error);
    }
}


function guardarProgreso(porcentaje) {

    const usuario = obtenerUsuario();

    if (!usuario) {
        return;
    }

    if (!usuario.progreso) {
        usuario.progreso = {};
    }

    const anterior = Number(usuario.progreso.repasoNumeros) || 0;

    usuario.progreso.repasoNumeros = Math.max(anterior, porcentaje);

    guardarUsuario(usuario);
}


/* =========================================================
   NÚMERO ACTUAL
========================================================= */

function obtenerNumeroActual() {

    return ordenRepaso[ejercicioActual];
}


/* =========================================================
   GENERAR OPCIONES
========================================================= */

/*
   Tres opciones incorrectas: preferimos números
   cercanos (más difícil y más útil para repasar)
   y completamos con cualquiera del 1 al 20.
*/

function generarOpciones() {

    opciones.innerHTML = "";

    const correcta = obtenerNumeroActual();

    const cercanos = mezclar(
        numeros.filter(
            n => n !== correcta && Math.abs(n - correcta) <= 3
        )
    );

    const resto = mezclar(
        numeros.filter(
            n => n !== correcta && !cercanos.includes(n)
        )
    );

    const incorrectas = [...cercanos.slice(0, 2), ...resto].slice(0, 3);

    mezclar([correcta, ...incorrectas]).forEach(numero => {

        const boton = document.createElement("button");

        boton.type = "button";

        boton.className = "option";

        boton.textContent = numero;

        boton.addEventListener(
            "click",
            () => seleccionarRespuesta(boton, numero)
        );

        opciones.appendChild(boton);
    });
}


/* =========================================================
   MOSTRAR SEÑA
========================================================= */

function mostrarSena(numero) {

    const ruta = rutaSena(numero);

    if (numero <= 10) {

        videoNumero.pause();
        videoNumero.removeAttribute("src");
        videoNumero.classList.add("hidden-media");

        imagenNumero.src = ruta;
        imagenNumero.alt = "Seña de un número";
        imagenNumero.classList.remove("hidden-media");

        animarEntrada(imagenNumero);

    } else {

        imagenNumero.classList.add("hidden-media");

        videoNumero.src = ruta;
        videoNumero.classList.remove("hidden-media");

        videoNumero.play().catch(() => {
            /* Algunos navegadores bloquean el autoplay; el video queda listo. */
        });

        animarEntrada(videoNumero);
    }

    precargarSiguiente();
}


function animarEntrada(elemento) {

    elemento.classList.remove("image-out", "image-in");

    void elemento.offsetWidth;

    elemento.classList.add("image-in");
}


/*
   Descargamos la seña del siguiente ejercicio
   mientras el usuario responde.
*/

function precargarSiguiente() {

    const siguienteNumero = ordenRepaso[ejercicioActual + 1];

    if (!siguienteNumero) {
        return;
    }

    if (siguienteNumero <= 10) {

        new Image().src = rutaSena(siguienteNumero);

    } else {

        const link = document.createElement("link");

        link.rel = "prefetch";
        link.href = rutaSena(siguienteNumero);

        document.head.appendChild(link);
    }
}


/* =========================================================
   ACTUALIZAR EJERCICIO
========================================================= */

function actualizarEjercicio() {

    const numero = obtenerNumeroActual();

    respuestaCorrecta = false;

    falloEnEsteEjercicio = false;

    resultado.classList.remove("show");

    siguiente.disabled = true;

    contador.textContent = `${ejercicioActual + 1} / ${ordenRepaso.length}`;

    const progreso = ((ejercicioActual + 1) / ordenRepaso.length) * 100;

    barraProgreso.style.width = `${progreso}%`;

    progresoTexto.textContent = `${Math.round(progreso)}%`;

    imagenNumero.classList.add("image-out");
    videoNumero.classList.add("image-out");

    setTimeout(() => {

        mostrarSena(numero);

        generarOpciones();

    }, 200);
}


function actualizarAciertos() {

    contadorAciertos.textContent =
        `✓ ${aciertos} ${aciertos === 1 ? "acierto" : "aciertos"}`;
}


/* =========================================================
   SELECCIONAR RESPUESTA
========================================================= */

function seleccionarRespuesta(boton, numeroSeleccionado) {

    if (respuestaCorrecta || cambiando) {
        return;
    }

    const correcta = obtenerNumeroActual();

    if (numeroSeleccionado === correcta) {

        respuestaCorrecta = true;

        if (!falloEnEsteEjercicio) {
            aciertos++;
            actualizarAciertos();
        }

        boton.classList.add("correct");

        document.querySelectorAll(".option").forEach(opcion => {
            opcion.disabled = true;
        });

        resultadoIcono.textContent = "✓";

        resultadoTitulo.textContent = "¡Correcto!";

        resultadoMensaje.textContent =
            `Es el número ${correcta}. ¡Muy bien!`;

        resultado.classList.add("show");

        siguiente.disabled = false;

        siguiente.focus();

        guardarProgreso(
            Math.round(((ejercicioActual + 1) / ordenRepaso.length) * 100)
        );

    } else {

        falloEnEsteEjercicio = true;

        boton.classList.add("incorrect");

        boton.disabled = true;

        resultadoIcono.textContent = "✕";

        resultadoTitulo.textContent = "Inténtalo de nuevo";

        resultadoMensaje.textContent =
            `No es el ${numeroSeleccionado}. Observa otra vez la seña.`;

        resultado.classList.add("show");
    }
}


/* =========================================================
   SIGUIENTE
========================================================= */

function siguienteEjercicio() {

    if (!respuestaCorrecta || cambiando) {
        return;
    }

    if (ejercicioActual < ordenRepaso.length - 1) {

        cambiando = true;

        ejercicioActual++;

        setTimeout(() => {

            actualizarEjercicio();

            cambiando = false;

        }, 150);

        return;
    }

    completarRepaso();
}


/* =========================================================
   COMPLETAR Y REPETIR
========================================================= */

function completarRepaso() {

    videoNumero.pause();

    guardarProgreso(100);

    finalAciertos.textContent = `${aciertos} / ${ordenRepaso.length}`;

    finalScreen.classList.add("show");
}


function iniciarRepaso() {

    /*
       Cada vez que se entra al repaso
       se crea un orden completamente nuevo.
    */

    ordenRepaso = mezclar(numeros);

    ejercicioActual = 0;

    aciertos = 0;

    actualizarAciertos();

    finalScreen.classList.remove("show");

    actualizarEjercicio();
}


/* =========================================================
   NAVEGACIÓN SUAVE
========================================================= */

function navegarSuave(destino) {

    if (document.body.classList.contains("page-exiting")) {
        return;
    }

    document.body.classList.add("page-exiting");

    setTimeout(() => {
        window.location.href = destino;
    }, 250);
}


/* =========================================================
   EVENTOS
========================================================= */

volver.addEventListener("click", () => navegarSuave("numeros-cursos.html"));

volverInicio.addEventListener("click", () => navegarSuave("numeros-cursos.html"));

repetir.addEventListener("click", iniciarRepaso);

siguiente.addEventListener("click", siguienteEjercicio);


/* Responder con el teclado: 1-4 elige la opción, Enter avanza. */

document.addEventListener("keydown", (evento) => {

    if (finalScreen.classList.contains("show")) {
        return;
    }

    const indice = Number(evento.key) - 1;

    const botones = opciones.querySelectorAll(".option");

    if (indice >= 0 && indice < botones.length && !botones[indice].disabled) {
        botones[indice].click();
    }
});


/* =========================================================
   INICIO
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    iniciarRepaso();

    requestAnimationFrame(() => {
        document.body.classList.add("page-ready");
    });
});
