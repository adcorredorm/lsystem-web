const grammars = [
  {
    name: "Koch island",
    axiom: "F-F-F-F",
    rules: {
      F: [{ p: 1, successor: "F-F+F+FF-F-F+F" }],
    },
    angle: 90,
    iterations: 2,
    fitCanvas: true,
  },
  {
    name: "Simple plant",
    axiom: "F",
    rules: {
      F: [{ p: 1, successor: "F[+F]F[-F]F" }],
    },
    angle: 25.7,
    iterations: 5,
    fitCanvas: false,
  },
  {
    name: "Stochastic plant",
    axiom: "F",
    rules: {
      F: [
        { p: 1/3, successor: "F[+F]F[-F]F" },
        { p: 1/3, successor: "F[+F]F" },
        { p: 1/3, successor: "F[-F]F" },
      ],
    },
    angle: 25.7,
    iterations: 5,
    fitCanvas: false,
  },
];
