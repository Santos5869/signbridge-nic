"use strict";

/* =========================================================
   SIGNBRIDGE - RETO DE ABECEDARIO
   60 segundos, 3 vidas y tres tipos de pregunta:
   seña → letra, letra → seña y verdadero / falso.
========================================================= */

const TIEMPO_INICIAL = 60;
const SEGUNDOS_POR_ACIERTO = 1;
const VIDAS_INICIALES = 3;
const PUNTOS_BASE = 10;
const MULTIPLICADOR_MAXIMO = 4;
const ACIERTOS_PARA_SUBIR = 3;
const CLAVE_RECORD = "signbridge_reto_record";

/* Con 20 aciertos en una partida el curso cuenta como completo. */
const ACIERTOS_META = 20;


/* =========================================================
   ESTADO
========================================================= */

let puntos = 0;
let vidas = VIDAS_INICIALES;
let racha = 0;
let mejorRacha = 0;
let aciertos = 0;
let respuestas = 0;
let tiempoRestante = TIEMPO_INICIAL;
let finTiempo = 0;
let reloj = null;
let preguntaActual = null;
let ultimaLetra = null;
let bloqueado = false;

/* Letras falladas, para recomendar qué repasar. */
let falladas = new Set();


/* =========================================================
   ELEMENTOS
========================================================= */

const $ = (id) => document.getElementById(id);

const pantallaInicio = $("inicio");
const pantallaJuego = $("juego");
const pantallaFin = $("fin");
const record = $("record");
const elPuntos = $("puntos");
const elRacha = $("racha");
const elVidas = $("vidas");
const tiempoBarra = $("tiempoBarra");
const tiempoTexto = $("tiempoTexto");
const tarjeta = $("tarjeta");
const tipo = $("tipo");
const pregunta = $("pregunta");
const sena = $("sena");
const opciones = $("opciones");
const flotante = $("flotante");


function multiplicador() {
    return Math.min(MULTIPLICADOR_MAXIMO, 1 + Math.floor(racha / ACIERTOS_PARA_SUBIR));
}


function mostrarPantalla(pantalla) {

    for (const p of [pantallaInicio, pantallaJuego, pantallaFin]) {
        p.classList.toggle("hidden", p !== pantalla);
    }
}


/* =========================================================
   PREGUNTAS
========================================================= */

function letraNueva() {

    let letra;

    do {
        letra = ABC.azar(ABC.LETRAS);
    } while (letra === ultimaLetra);

    ultimaLetra = letra;

    return letra;
}


function distractores(letra, cantidad) {
    return ABC.mezclar(ABC.LETRAS.filter(l => l !== letra)).slice(0, cantidad);
}


function crearPregunta() {

    const letra = letraNueva();

    const tipos = ["sena-letra", "letra-sena", "verdadero-falso"];

    const tipoPregunta = ABC.azar(tipos);

    if (tipoPregunta === "sena-letra") {

        return {
            tipo: tipoPregunta,
            letra,
            titulo: "¿QUÉ LETRA ES?",
            texto: "",
            imagen: letra,
            opciones: ABC.mezclar([letra, ...distractores(letra, 3)]),
            correcta: letra
        };
    }

    if (tipoPregunta === "letra-sena") {

        return {
            tipo: tipoPregunta,
            letra,
            titulo: "ELIGE LA SEÑA",
            texto: `Letra ${letra}`,
            imagen: null,
            opciones: ABC.mezclar([letra, ...distractores(letra, 3)]),
            correcta: letra
        };
    }

    /* Verdadero / falso: la mitad de las veces la seña no coincide. */

    const coincide = Math.random() < 0.5;
    const mostrada = coincide ? letra : distractores(letra, 1)[0];

    return {
        tipo: tipoPregunta,
        letra,
        titulo: "¿VERDADERO O FALSO?",
        texto: `¿Esta seña es la ${letra}?`,
        imagen: mostrada,
        opciones: ["SÍ", "NO"],
        correcta: coincide ? "SÍ" : "NO"
    };
}


function mostrarPregunta() {

    preguntaActual = crearPregunta();

    bloqueado = false;

    const p = preguntaActual;

    tipo.textContent = p.titulo;
    pregunta.textContent = p.texto;
    pregunta.classList.toggle("hidden", !p.texto);

    if (p.imagen) {
        sena.src = ABC.rutaLetra(p.imagen);
        sena.classList.remove("hidden");
    } else {
        sena.classList.add("hidden");
    }

    opciones.className = "answers " + p.tipo;
    opciones.innerHTML = "";

    p.opciones.forEach((opcion, i) => {

        const boton = document.createElement("button");

        boton.type = "button";
        boton.className = "answer";
        boton.dataset.tecla = i + 1;

        if (p.tipo === "letra-sena") {

            const img = document.createElement("img");
            img.src = ABC.rutaLetra(opcion);
            img.alt = `Opción ${i + 1}`;
            boton.appendChild(img);

        } else {

            boton.textContent = opcion;
        }

        boton.addEventListener("click", () => responder(boton, opcion));

        opciones.appendChild(boton);
    });

    tarjeta.classList.remove("entra");
    void tarjeta.offsetWidth;
    tarjeta.classList.add("entra");
}


/* =========================================================
   RESPONDER
========================================================= */

