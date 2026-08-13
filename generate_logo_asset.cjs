const fs = require('fs');

const svgText = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 500 500" width="500" height="500">
  <!-- Solid red background -->
  <rect width="500" height="500" fill="#E60000"/>

  <defs>
    <!-- Path for curved text along top half of gear circle (radius 115, center 250, 205) -->
    <path id="textArc" d="M 132,205 A 118,118 0 1,1 368,205" />
  </defs>

  <!-- Gear Group centered at (250, 205) -->
  <g id="gear">
    <!-- 8 Outer Gear Teeth (black blocky gear teeth) -->
    <rect x="230" y="46" width="40" height="38" rx="3" fill="#000000" />
    <rect x="230" y="46" width="40" height="38" rx="3" fill="#000000" transform="rotate(45 250 205)" />
    <rect x="230" y="46" width="40" height="38" rx="3" fill="#000000" transform="rotate(90 250 205)" />
    <rect x="230" y="46" width="40" height="38" rx="3" fill="#000000" transform="rotate(135 250 205)" />
    <rect x="230" y="46" width="40" height="38" rx="3" fill="#000000" transform="rotate(180 250 205)" />
    <rect x="230" y="46" width="40" height="38" rx="3" fill="#000000" transform="rotate(225 250 205)" />
    <rect x="230" y="46" width="40" height="38" rx="3" fill="#000000" transform="rotate(270 250 205)" />
    <rect x="230" y="46" width="40" height="38" rx="3" fill="#000000" transform="rotate(315 250 205)" />

    <!-- Gear Outer Black Ring -->
    <circle cx="250" cy="205" r="138" fill="#000000" />

    <!-- Gear Inner Red Center -->
    <circle cx="250" cy="205" r="92" fill="#E60000" />

    <!-- Arc text on black gear ring: FEDERASI SERIKAT BURUH NUSANTARA -->
    <text fill="#FFE600" font-family="'Trebuchet MS', 'Arial Black', sans-serif" font-weight="900" font-size="17" letter-spacing="1">
      <textPath href="#textArc" startOffset="50%" text-anchor="middle">FEDERASI SERIKAT BURUH NUSANTARA</textPath>
    </text>

    <!-- 5-Pointed Yellow Star centered at (250, 205) -->
    <polygon points="
      250,113
      271,178
      338,178
      284,217
      305,282
      250,242
      195,282
      216,217
      162,178
      229,178"
      fill="#FFE600" />

    <!-- Obor (Torch) in Center -->
    <!-- Handle & Cup -->
    <path d="M 238,228 L 262,228 L 255,292 L 245,292 Z" fill="#000000" />
    <ellipse cx="250" cy="228" rx="13" ry="4" fill="#000000" />
    <path d="M 235,225 C 235,219 265,219 265,225 L 261,232 L 239,232 Z" fill="#000000" />
    
    <!-- Torch Flame (black flames) -->
    <path d="M 250,148 
             C 258,168 267,180 264,198 
             C 268,190 270,178 267,170 
             C 273,184 272,202 263,212 
             C 260,217 256,223 250,225 
             C 244,223 240,217 237,212 
             C 228,202 227,184 233,170 
             C 230,178 232,190 236,198 
             C 233,180 242,168 250,148 Z" 
          fill="#000000" />
  </g>

  <!-- FSBN Text at bottom -->
  <text x="250" y="458" text-anchor="middle" fill="#FFE600" font-family="'Arial Black', 'Impact', sans-serif" font-weight="900" font-size="82" letter-spacing="3">FSBN</text>
</svg>`;

const base64Svg = 'data:image/svg+xml;base64,' + Buffer.from(svgText).toString('base64');

fs.writeFileSync('public/fsbn_logo.svg', svgText);

const tsContent = `// Auto-generated SVG Logo Data URL for FSBN SBN KASBI PT VCI
export const FSBN_LOGO_SVG = \`${svgText}\`;
export const FSBN_LOGO_DATA_URL = "${base64Svg}";
export default FSBN_LOGO_DATA_URL;
`;

fs.writeFileSync('src/assets/images/fsbnLogoDataUrl.ts', tsContent);
console.log('Asset files generated successfully');
