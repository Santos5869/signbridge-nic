# SignBridge (Signatech)

Plataforma web para aprender **Lengua de Señas Nicaragüense**: abecedario, números, saludos, colores, familia, presentaciones y escuela, con prácticas, repasos y reconocimiento de señas con la cámara.

## Cómo probarla

Abre el link de GitHub Pages del repositorio. La página principal es `html/index.html`; el `index.html` de la raíz solo redirige allí.

Para probarla en tu computadora necesitas un servidor local (por ejemplo la extensión *Live Server* de VS Code) y abrir `http://localhost:<puerto>/html/index.html`.

## Estructura

| Carpeta   | Contenido                                    |
|-----------|----------------------------------------------|
| `html/`   | Páginas de la plataforma                     |
| `css/`    | Estilos de cada página                       |
| `js/`     | Lógica de cada página                        |
| `images/` | Fotos de las señas e íconos                  |
| `videos/` | Videos de las señas                          |

## Videos pendientes

Los cursos de Escuela muestran la palabra deletreada mientras no exista su video. La lista de nombres esperados está en `videos/escuela/LEEME.txt`.

## Reconocimiento de señas

El reconocimiento compara tu mano con las posturas de `js/posturas-base.js`. Para que funcione para todos, graba las posturas con `js/capturador.html`, usa **Exportar posturas** y reemplaza ese archivo.
