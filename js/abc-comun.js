"use strict";

/* =========================================================
   SIGNBRIDGE - UTILIDADES DEL ABECEDARIO
   Compartidas por Deletreo básico, Deletrea tu nombre
   y Reto de abecedario.
========================================================= */

const ABC = (() => {

    const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");


    function rutaLetra(letra) {
        return `../images/abecedario/${letra}.png`;
    }


    function tieneImagen(letra) {
        return LETRAS.includes(letra);
    }


    /*
       Mayúsculas y sin tildes (Á → A, Ü → U).
       La Ñ se conserva: no tenemos imagen para ella.
    */

    function limpiarTexto(texto) {

        return String(texto || "")
            .toUpperCase()
            .replace(/Ñ/g, "\u0000")
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/\u0000/g, "Ñ")
            .replace(/[^A-ZÑ ]/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }


    function mezclar(lista) {

        const copia = [...lista];

        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }

        return copia;
    }


    function azar(lista) {
        return lista[Math.floor(Math.random() * lista.length)];
    }


    /* Descarga imágenes por adelantado para que aparezcan al instante. */

    const precargadas = new Set();

    function precargar(letras) {

        for (const letra of letras) {

            if (!tieneImagen(letra) || precargadas.has(letra)) {
                continue;
            }

            precargadas.add(letra);

            new Image().src = rutaLetra(letra);
        }
    }


    /* =====================================================
       USUARIO Y PROGRESO
    ===================================================== */

    function obtenerUsuario() {

        try {
            const datos = localStorage.getItem("usuarioSignbridge");
            return datos ? JSON.parse(datos) : null;
        } catch (error) {
            return null;
        }
    }


    function guardarUsuario(usuario) {

        try {

            localStorage.setItem("usuarioSignbridge", JSON.stringify(usuario));

            const usuarios =
                JSON.parse(localStorage.getItem("usuariosSignbridge")) || [];

            const indice = usuarios.findIndex(
                user => String(user.id) === String(usuario.id)
            );

            if (indice !== -1) {
                usuarios[indice] = usuario;
                localStorage.setItem("usuariosSignbridge", JSON.stringify(usuarios));
            }

        } catch (error) {
            console.error("No se pudo guardar el progreso:", error);
        }
    }


    /* Guarda el porcentaje solo si mejora el anterior. */

    function guardarProgreso(clave, porcentaje) {

        const usuario = obtenerUsuario();

        if (!usuario) {
            return;
        }

        usuario.progreso = usuario.progreso || {};

        const anterior = Number(usuario.progreso[clave]) || 0;

        usuario.progreso[clave] = Math.max(anterior, Math.round(porcentaje));

        guardarUsuario(usuario);
    }


    function leerLocal(clave, porDefecto) {

        try {
            const valor = localStorage.getItem(clave);
            return valor === null ? porDefecto : JSON.parse(valor);
        } catch (error) {
            return porDefecto;
        }
    }


    function guardarLocal(clave, valor) {

        try {
            localStorage.setItem(clave, JSON.stringify(valor));
        } catch (error) {
            /* Modo privado o sin espacio: no es grave. */
        }
    }


    return {
        LETRAS,
        rutaLetra,
        tieneImagen,
        limpiarTexto,
        mezclar,
        azar,
        precargar,
        obtenerUsuario,
        guardarProgreso,
        leerLocal,
        guardarLocal
    };

})();
