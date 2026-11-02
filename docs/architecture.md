# Arquitectura y contratos

BinaryLab es una SPA estática en español: React, TypeScript estricto, Vite y Tailwind. No requiere servidor propio, cuentas, variables privadas ni servicios de cálculo.

## Responsabilidades

- `src/domain/`: funciones puras de conversión, aritmética, representaciones y evaluación. Enteros mediante `bigint`; fracciones como racionales exactos; IEEE mediante `DataView` y `ArrayBuffer`.
- `src/content/`: catálogo, 25 temas, glosario, 84 ejercicios, pistas y registro de campos evaluables.
- `src/features/`: conversor, aprendizaje, demostraciones y práctica.
- `src/components/`: controles y presentación compartidos; shell y rutas en `src/app/`.

## Comportamiento que debe conservarse

La ruta `/` abre el conversor con 149 decimal y ocho bits. Cambiar de base conserva el valor; el texto vacío es neutral, los caracteres y pegados inválidos se rechazan y no se truncan valores fuera de rango. Los cuatro resultados y los pasos se derivan del mismo valor semántico.

Las rutas `/aprender/:slug` y `/practicar/:categoryId` funcionan con carga directa. La evaluación distingue equivalencia numérica, formato exigido y conceptos. Cada ejercicio mantiene su id, campos, explicación y cuatro alternativas completas únicas, con una sola correcta. La solución solo se revela tras comprobar o solicitarla.

Los temas claro/oscuro y Lectura cómoda viven en memoria; no se guardan preferencias, respuestas o progreso. El menú móvil es modal, bloquea el fondo y permite scroll interno. La continuación de una actividad gestiona el foco; los errores BCD se asocian al campo y a una región de estado.

## Ejecución y distribución

La versión exacta de Node se obtiene de `.nvmrc`; `package-lock.json` fija las dependencias. GitHub Actions utiliza esa versión de Node y Netlify sirve archivos estáticos por ruta válida, con fallback `404` no forzado. La configuración no implica que se haya realizado un despliegue real.

`src/app/seo.ts` comparte las 49 rutas y sus metadatos entre React y `scripts/generate-seo.mjs`. Después de Vite, el build genera las cabeceras HTML por ruta, `404.html`, `robots.txt` y `sitemap.xml` en `dist/`. El contenido y las demostraciones siguen renderizándose en el cliente. Los canonical omiten query, fragmentos, `index.html` y barras finales salvo `/`; las rutas inválidas reciben `noindex` y no tienen canonical. Netlify conserva los archivos existentes antes de aplicar el fallback y desactiva Pretty URLs para mantener esta política.

`public/THIRD-PARTY-NOTICES.txt` y las cuatro licencias OFL se copian al build; `npm run license:check` comprueba los avisos contra las dependencias instaladas. Los cálculos no realizan peticiones externas. Los tests se describen en [verification.md](verification.md).
