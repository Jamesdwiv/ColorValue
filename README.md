# ColorValue
A lightweight, semantically clear color parsing and conversion class

**ColorValue** is a lightweight, extensible JavaScript class for parsing, converting, and normalizing color values across formats. It supports RGB, HEX, HSL, HWB, and named colors, with robust alpha handling and semantically clear getters.

Features
- Parse and convert between major color formats
- Normalize alpha values across formats
- Access color components via expressive getters
- Extendable design for future formats and utilities
- Zero dependencies, fully transparent logic

Installation
Clone the repo or copy the class directly into your project:
git clone https://github.com/Jamesdwiv/color-value.git

Usage
const color = new ColorValue('rgba(255, 0, 0, 0.5)');
console.log(color.hex);       // "#FF0000"
console.log(color.alpha);     // 0.5
console.log(color.hslString); // "hsl(0, 100%, 50%)"

Contributing
Pull requests are welcome! If you have ideas for new formats, performance improvements, or semantic refinements, feel free to open an issue or submit a PR.

License
MIT — feel free to use, modify, and share.

