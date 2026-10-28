// =====================================================
// SIGNBRIDGE
// CURSO DE NÚMEROS DEL 30 AL 50
// =====================================================

"use strict";


// =====================================================
// DATOS DEL CURSO
// Cada número tiene su video en videos/numeros/<n>.mp4.
// Los que estén en PENDIENTES muestran un aviso hasta
// que exista su video correcto.
// =====================================================

const PENDIENTES = [];

const numeros = [];

for (let n = 30; n <= 50; n++) {

    const pendiente = PENDIENTES.includes(n);

    numeros.push({
        titulo: String(n),
        tipo: pendiente ? "pendiente" : "video",
        contenido: `../videos/numeros/${n}.mp4`,
        descripcion: pendiente
            ? `El video del número ${n} estará disponible pronto.`
            : `Observa atentamente el video para aprender la seña correspondiente al número ${n}.`
    });
}


// =====================================================
// VARIABLES
// =====================================================

let indice = 0;

let cambiandoLeccion = false;


// =====================================================
// ELEMENTOS HTML
// =====================================================

const titulo = document.getElementById("titulo");
const video = document.getElementById("video");
const avisoPendiente = document.getElementById("pendiente");
const descripcion = document.getElementById("descripcion");
const barra = document.getElementById("barra");
const contador = document.getElementById("contador");
const textoProgreso = document.getElementById("textoProgreso");
const btnAnterior = document.getElementById("anterior");
const btnSiguiente = document.getElementById("siguiente");
const pantallaFinal = document.getElementById("finalScreen");
const btnVolverInicio = document.getElementById("volverInicio");

const animados = [titulo, video, avisoPendiente, descripcion];


// =====================================================
// CARGAR LECCIÓN
// =====================================================

function cargarNumero(animar = true) {

    const numero = numeros[indice];

    if (!numero) {
        return;
    }

    if (animar) {
        animados.forEach(el => el.classList.add("fade-out"));
    }

    setTimeout(() => {

        titulo.textContent = numero.titulo;
        descripcion.textContent = numero.descripcion;


        // Material: video o aviso de pendiente

        video.pause();

        if (numero.tipo === "pendiente") {

            video.removeAttribute("src");
            video.load();
            video.style.display = "none";

            avisoPendiente.style.display = "flex";

        } else {

            avisoPendiente.style.display = "none";

            video.style.display = "block";
            video.src = numero.contenido;
            video.load();
            video.play().catch(() => {});
        }


        // Contador y progreso

        contador.textContent = `${indice + 1} / ${numeros.length}`;

        const porcentaje = ((indice + 1) / numeros.length) * 100;

        barra.style.width = `${porcentaje}%`;
        textoProgreso.textContent = `${Math.round(porcentaje)}% completado`;


        // Botones

        btnAnterior.disabled = indice === 0;

        btnSiguiente.innerHTML =
            indice === numeros.length - 1 ? "Finalizar ✓" : "Siguiente ➜";


        // Animación de entrada

        if (animar) {

            animados.forEach(el => {
                el.classList.remove("fade-out");
                el.classList.add("fade-in");
            });

            setTimeout(() => {
                animados.forEach(el => el.classList.remove("fade-in"));
            }, 350);
        }


        // Descargamos el siguiente video mientras se ve este

        const siguiente = numeros[indice + 1];

        if (siguiente && siguiente.tipo === "video") {

            const link = document.createElement("link");
            link.rel = "prefetch";
            link.href = siguiente.contenido;
            document.head.appendChild(link);
        }

        cambiandoLeccion = false;

    }, animar ? 250 : 0);
}


// =====================================================
// NAVEGACIÓN
// =====================================================

function siguienteNumero() {

    if (cambiandoLeccion) {
        return;
    }

    if (indice < numeros.length - 1) {
        cambiandoLeccion = true;
        indice++;
        cargarNumero(true);
        return;
    }

    mostrarPantallaFinal();
}


function anteriorNumero() {

    if (cambiandoLeccion || indice === 0) {
        return;
    }

    cambiandoLeccion = true;
    indice--;
    cargarNumero(true);
}


// =====================================================
// PANTALLA FINAL
// =====================================================

function mostrarPantallaFinal() {

    video.pause();

    barra.style.width = "100%";
    textoProgreso.textContent = "100% completado";

    pantallaFinal.classList.add("show");

    guardarProgreso();
}


function guardarProgreso() {

    try {

        const datos = localStorage.getItem("usuarioSignbridge");

        if (!datos) {
            return;
        }

        const usuario = JSON.parse(datos);

        usuario.progreso = usuario.progreso || {};
        usuario.progreso.numeros30a50 = 100;

        localStorage.setItem("usuarioSignbridge", JSON.stringify(usuario));

    } catch (error) {

        console.error("No se pudo guardar el progreso:", error);
    }
}


// =====================================================
// EVENTOS
// =====================================================

btnSiguiente.addEventListener("click", siguienteNumero);
btnAnterior.addEventListener("click", anteriorNumero);

if (btnVolverInicio) {
    btnVolverInicio.addEventListener("click", () => {
        window.location.href = "numeros-cursos.html";
    });
}

document.addEventListener("keydown", (evento) => {

    if (pantallaFinal.classList.contains("show")) {
        return;
    }

    if (evento.key === "ArrowRight") siguienteNumero();
    if (evento.key === "ArrowLeft") anteriorNumero();
});


cargarNumero(false);
