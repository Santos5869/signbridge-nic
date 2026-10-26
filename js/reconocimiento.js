/* =========================================================
   SIGNBRIDGE
   RECONOCIMIENTO DE SEÑAS A-Z
   ========================================================= */

"use strict";

/* =========================================================
   ELEMENTOS HTML
   ========================================================= */

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas ? canvas.getContext("2d") : null;

const startCameraButton = document.getElementById("startCamera");
const stopCameraButton = document.getElementById("stopCamera");

const cameraMessage = document.getElementById("cameraMessage");
const cameraStatus = document.getElementById("cameraStatus");

const currentSignElement = document.getElementById("currentSign");
const signReferenceImage = document.getElementById("signReferenceImage");

const practiceResult = document.getElementById("practiceResult");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");

const progress = document.getElementById("progress");
const progressPercent = document.getElementById("progressPercent");
const progressText = document.getElementById("progressText");

const sampleCount = document.getElementById("sampleCount");
const captureButton = document.getElementById("captureButton");
const captureMessage = document.getElementById("captureMessage");


/* =========================================================
   ABECEDARIO
   NO INCLUIMOS Ñ
   ========================================================= */

const letras = [
    "A", "B", "C", "D", "E", "F",
    "G", "H", "I", "J", "K", "L",
    "M", "N", "O", "P", "Q", "R",
    "S", "T", "U", "V", "W", "X",
    "Y", "Z"
];


/* =========================================================
   ESTADO
   ========================================================= */

let indiceActual = 0;

let cameraActiva = false;

let procesando = false;

let animationFrame = null;

let stream = null;

/* Última mano detectada, sin espejar, para capturar muestras. */
let ultimaManoCruda = null;

let aspectoVideo = 16 / 9;

let ultimoTiempoVideo = -1;

let ultimoEnvio = 0;


/* =========================================================
   CONTROL DEL RECONOCIMIENTO
   ========================================================= */

/*
   No aceptamos una postura por un solo frame.
*/

const FRAMES_NECESARIOS = 6;


/*
   Distancia máxima (en largos de palma) para aceptar
   una postura. Menor = más estricto.
*/

const UMBRAL_RECONOCIMIENTO = 0.28;


/*
   La letra pedida tiene que ganarle a todas las demás
   letras grabadas. Este margen permite empates cercanos
   (1.08 = hasta 8% peor que la mejor otra letra).
*/

const MARGEN_OTRAS_LETRAS = 1.08;


/*
   Alineamos la rotación de la mano para que una muñeca
   un poco inclinada no cuente como error. Pasados estos
   grados sí penalizamos, porque hay letras que se
   distinguen por la orientación de la mano.
*/

const GIRO_TOLERADO = 30;

const PENALIZACION_POR_GRADO = 0.004;


/*
   Suavizado entre frames para que los puntos
   no tiemblen. 0 = sin suavizar, 0.9 = muy suave.
*/

const SUAVIZADO = 0.5;


/*
   Un frame malo resta frames en vez de
   reiniciar todo el conteo.
*/

const PENALIZACION_FALLO = 2;


/*
   MediaPipe no necesita más de ~30 imágenes por
   segundo; procesar más solo calienta el equipo.
*/

const INTERVALO_MINIMO_MS = 33;


let framesCoincidentes = 0;

let letraConfirmada = false;

let manoSuavizada = null;


/* =========================================================
   MEDIAPIPE
   ========================================================= */

const MEDIAPIPE_HANDS_URL =
    "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/";

let modeloListo = null;

if (typeof Hands === "undefined") {

    console.error("MediaPipe Hands no está cargado.");

} else {

    window.signBridgeHands = new Hands({
        locateFile: (file) => MEDIAPIPE_HANDS_URL + file
    });

    /*
       Una sola mano: comparamos también contra la
       postura reflejada, así sirve la izquierda o la
       derecha, y el modelo va el doble de rápido.
    */

    window.signBridgeHands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
    });

    window.signBridgeHands.onResults(recibirResultados);
}


/*
   Descargamos el modelo apenas carga la página, para
   que "Activar cámara" responda al instante.
*/

function precargarModelo() {

    if (!window.signBridgeHands || modeloListo) {
        return modeloListo;
    }

    modeloListo = window.signBridgeHands
        .initialize()
        .catch((error) => {
            console.error("No se pudo cargar el modelo de manos:", error);
            modeloListo = null;
        });

    return modeloListo;
}


