# Dependencias y mantenimiento

La versión exacta de Node es la de `.nvmrc`; se conserva la rama LTS 24. Los paquetes y sus integridades están fijados en `package-lock.json`. No se modifica el árbol al preparar esta versión.

## Override provisional de minimatch

`package.json` sustituye únicamente `minimatch@10.2.6` por `11.0.1`. Evita la versión afectada por [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), sin aplicar un override global a todas las versiones del paquete.

En la revisión del 1 de noviembre de 2026, ESLint 10.14.0, @eslint/config-array 0.23.5 y @typescript-eslint/typescript-estree 8.72.1 declaraban rangos que no admitían oficialmente minimatch 11. El override no modifica esa declaración de compatibilidad. Se verificaron el árbol instalado y del lockfile, una instalación limpia, los patrones usados y la ejecución de las herramientas. Que esas pruebas pasen no garantiza todos los usos futuros.

La auditoría npm anterior informó cero vulnerabilidades conocidas en su fecha; no se presenta como una consulta nueva ni garantía permanente. La preparación editorial no repite consultas de red o auditorías generales.

Se mantiene el override y su riesgo residual de compatibilidad entre versiones mayores. Retirarlo cuando existan consumidores estables que admitan una versión corregida: actualizar únicamente esos consumidores, revisar el lockfile y ejecutar instalación limpia, auditoría, toolchain, lint, pruebas y build. No volver a 10.2.6 ni utilizar `npm audit fix --force`.
