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


//utilities
/**
 * Clamp a number to the [0, 1] range.
 * @param {number} value
 * @returns {number}
 */
function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

/**
 * Normalize alpha input to a float between 0 and 1.
 * Accepts numbers or strings; defaults to 1 if invalid.
 * @param {number|string} alpha
 * @returns {number}
 */
function normalizeAlpha(alpha) {
  if (typeof alpha === 'string') {
    alpha = parseFloat(alpha);
  }
  if (isNaN(alpha)) return 1;
  return clamp01(alpha);
}

/**
 * Convert HSL to RGB.
 * Hue in degrees [0–360), Saturation and Lightness in percent [0–100].
 * Returns RGB values in [0–255].
 * @param {number} h - Hue (degrees)
 * @param {number} s - Saturation (%)
 * @param {number} l - Lightness (%)
 * @returns {{r: number, g: number, b: number}}
 */
function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = clamp01(s / 100);
  l = clamp01(l / 100);

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60)      [r, g, b] = [c, x, 0];
  else if (h < 120)[r, g, b] = [x, c, 0];
  else if (h < 180)[r, g, b] = [0, c, x];
  else if (h < 240)[r, g, b] = [0, x, c];
  else if (h < 300)[r, g, b] = [x, 0, c];
  else             [r, g, b] = [c, 0, x];

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

/**
 * Convert RGB to HSL.
 * RGB values in [0–255]. Returns HSL with Hue in degrees, Saturation and Lightness in percent.
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @returns {{h: number, s: number, l: number}}
 */
 function rgbToHsl(r, g, b) {
  r = clamp01(r / 255);
  g = clamp01(g / 255);
  b = clamp01(b / 255);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = ((b - r) / delta) + 2;
    } else {
      h = ((r - g) / delta) + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}  
