# Edición e integridad educativa

Los temas se editan en `src/content/topics/`; el banco está en `src/content/exercises/original.json`. Conserva ids y categorías y revisa también catálogo, hints, registry y demostraciones cuando cambien datos relacionados. Ningún flujo de instalación o pruebas necesita documentos académicos externos ni un importador privado.

`src/content/reviewed-content-manifest.json` registra SHA-256 del texto UTF-8 de los archivos educativos, normalizando únicamente CRLF a LF. Cada ejercicio tiene además una huella del array JSON compacto `[id, categoryId, prompt, academicAnswer, explanation]`, con caracteres Unicode conservados. Las huellas se tomaron después de la revisión editorial, no se derivan del evaluador.

La prueba comprueba la lista completa de archivos, los 84 ids y la correspondencia de los campos servidos con esas huellas. Mantiene además el oráculo numérico independiente de las 84 soluciones, sus cuatro alternativas, formatos, equivalencias, errores y pistas. El manifiesto no sustituye esas verificaciones matemáticas.

Para actualizar contenido: revisar el texto y su procedencia; calcular de forma independiente cualquier resultado nuevo; comprobar el diff y las pruebas afectadas; y solo entonces actualizar las huellas y la revisión del manifiesto. Una actualización automática de hashes no equivale a una aprobación editorial. No cambiar expectativas solo para conseguir una prueba verde.

El manifiesto detecta cambios, **no acredita autoría, permisos o derechos**. Mantener el alcance de [licencias](../LICENSE-SCOPE.md) y la [nota de procedencia](content-provenance.md).
