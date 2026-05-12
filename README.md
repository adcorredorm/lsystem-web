# L-System Visualizer

Herramienta para explorar gramáticas L-system en 2D, basada en:

> Prusinkiewicz, P. & Lindenmayer, A. (1990). [*The Algorithmic Beauty of Plants*](https://algorithmicbotany.org/papers/abop/abop.pdf). Springer-Verlag.

Se puede abrir `index.html` directamente en el navegador — no necesita servidor ni instalación.

---

## Interfaz

Dos modos de visualización:

- **Crecer** — anima la derivación iteración a iteración (n=0 → n=1 → ...). El panel izquierdo lista el string en cada paso; clickear una línea salta a esa iteración.
- **Tortuga** — anima la interpretación símbolo a símbolo de la iteración actual. El panel izquierdo muestra el string como caracteres individuales y resalta el que la tortuga está ejecutando. La flecha azul en el canvas indica la dirección actual.

El campo de texto debajo de los controles muestra el JSON de la gramática activa. Editarlo aplica los cambios al instante, **solo en la sesión actual** — no modifica `grammars.js`. Útil para experimentar; para guardar definitivamente, ver [Cómo agregar o modificar gramáticas permanentemente](#cómo-agregar-o-modificar-gramáticas-permanentemente).

---

## Convención de símbolos

| Símbolo | Significado para la tortuga |
|---------|----------------------------|
| `F`, `G`, `A`, `B` ... (cualquier mayúscula) | Avanzar y **dibujar** un segmento |
| `f` | Avanzar **sin dibujar** |
| `+` | Girar a la izquierda δ grados |
| `-` | Girar a la derecha δ grados |
| `\|` | Media vuelta (180°) |
| `[` | Guardar posición y ángulo (inicio de rama) |
| `]` | Restaurar posición y ángulo (fin de rama) |
| `%` | Cortar el resto de la rama actual |
| `x`, `y`, `l`, `r` ... (minúsculas, salvo `f`) | **Ignorado** por la tortuga — existe solo para las reglas de reescritura |

**Importante**: la tortuga no sabe ni le importa el "significado" de los símbolos. Solo ejecuta la acción que le corresponde.

---

## Cómo agregar o modificar gramáticas permanentemente

En `grammars.js`. Cada gramática es un objeto con estos campos:

```js
{
  name: "Mi gramática",           // nombre que aparece en el selector
  axiom: "F",                     // string inicial (n=0)
  rules: {
    F: [
      { 
        p: 1,                     // probabilidad de aplicar la regla
        successor: "F[+F]F[-F]F"  // regla de reescritura a aplicar
      }
      ], 
  },
  angle: 25.7,                    // ángulo δ por defecto (grados)
  iterations: 5,                  // iteraciones por defecto
  fitCanvas: false,               // true = escala para llenar el canvas (útil para fractales)
}
```

### Reglas estocásticas

Si un símbolo tiene varias reglas, se elige una al azar según su probabilidad. **Las probabilidades deben sumar 1**:

```js
rules: {
  F: [
    { p: 1/3, successor: "F[+F]F[-F]F" },
    { p: 1/3, successor: "F[+F]F" },
    { p: 1/3, successor: "F[-F]F" },
  ],
},
```

Cambiar la **Semilla** en la interfaz permite obtener plantas distintas con la misma gramática.

### `fitCanvas`

- `false` — la tortuga parte del centro-inferior del canvas. El parámetro **Largo** controla el tamaño real en píxeles.
- `true` — el dibujo se escala automáticamente para llenar el canvas.

