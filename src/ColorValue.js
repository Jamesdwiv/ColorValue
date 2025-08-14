// ColorValue.js

class ColorValue {
  constructor(input) {
    this.original = input;
    this.format = null;
    this.alpha = 1;
    this.r = this.g = this.b = 0;

    this.parse(input);
  }

  parse(input) {
    if (typeof input !== 'string') return;

    const trimmed = input.trim().toLowerCase();

    if (this.parseHex(trimmed)) return;
    if (this.parseRgb(trimmed)) return;
    if (this.parseHsl(trimmed)) return;
    if (this.parseNamed(trimmed)) return;

    throw new Error(`Unrecognized color format: ${input}`);
  }

  parseHex(str) {
    // TODO: Implement HEX parsing
    return false;
  }

  parseRgb(str) {
    // TODO: Implement RGB(A) parsing
    return false;
  }

  parseHsl(str) {
    // TODO: Implement HSL(A) parsing
    return false;
  }

  parseNamed(str) {
    // TODO: Implement named color lookup
    return false;
  }

  get hex() {
    // TODO: Convert r, g, b to hex string
    return '#000000';
  }

  get rgb() {
    return { r: this.r, g: this.g, b: this.b, a: this.alpha };
  }

  get hsl() {
    // TODO: Convert RGB to HSL
    return { h: 0, s: 0, l: 0, a: this.alpha };
  }

  get rgbString() {
    const { r, g, b, a } = this.rgb;
    return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
  }

  get hslString() {
    const { h, s, l, a } = this.hsl;
    return a < 1 ? `hsla(${h}, ${s}%, ${l}%, ${a})` : `hsl(${h}, ${s}%, ${l}%)`;
  }
}

export default ColorValue;