/* =========================================================
   GEOMETRÍA DE LA MANO
   ========================================================= */

/*
   Recibe 21 puntos ya centrados en la muñeca y escalados
   (largo de palma = 1). Devuelve los puntos girados para
   que la palma apunte hacia arriba y el ángulo original.
*/

function alinearMano(puntos, espejo = false) {

    const base = espejo
        ? puntos.map((p) => ({ x: -p.x, y: p.y, z: p.z || 0 }))
        : puntos;

    const palma = base[9];

    /* Ángulo de la palma respecto a "arriba" (0, -1). */
    const angulo = Math.atan2(palma.x, -palma.y);

    const cos = Math.cos(angulo);
    const sin = Math.sin(angulo);

    const alineados = base.map((p) => ({
        x: p.x * cos + p.y * sin,
        y: -p.x * sin + p.y * cos,
        z: p.z || 0
    }));

    return {
        puntos: alineados,
        angulo: angulo * 180 / Math.PI
    };
}


function normalizarMano(puntos, aspecto) {

    if (!Array.isArray(puntos) || puntos.length !== 21) {
        return null;
    }

    if (typeof window.normalizarPostura === "function") {
        return window.normalizarPostura(puntos, aspecto);
    }

    return null;
}


function diferenciaAngulo(a, b) {

    let d = Math.abs(a - b) % 360;

    return d > 180 ? 360 - d : d;
}


