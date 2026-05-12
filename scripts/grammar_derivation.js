/**
 * Aplica un paso de derivación al string
 *
 * @param {string} string - String actual (ej: "F[+F]F[-F]F").
 * @param {Object} rules - Diccionario { símbolo: [{ p, successor }, ...] }.
 *   Cada símbolo apunta a un array de opciones con probabilidad y string sucesor.
 *   Las probabilidades de cada array deben sumar 1.
 * @param {() => number} rng - Función RNG que retorna un número entre 0 y 1.
 * @returns {string} Nuevo string con cada símbolo expandido.
 * 
 * Nota: Símbolos sin regla se copian sin cambios (identidad).
 *
 * Ejemplo:
 *   deriveStep("F", { F: [{ p: 1, successor: "F[+F]F" }] }, rng)
 *   → "F[+F]F"
 */
function deriveStep(string, rules, rng) {
  let result = '';
  // TODO
  return result;
}

/**
 * Aplica n pasos de derivación y devuelve TODOS los strings intermedios.
 *
 * @param {string} axiom - String inicial (paso n=0).
 * @param {Object} rules - Diccionario { símbolo: [{ p, successor }, ...] }.
 *   Cada símbolo apunta a un array de opciones con probabilidad y string sucesor.
 *   Las probabilidades de cada array deben sumar 1.
 * @param {number} n - Cantidad de pasos a derivar.
 * @param {number} [seed=42] - Semilla del RNG. La misma semilla produce siempre el mismo resultado.
 *
 * @returns {string[]} Array de n+1 strings: [axiom, paso1, paso2, ..., pasoN].
 *   Se usa para mostrar todas las iteraciones en el panel del modo Crecer.
 *
 * Ejemplo:
 *   deriveAll("F", { F: [{ p: 1, successor: "F[+F]F" }] }, 2)
 *   → ["F", "F[+F]F", "F[+F]F[+F[+F]F]F[+F]F"]
 */
function deriveAll(axiom, rules, n, seed = 42) {
  // Crea la funcion correspondiente para la generacion reproducible de numeros aleatorios (0,1)
  const rng = makeRng(seed); 
  //TODO
  return [axiom];
}
