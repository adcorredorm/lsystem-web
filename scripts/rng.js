// seeded RNG (mulberry32)
function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x9e3779b9) >>> 0;
    let t = Math.imul(s ^ (s >>> 16), 0x21f0aaad);
    t = Math.imul(t ^ (t >>> 15), 0x735a2d97);
    return ((t ^ (t >>> 15)) >>> 0) / 4294967296;
  };
}
