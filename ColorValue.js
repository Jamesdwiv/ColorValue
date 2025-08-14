class ColorValue {
  constructor(input) {
    this.#setFrom(input ?? { r: 0, g: 0, b: 0, a: 1 });
  }

  // Internal storage: normalized RGBA [0–1]
  #setRGBAf(r, g, b, a = 1) {
    this.r = clamp01(r);
    this.g = clamp01(g);
    this.b = clamp01(b);
    this.a = clamp01(a);
  }

  // Entry point for all supported formats
  #setFrom(input) {
    if (typeof input === 'string') {
      const trimmed = input.trim().toLowerCase();
      if (trimmed.startsWith('#')) return this.#setHex(trimmed);
      if (trimmed.startsWith('rgb')) return this.#setCSSRGB(trimmed);
      if (trimmed.startsWith('hsl')) return this.#setCSSHSL(trimmed);
      return this.#setNamed(trimmed);
    }

    if (typeof input === 'number') return this.#setInteger(input);

    if (Array.isArray(input)) {
      if (input.length >= 3 && input.every(v => typeof v === 'number')) {
        return this.#setFloatVector(input);
      }
    }

    if (typeof input === 'object' && input !== null) {
      if ('r' in input && 'g' in input && 'b' in input) {
        const { r, g, b, a } = input;
        const alpha = normalizeAlpha(a, 255);
        return this.#setRGBA(r, g, b, alpha);
      }

      if ('h' in input && 's' in input && 'l' in input) {
        const { h, s, l, a } = input;
        const alpha = normalizeAlpha(a, 1);
        return this.#setHSL(h, s, l, alpha);
      }
    }

    throw new Error('Unsupported color format');
  }

  #setInteger(value) {
    const r = (value >> 16) & 0xff;
    const g = (value >> 8) & 0xff;
    const b = value & 0xff;
    this.#setRGBAf(r / 255, g / 255, b / 255, 1);
  }

  #setFloatVector(arr) {
    const [r, g, b, a = 1] = arr;
    this.#setRGBAf(r, g, b, a);
  }

  #setRGBA(r, g, b, a = 255) {
    this.#setRGBAf(r / 255, g / 255, b / 255, a / 255);
  }

  #setHSL(h, s, l, a = 1) {
    const { r, g, b } = hslToRgb(h, s, l);
    this.#setRGBAf(r, g, b, a);
  }

  #setHex(hex) {
    const clean = hex.replace('#', '');
    let r, g, b;

    if (clean.length === 3) {
      r = parseInt(clean[0] + clean[0], 16);
      g = parseInt(clean[1] + clean[1], 16);
      b = parseInt(clean[2] + clean[2], 16);
    } else if (clean.length === 6) {
      r = parseInt(clean.slice(0, 2), 16);
      g = parseInt(clean.slice(2, 4), 16);
      b = parseInt(clean.slice(4, 6), 16);
    } else {
      throw new Error('Invalid hex format');
    }

    this.#setRGBA(r, g, b, 255);
  }

  #setCSSRGB(str) {
    const match = str.match(/rgba?\(([^)]+)\)/);
    if (!match) throw new Error('Invalid CSS RGB format');
    const parts = match[1].split(',').map(v => parseFloat(v.trim()));
    const [r, g, b, a = 1] = parts;
    this.#setRGBAf(r / 255, g / 255, b / 255, a);
  }

  #setCSSHSL(str) {
    const match = str.match(/hsla?\(([^)]+)\)/);
    if (!match) throw new Error('Invalid CSS HSL format');
    const parts = match[1].split(',').map(v => v.trim());
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;
    const a = parts[3] !== undefined ? parseFloat(parts[3]) : 1;
    this.#setHSL(h, s, l, a);
  }

  #setNamed(name) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = name;
  const computed = ctx.fillStyle;

  if (!computed || (computed === '#000000' && name !== 'black')) {
    throw new Error('Unknown named color');
  }

  this.#setHex(computed);
}


  // Public getters

  Integer() {
    return (
      (Math.round(this.r * 255) << 16) |
      (Math.round(this.g * 255) << 8) |
      Math.round(this.b * 255)
    );
  }

  Hex() {
    const r = Math.round(this.r * 255).toString(16).padStart(2, '0');
    const g = Math.round(this.g * 255).toString(16).padStart(2, '0');
    const b = Math.round(this.b * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  CSSRGB() {
    const r = Math.round(this.r * 255);
    const g = Math.round(this.g * 255);
    const b = Math.round(this.b * 255);
    return this.a < 1
      ? `rgba(${r}, ${g}, ${b}, ${this.a.toFixed(3)})`
      : `rgb(${r}, ${g}, ${b})`;
  }

  CSSHSL() {
    const { h, s, l } = rgbToHsl(this.r, this.g, this.b);
    const hStr = Math.round(h);
    const sStr = Math.round(s * 100);
    const lStr = Math.round(l * 100);
    return this.a < 1
      ? `hsla(${hStr}, ${sStr}%, ${lStr}%, ${this.a.toFixed(3)})`
      : `hsl(${hStr}, ${sStr}%, ${lStr}%)`;
  }

  FloatVector() {
    return [this.r, this.g, this.b, this.a];
  }

  RGBA() {
    return {
      r: Math.round(this.r * 255),
      g: Math.round(this.g * 255),
      b: Math.round(this.b * 255),
      a: Math.round(this.a * 255)
    };
  }

  HSL() {
    const { h, s, l } = rgbToHsl(this.r, this.g, this.b);
    return { h, s, l, a: this.a };
  }
}