function distanciaPosturas(actual, muestra) {

    let suma = 0;

    for (let i = 0; i < 21; i++) {

        const a = actual.puntos[i];
        const b = muestra.puntos[i];

        const dx = a.x - b.x;
        const dy = a.y - b.y;

        /*
           La profundidad (z) de MediaPipe es poco
           precisa, por eso pesa la mitad.
        */

        const dz = (a.z - b.z) * 0.5;

        suma += Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    const giro = Math.max(
        0,
        diferenciaAngulo(actual.angulo, muestra.angulo) - GIRO_TOLERADO
    );

    return suma / 21 + giro * PENALIZACION_POR_GRADO;
}


/* =========================================================
   POSTURAS GUARDADAS
   ========================================================= */

function obtenerPosturasGuardadas(letra) {

    letra = String(letra).trim().toUpperCase();

    /*
       Posturas incluidas con la página
       (posturas-base.js). Así funciona en
       cualquier navegador, sin grabar nada.
    */

    const base =
        window.POSTURAS_BASE && Array.isArray(window.POSTURAS_BASE[letra])
            ? window.POSTURAS_BASE[letra]
            : [];

    const locales =
        typeof window.obtenerPosturas === "function"
            ? window.obtenerPosturas(letra)
            : [];

    return [...locales, ...base];
}


/*
   Preparar las muestras (corregir formato, alinear y
   reflejar) cuesta; lo hacemos una vez por letra y lo
   guardamos aquí.
*/

let cacheMuestras = {};

function muestrasDeLetra(letra) {

    if (cacheMuestras[letra]) {
        return cacheMuestras[letra];
    }

    const preparadas = [];

    for (const muestra of obtenerPosturasGuardadas(letra)) {

        const puntos =
            typeof window.prepararMuestra === "function"
                ? window.prepararMuestra(muestra)
                : null;

        if (!puntos) {
            continue;
        }

        preparadas.push(alinearMano(puntos, false));
        preparadas.push(alinearMano(puntos, true));
    }

    cacheMuestras[letra] = preparadas;

    return preparadas;
}


function olvidarMuestras() {
    cacheMuestras = {};
}


function mejorDistancia(actual, muestras) {

    let mejor = Infinity;

    for (const muestra of muestras) {

        const d = distanciaPosturas(actual, muestra);

        if (d < mejor) {
            mejor = d;
        }
    }

    return mejor;
}


/* =========================================================
   COMPARAR MANO CON LETRA
   ========================================================= */

function compararConLetra(puntos, letra, aspecto) {

    const vacio = {
        coincide: false,
        distancia: Infinity,
        cantidad: 0,
        similitud: 0
    };

    const normalizados = normalizarMano(puntos, aspecto);

    if (!normalizados) {
        return vacio;
    }

    const muestras = muestrasDeLetra(letra);

    if (muestras.length === 0) {
        return vacio;
    }

    const actual = alinearMano(normalizados, false);

    const distancia = mejorDistancia(actual, muestras);


    /*
       ¿Se parece más a otra letra?
    */

    let otraMejor = Infinity;

    for (const otra of letras) {

        if (otra === letra) {
            continue;
        }

        const otrasMuestras = muestrasDeLetra(otra);

        if (otrasMuestras.length > 0) {
            otraMejor = Math.min(otraMejor, mejorDistancia(actual, otrasMuestras));
        }
    }

    const ganaAOtras = distancia <= otraMejor * MARGEN_OTRAS_LETRAS;

    const similitud = Math.max(
        0,
        Math.min(1, 1 - distancia / (UMBRAL_RECONOCIMIENTO * 2))
    );

    return {
        coincide: distancia <= UMBRAL_RECONOCIMIENTO && ganaAOtras,
        distancia,
        cantidad: muestras.length / 2,
        similitud
    };
}


/* =========================================================
   RECONOCER LETRA ACTUAL
   ========================================================= */

function reconocerLetraActual(puntos) {

    const letra = letras[indiceActual];

    if (!letra || letraConfirmada) {
        return;
    }

    const resultado = compararConLetra(puntos, letra, aspectoVideo);


    /*
       No hay posturas.
    */

    if (resultado.cantidad === 0) {

        framesCoincidentes = 0;

        mostrarResultado(
            "warning",
            `Faltan posturas para ${letra}`,
            `No hay posturas guardadas para la letra ${letra}. Captura algunas muestras abajo.`
        );

        return;
    }

    const porcentaje = Math.round(resultado.similitud * 100);


    /*
       POSTURA CORRECTA
    */

    if (resultado.coincide) {

        framesCoincidentes++;

        actualizarEstado(`● Postura ${letra} detectada`, "#39df9b");

        mostrarResultado(
            "success",
            `Postura correcta: ${letra}`,
            `Mantén la posición... ${Math.min(framesCoincidentes, FRAMES_NECESARIOS)}/${FRAMES_NECESARIOS}`
        );

        /*
           Confirmamos solamente después
           de varios frames seguidos.
        */

        if (framesCoincidentes >= FRAMES_NECESARIOS) {
            confirmarLetra();
        }

    } else {

        framesCoincidentes = Math.max(0, framesCoincidentes - PENALIZACION_FALLO);

        actualizarEstado("● Mano detectada", "#f5b942");

        mostrarResultado(
            "warning",
            `Aún no es la ${letra} · ${porcentaje}%`,
            porcentaje >= 60
                ? "¡Casi! Ajusta un poco los dedos como en la imagen."
                : "Coloca tu mano como aparece en la imagen de referencia."
        );
    }
}


/* =========================================================
   CONFIRMAR LETRA
   ========================================================= */

function confirmarLetra() {

    if (letraConfirmada) {
        return;
    }

    letraConfirmada = true;

    const letra = letras[indiceActual];

    framesCoincidentes = 0;

    actualizarEstado(`✓ Letra ${letra} correcta`, "#39df9b");

    mostrarResultado(
        "success",
        `✓ ¡Correcto! Es la ${letra}`,
        "Muy bien. Preparando la siguiente letra..."
    );

    /*
       NO apagamos la cámara.
    */

    setTimeout(siguienteLetra, 900);
}


/* =========================================================
   SIGUIENTE LETRA
   ========================================================= */

function siguienteLetra() {

    indiceActual++;

    framesCoincidentes = 0;

    letraConfirmada = false;


    /*
       TERMINÓ EL ABECEDARIO
    */

    if (indiceActual >= letras.length) {

        indiceActual = letras.length - 1;

        letraConfirmada = true;

        actualizarEstado("✓ Abecedario completado", "#39df9b");

        mostrarResultado(
            "success",
            "🎉 ¡Abecedario completado!",
            "Has completado todas las letras correctamente."
        );

        actualizarProgreso();

        return;
    }

    mostrarSenaActual();
}


/* =========================================================
   MOSTRAR LETRA ACTUAL
   ========================================================= */

function mostrarSenaActual() {

    const letra = letras[indiceActual];

    if (!letra) {
        return;
    }

    if (currentSignElement) {
        currentSignElement.textContent = letra;
    }

    const titulo = document.querySelector(".reference-title h3");

    if (titulo) {
        titulo.textContent = `Letra ${letra}`;
    }

    const descripcion = document.querySelector(".reference-title p");

    if (descripcion) {
        descripcion.textContent =
            "Observa la referencia y reproduce la posición de la mano.";
    }


    /*
       Imagen de referencia. Precargamos también la
       siguiente para que el cambio sea instantáneo.
    */

    if (signReferenceImage) {
        signReferenceImage.src = `../images/abecedario/${letra}.png`;
        signReferenceImage.alt = `Seña de la letra ${letra}`;
    }

    const siguiente = letras[indiceActual + 1];

    if (siguiente) {
        new Image().src = `../images/abecedario/${siguiente}.png`;
    }

    actualizarProgreso();
    actualizarContadorMuestras();


    /*
       Reiniciamos únicamente el reconocimiento.
       LA CÁMARA NO SE APAGA.
    */

    framesCoincidentes = 0;

    letraConfirmada = false;

    const cantidad = muestrasDeLetra(letra).length / 2;

    if (cantidad === 0) {

        mostrarResultado(
            "warning",
            `Letra ${letra}`,
            `No se encontraron posturas guardadas para ${letra}.`
        );

    } else {

        mostrarResultado(
            "ready",
            `Haz la seña ${letra}`,
            `Tengo ${cantidad} postura(s) guardada(s) para comparar.`
        );
    }
}


/* =========================================================
   PROGRESO
   ========================================================= */

function actualizarProgreso() {

    const total = letras.length;

    /*
       0% al comenzar A.
       100% al terminar Z.
    */

    const porcentaje = Math.max(
        0,
        Math.min(100, Math.round((indiceActual / (total - 1)) * 100))
    );

    if (progress) {
        progress.style.width = `${porcentaje}%`;
    }

    if (progressPercent) {
        progressPercent.textContent = `${porcentaje}%`;
    }

    if (progressText) {
        progressText.textContent = `${indiceActual + 1} de ${total}`;
    }
}


function actualizarContadorMuestras() {

    if (sampleCount) {
        sampleCount.textContent = String(
            obtenerPosturasGuardadas(letras[indiceActual]).length
        );
    }
}


/* =========================================================
   MOSTRAR RESULTADO Y ESTADO
   ========================================================= */

/*
   Esto se llama hasta 30 veces por segundo; solo
   tocamos la página cuando el mensaje cambia.
*/

let ultimoResultado = "";

function mostrarResultado(tipo, titulo, texto) {

    const clave = tipo + "|" + titulo + "|" + texto;

    if (clave === ultimoResultado) {
        return;
    }

    ultimoResultado = clave;

    if (resultTitle) {
        resultTitle.textContent = titulo;
    }

    if (resultText) {
        resultText.textContent = texto;
    }

    if (!practiceResult) {
        return;
    }

    practiceResult.classList.remove("success", "warning", "error");

    if (tipo === "success" || tipo === "warning" || tipo === "error") {
        practiceResult.classList.add(tipo);
    }
}


let ultimoEstado = "";

function actualizarEstado(texto, color) {

    if (!cameraStatus || ultimoEstado === texto + color) {
        return;
    }

    ultimoEstado = texto + color;

    cameraStatus.textContent = texto;
    cameraStatus.style.color = color;
}


/* =========================================================
   DIBUJAR MANO
   ========================================================= */

function dibujarMano(puntos) {

    if (typeof drawConnectors === "function" && typeof HAND_CONNECTIONS !== "undefined") {

        drawConnectors(ctx, puntos, HAND_CONNECTIONS, {
            color: "#20e0d0",
            lineWidth: 3
        });
    }

    if (typeof drawLandmarks === "function") {

        drawLandmarks(ctx, puntos, {
            color: "#ffffff",
            fillColor: "#176ce8",
            radius: 4,
            lineWidth: 1
        });
    }
}


/* =========================================================
   RESULTADOS DE MEDIAPIPE
   ========================================================= */

function recibirResultados(results) {

    /*
       Si la cámara está apagada, no hacemos nada.
       Quitar la mano NO apaga la cámara.
    */

    if (!cameraActiva || !video || !canvas || !ctx) {
        return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
        return;
    }

    aspectoVideo = width / height;

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);


    /*
       MANO DETECTADA
    */

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {

        const cruda = results.multiHandLandmarks[0];

        ultimaManoCruda = cruda;

        /*
           Espejamos X para coincidir con la
           cámara frontal y suavizamos el temblor.
        */

        const anterior = manoSuavizada;

        const puntos = cruda.map((punto, j) => {

            const x = 1 - punto.x;
            const z = punto.z || 0;

            if (!anterior) {
                return { x, y: punto.y, z };
            }

            return {
                x: anterior[j].x * SUAVIZADO + x * (1 - SUAVIZADO),
                y: anterior[j].y * SUAVIZADO + punto.y * (1 - SUAVIZADO),
                z: anterior[j].z * SUAVIZADO + z * (1 - SUAVIZADO)
            };
        });

        manoSuavizada = puntos;

        dibujarMano(puntos);

        reconocerLetraActual(puntos);

        if (captureButton) {
            captureButton.disabled = false;
        }

    } else {

        /*
           NO HAY MANO.
           IMPORTANTE: NO apagamos la cámara.
        */

        ultimaManoCruda = null;

        manoSuavizada = null;

        framesCoincidentes = 0;

        if (letraConfirmada) {
            return;
        }

        actualizarEstado("● Buscando mano", "#7185a7");

        mostrarResultado(
            "normal",
            "Buscando tu mano...",
            `Coloca tu mano frente a la cámara para hacer la seña ${letras[indiceActual]}.`
        );
    }
}