function responder(boton, opcion) {

    if (bloqueado) {
        return;
    }

    bloqueado = true;

    respuestas++;

    const p = preguntaActual;
    const correcto = opcion === p.correcta;

    if (correcto) {

        racha++;
        aciertos++;
        mejorRacha = Math.max(mejorRacha, racha);

        const ganados = PUNTOS_BASE * multiplicador();

        puntos += ganados;

        finTiempo += SEGUNDOS_POR_ACIERTO * 1000;

        boton.classList.add("right");

        mostrarFlotante(`+${ganados}`, "good");

    } else {

        racha = 0;
        vidas--;

        falladas.add(p.letra);

        boton.classList.add("wrong");

        /* Marcamos la correcta para que se aprenda del error. */
        opciones.querySelectorAll(".answer").forEach((b, i) => {
            if (p.opciones[i] === p.correcta) {
                b.classList.add("right");
            }
        });

        tarjeta.classList.remove("sacude");
        void tarjeta.offsetWidth;
        tarjeta.classList.add("sacude");

        mostrarFlotante("−❤️", "bad");
    }

    actualizarMarcador();

    if (vidas <= 0) {
        setTimeout(terminar, 700);
        return;
    }

    setTimeout(mostrarPregunta, correcto ? 450 : 1000);
}


function mostrarFlotante(texto, clase) {

    flotante.textContent = texto;
    flotante.className = "float-points " + clase;

    void flotante.offsetWidth;

    flotante.classList.add("show");
}


function actualizarMarcador() {

    elPuntos.textContent = puntos;
    elRacha.textContent = `x${multiplicador()}`;
    elRacha.parentElement.classList.toggle("hot", multiplicador() > 1);
    elVidas.textContent = "❤️".repeat(Math.max(0, vidas)) + "🖤".repeat(VIDAS_INICIALES - Math.max(0, vidas));
}


/* =========================================================
   RELOJ
   Usamos la hora real para que el tiempo no se desfase.
========================================================= */

function tic() {

    tiempoRestante = Math.max(0, (finTiempo - performance.now()) / 1000);

    const porcentaje = Math.min(100, (tiempoRestante / TIEMPO_INICIAL) * 100);

    tiempoBarra.style.width = `${porcentaje}%`;
    tiempoBarra.classList.toggle("low", tiempoRestante <= 10);

    tiempoTexto.textContent = Math.ceil(tiempoRestante);

    if (tiempoRestante <= 0) {
        terminar();
        return;
    }

    reloj = requestAnimationFrame(tic);
}


/* =========================================================
   INICIO Y FIN
========================================================= */

function jugar() {

    puntos = 0;
    vidas = VIDAS_INICIALES;
    racha = 0;
    mejorRacha = 0;
    aciertos = 0;
    respuestas = 0;
    falladas = new Set();
    ultimaLetra = null;

    flotante.className = "float-points";

    actualizarMarcador();

    mostrarPantalla(pantallaJuego);

    mostrarPregunta();

    finTiempo = performance.now() + TIEMPO_INICIAL * 1000;

    cancelAnimationFrame(reloj);
    reloj = requestAnimationFrame(tic);
}


function terminar() {

    if (pantallaFin.classList.contains("hidden") === false) {
        return;
    }

    cancelAnimationFrame(reloj);

    bloqueado = true;

    const anterior = ABC.leerLocal(CLAVE_RECORD, 0);
    const esRecord = puntos > anterior;

    if (esRecord) {
        ABC.guardarLocal(CLAVE_RECORD, puntos);
    }

    mostrarRecord();

    $("nuevoRecord").classList.toggle("hidden", !esRecord || puntos === 0);
    $("puntosFinal").textContent = puntos;
    $("aciertosFinal").textContent = aciertos;
    $("precisionFinal").textContent =
        respuestas ? `${Math.round((aciertos / respuestas) * 100)}%` : "0%";
    $("rachaFinal").textContent = mejorRacha;

    $("repasar").textContent = falladas.size
        ? `Repasa estas letras: ${[...falladas].sort().join(", ")}`
        : "¡Sin errores! Increíble.";

    ABC.guardarProgreso("retoAbecedario", (aciertos / ACIERTOS_META) * 100);

    mostrarPantalla(pantallaFin);
}


function mostrarRecord() {
    record.textContent = `🏆 ${ABC.leerLocal(CLAVE_RECORD, 0)}`;
}


/* =========================================================
   EVENTOS
========================================================= */

$("jugar").addEventListener("click", jugar);
$("otraVez").addEventListener("click", jugar);


/* Teclas 1-4 para responder. */

document.addEventListener("keydown", (evento) => {

    if (pantallaJuego.classList.contains("hidden")) {
        return;
    }

    const boton = opciones.querySelector(`[data-tecla="${evento.key}"]`);

    if (boton) {
        boton.click();
    }
});


/* Si cambias de pestaña, el reto termina para no hacer trampa. */

document.addEventListener("visibilitychange", () => {

    if (document.hidden && !pantallaJuego.classList.contains("hidden")) {
        terminar();
    }
});


mostrarRecord();

/* Bajamos las 26 imágenes (~2 MB) mientras se leen las reglas. */
ABC.precargar(ABC.LETRAS);
