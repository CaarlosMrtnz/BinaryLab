/** Pistas de método, sin resultados particulares ni soluciones anticipadas. */
const methods: Record<string, [string, string]> = {
  '01': [
    'Distingue cantidad de patrones, máximo, peso y paridad: son propiedades diferentes.',
    'Para pesos, numera desde cero por la derecha; para paridad, observa el último bit.',
  ],
  '02': [
    'Numera las posiciones desde cero por la derecha.',
    'Escribe cada bit multiplicado por su potencia de dos y suma solo los pesos activos.',
  ],
  '03': [
    'Divide el entero entre dos y anota cociente entero y resto.',
    'Repite con el cociente; lee los restos desde la última división. Completa el ancho solo al final.',
  ],
  '04': [
    'Cada cifra hexadecimal corresponde a un grupo de cuatro bits.',
    'Para decimal, usa valor posicional en base dieciséis. Comprueba la equivalencia por los nibbles.',
  ],
  '05': [
    'Cada cifra octal corresponde a tres bits, nunca cuatro.',
    'Agrupa desde la derecha; para decimal, multiplica cada cifra por su potencia de ocho.',
  ],
  '06': [
    'Elige una base intermedia: decimal o binario.',
    'Conserva el valor en cada paso y verifica cada salida con una conversión inversa.',
  ],
  '07': [
    'Empieza por el bit de la derecha y sigue el acarreo o préstamo.',
    'Separa el resultado matemático del patrón de ancho fijo y del bit exterior.',
  ],
  '08': [
    'Escribe primero las unidades y distingue prefijos decimales y binarios.',
    'Convierte a bytes antes de pasar a bits o a otra unidad. Cardinalidad y máximo difieren en una unidad.',
  ],
  '09': [
    'Alinea las posiciones y empieza por la columna de menor peso.',
    'Propaga el acarreo o préstamo; NOT solo invierte bits. Separa patrón almacenado y resultado completo.',
  ],
  '10': [
    'Separa el bit de signo de los bits de magnitud.',
    'Convierte únicamente la magnitud. Si todos sus bits son cero, conserva la información del signo.',
  ],
  '11': [
    'Completa la magnitud al ancho indicado antes de invertir.',
    'Para negativos invierte todos los bits. Si hay acarreo de salida en una suma C1, súmalo al LSB.',
  ],
  '12': [
    'Completa la magnitud al ancho fijado e invierte todos los bits.',
    'Suma una unidad al patrón invertido y comprueba el rango C2. El acarreo exterior se descarta del patrón.',
  ],
  '13': [
    'Identifica el formato antes de asignar valor al MSB.',
    'Compara la suma matemática con el rango; el acarreo exterior por sí solo no determina overflow con signo.',
  ],
  '14': [
    'Separa cada cifra decimal y reserva cuatro bits para ella.',
    'Comprueba cada nibble por separado: una cifra BCD está entre cero y nueve. No conviertas el entero completo como binario natural.',
  ],
  '15': [
    'A la derecha del punto binario aparecen potencias negativas de dos.',
    'Para convertir una fracción decimal, multiplica por dos y conserva los bits en el orden obtenido. Distingue exactitud y truncamiento.',
  ],
  '16': [
    'Localiza cuántos bits quedan tras el punto implícito.',
    'Divide el entero almacenado entre dos elevado a los bits fraccionarios; para codificar, haz la operación inversa.',
  ],
  '17': [
    'Distingue exponente real y exponente almacenado.',
    'Al codificar suma el sesgo; al descodificar réstalo. Mantén el ancho del campo.',
  ],
  '18': [
    'Separa signo, exponente y fracción, y clasifica el exponente.',
    'Solo los normales tienen un uno implícito. Comprueba primero los patrones reservados y aplica después el sesgo.',
  ],
  '19': [
    'Distingue el carácter de su valor numérico y de su codificación.',
    'Escribe cada byte en el orden original; ASCII coincide con UTF-8 solo para los primeros ciento veintiocho códigos.',
  ],
  '20': [
    'Separa los canales R, G y B y conserva su orden.',
    'Cada canal RGB24 ocupa un byte. Para tamaño, cuenta píxeles y bytes por píxel, sin cabeceras ni compresión.',
  ],
  '21': [
    'Identifica si se pide tamaño PCM o reconstrucción de datos comprimidos.',
    'En PCM combina frecuencia, profundidad, canales y duración; pasa de bits a bytes al final. En compresión distingue reconstrucción exacta y aproximada.',
  ],
};
export function exerciseHints(categoryId: string): [string, string] {
  const hints = methods[categoryId];
  if (!hints) throw new Error(`Categoría sin pistas: ${categoryId}`);
  return hints;
}