/* =========================================================
   ACTIVAR CÁMARA
   ========================================================= */

async function activarCamara() {

    if (cameraActiva) {
        return;
    }

    try {

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {

            mostrarResultado(
                "error",
                "Cámara no disponible",
                "Este navegador no permite acceder a la cámara. Si abriste la página por http, usa el link https."
            );

            return;
        }

        if (startCameraButton) {
            startCameraButton.disabled = true;
            startCameraButton.textContent = "Iniciando...";
        }


        /*
           640x480 es suficiente: MediaPipe reduce la
           imagen internamente y así va más fluido en
           equipos y celulares modestos.
        */

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        });

        video.srcObject = stream;

        await new Promise((resolve) => {

            if (video.readyState >= 2) {
                resolve();
                return;
            }

            video.addEventListener("loadedmetadata", resolve, { once: true });
        });

        await video.play();

        mostrarResultado("normal", "Preparando el reconocimiento...", "Cargando el modelo de manos.");

        await precargarModelo();

        cameraActiva = true;

        procesando = false;

        ultimaManoCruda = null;

        manoSuavizada = null;

        framesCoincidentes = 0;

        if (cameraMessage) {
            cameraMessage.classList.add("hidden");
        }

        if (startCameraButton) {
            startCameraButton.textContent = "Cámara activa";
        }

        if (stopCameraButton) {
            stopCameraButton.disabled = false;
        }

        actualizarEstado("● Cámara activa", "#39df9b");

        mostrarSenaActual();

        iniciarProcesamiento();

        console.log("✓ SignBridge: cámara activada correctamente.");

    } catch (error) {

        console.error("Error al activar cámara:", error);

        cameraActiva = false;

        /*
           Si ocurrió un error, liberamos el stream.
        */

        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            stream = null;
        }

        if (startCameraButton) {
            startCameraButton.disabled = false;
            startCameraButton.textContent = "Activar cámara";
        }

        if (error.name === "NotAllowedError") {

            mostrarResultado(
                "error",
                "Permiso denegado",
                "Permite el acceso a la cámara desde el navegador."
            );

        } else if (error.name === "NotFoundError") {

            mostrarResultado(
                "error",
                "Cámara no encontrada",
                "No se encontró ninguna cámara disponible."
            );

        } else {

            mostrarResultado(
                "error",
                "No se pudo activar la cámara",
                error.message || "Revisa los permisos de la cámara."
            );
        }
    }
}


