# Verificación local

## Última validación local documentada

**2 de noviembre de 2026 · Node 24.22.2 · proyecto definitivo.**

- `npm run check`: correcto, con **153 pruebas unitarias/de interfaz en siete archivos**, además de avisos de terceros, TypeScript, ESLint, Prettier y build.
- `npm run test:e2e`: **22 pruebas E2E en Chromium** superadas.

Ambas ejecuciones finalizaron sin fallos ni omisiones.

## Reproducir la verificación

Usa Node según `.nvmrc`, ejecuta `npm ci` y después:

```sh
npm run check
npm run test:toolchain
npm run browser:install
npm run test:e2e
```

`check` valida avisos, tipos, lint, formato, unitarias/interfaz y build. Las E2E sirven el build en 127.0.0.1:4173; necesitan ese puerto libre para evitar comprobar otra copia de la aplicación. Los navegadores se guardan en `artifacts/pw-browsers/`, excluido de Git. Las trazas y resultados también son temporales.

## Cobertura del flujo

El dominio comprueba enteros grandes, bases, errores, aritmética, signos, BCD, fracciones, punto fijo, IEEE e información. Contenido comprueba 25 temas, glosario, 21 categorías y 84 soluciones mediante un oráculo independiente, evaluación de alternativas y huellas revisadas. La interfaz comprueba conversor, validaciones, pistas, foco y errores accesibles.

Las E2E cubren navegación, recargas, quizzes, temas, lectura efímera, menú, reflujo y ausencia de peticiones externas. El caso IEEE revisado comprueba artículo, campos, ambos formatos y recarga.

El cierre UX/UI añadió ocho pruebas de interfaz y dos E2E sobre errores accesibles de las demos con signo y su recuperación, identificadores independientes, instrucciones por modalidad y jerarquía de encabezados. Las E2E añadidas recorren escritorio de 1440 px y móvil de 390 px en claro y oscuro, y generan capturas de error, estado válido y componentes corregidos. Se conservan los contenidos educativos, los algoritmos y las dependencias.

## Antecedente

La preparación del 1 de noviembre de 2026 registró 145 pruebas unitarias/de interfaz y 20 E2E Chromium superadas con Node 24.22.2, antes del cierre UX/UI descrito arriba.

## Límites

Las verificaciones técnicas anteriores incluyeron regresiones en Chromium, Firefox y WebKit; no representan una nueva ejecución multinavegador de esta preparación. Las pruebas automatizadas no certifican conformidad WCAG ni sustituyen una revisión audible con lector de pantalla. No se ha comprobado infraestructura desplegada en Netlify ni CI remoto. Una validación satisfactoria no garantiza la ausencia de errores. El override tiene un [riesgo residual documentado](dependency-review.md).