/* =========================================================
   PROCESAR VIDEO
   ========================================================= */

async function procesarVideo(ahora) {

    if (!cameraActiva) {
        return;
    }

    /*
       Solo enviamos imágenes nuevas, como máximo
       ~30 por segundo, y nada si la pestaña está oculta.
    */

    const hayImagenNueva = video.currentTime !== ultimoTiempoVideo;

    if (
        video.readyState >= 2 &&
        !procesando &&
        !document.hidden &&
        hayImagenNueva &&
        ahora - ultimoEnvio >= INTERVALO_MINIMO_MS
    ) {

        procesando = true;

        ultimoEnvio = ahora;

        ultimoTiempoVideo = video.currentTime;

        try {

            if (window.signBridgeHands) {
                await window.signBridgeHands.send({ image: video });
            }

        } catch (error) {

            console.error("Error procesando mano:", error);
        }

        procesando = false;
    }

    /*
       Seguimos procesando aunque no haya mano.
    */

    animationFrame = requestAnimationFrame(procesarVideo);
}


function iniciarProcesamiento() {

    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }

    ultimoTiempoVideo = -1;

    animationFrame = requestAnimationFrame(procesarVideo);
}


/* =========================================================
   DETENER CÁMARA
   ========================================================= */

function detenerCamara() {

    cameraActiva = false;

    procesando = false;

    ultimaManoCruda = null;

    manoSuavizada = null;

    framesCoincidentes = 0;

    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
    }

    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
    }

    if (video) {
        video.pause();
        video.srcObject = null;
    }

    if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (cameraMessage) {
        cameraMessage.classList.remove("hidden");
    }

    if (startCameraButton) {
        startCameraButton.disabled = false;
        startCameraButton.textContent = "Activar cámara";
    }

    if (stopCameraButton) {
        stopCameraButton.disabled = true;
    }

    if (captureButton) {
        captureButton.disabled = true;
    }

    actualizarEstado("● Esperando", "#7185a7");

    mostrarResultado("normal", "Cámara detenida", "Activa la cámara para comenzar.");
}


/* =========================================================
   CAPTURAR MUESTRA
   ========================================================= */

function capturarMuestra() {

    const letra = letras[indiceActual];

    const mostrarMensaje = (texto) => {
        if (captureMessage) {
            captureMessage.textContent = texto;
        }
    };

    if (!cameraActiva) {
        mostrarMensaje("Activa la cámara primero.");
        return;
    }

    if (!ultimaManoCruda) {
        mostrarMensaje("No se detecta ninguna mano.");
        return;
    }

    if (typeof window.guardarPostura !== "function") {
        mostrarMensaje("No se pudo cargar el sistema de posturas.");
        return;
    }

    if (window.posturaCompleta && window.posturaCompleta(letra)) {
        mostrarMensaje(`Ya tienes ${window.CONFIG_POSTURAS.muestrasPorLetra} muestras de la ${letra} en este navegador.`);
        return;
    }

    const guardada = window.guardarPostura(letra, ultimaManoCruda, aspectoVideo);

    if (!guardada) {
        mostrarMensaje(`No se pudo guardar la muestra de la ${letra}.`);
        return;
    }

    olvidarMuestras();

    actualizarContadorMuestras();

    mostrarMensaje(`✓ Muestra de la ${letra} guardada.`);
}


/* =========================================================
   BOTONES
   ========================================================= */

if (startCameraButton) {
    startCameraButton.addEventListener("click", activarCamara);
}

if (stopCameraButton) {
    stopCameraButton.disabled = true;
    stopCameraButton.addEventListener("click", detenerCamara);
}

if (captureButton) {
    captureButton.disabled = true;
    captureButton.addEventListener("click", capturarMuestra);
}


/* =========================================================
   INICIO
   ========================================================= */

mostrarSenaActual();

if ("requestIdleCallback" in window) {
    requestIdleCallback(precargarModelo, { timeout: 2000 });
} else {
    setTimeout(precargarModelo, 500);
}


/* =========================================================
   LIMPIAR AL SALIR
   ========================================================= */

/*
   "pagehide" en lugar de "beforeunload": así el botón
   atrás del navegador puede restaurar la página al instante.
*/

window.addEventListener("pagehide", detenerCamara);


/* =========================================================
   DEBUG
   ========================================================= */

window.SignBridgeRecognition = {
    letras,
    obtenerPosturasGuardadas,
    compararConLetra,
    normalizarMano,
    siguienteLetra,
    activarCamara,
    detenerCamara
};


console.log("✓ SignBridge reconocimiento cargado correctamente.");
