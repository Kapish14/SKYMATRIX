/**
 * Parse a PGM (P5 binary) file from an ArrayBuffer.
 * Returns { width, height, maxval, pixels: Uint8Array }
 */
export function parsePGM(buffer) {
  const bytes = new Uint8Array(buffer);
  let offset = 0;

  function readChar() {
    return String.fromCharCode(bytes[offset++]);
  }

  function skipWhitespaceAndComments() {
    while (offset < bytes.length) {
      const ch = bytes[offset];
      if (ch === 35) {
        // '#' — skip comment line
        while (offset < bytes.length && bytes[offset] !== 10) offset++;
        offset++; // skip newline
      } else if (ch === 32 || ch === 9 || ch === 10 || ch === 13) {
        offset++;
      } else {
        break;
      }
    }
  }

  function readToken() {
    skipWhitespaceAndComments();
    let token = '';
    while (offset < bytes.length) {
      const ch = bytes[offset];
      if (ch === 32 || ch === 9 || ch === 10 || ch === 13) break;
      token += String.fromCharCode(ch);
      offset++;
    }
    return token;
  }

  const magic = readToken();
  if (magic !== 'P5' && magic !== 'P2') {
    throw new Error(`Unsupported PGM format: ${magic}`);
  }

  const width = parseInt(readToken(), 10);
  const height = parseInt(readToken(), 10);
  const maxval = parseInt(readToken(), 10);

  // Skip exactly one whitespace character after maxval
  offset++;

  if (magic === 'P5') {
    const pixels = bytes.slice(offset, offset + width * height);
    return { width, height, maxval, pixels };
  } else {
    // P2 ASCII
    const pixels = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      pixels[i] = parseInt(readToken(), 10);
    }
    return { width, height, maxval, pixels };
  }
}

/**
 * Render PGM pixel data to a canvas 2D context as grayscale ImageData.
 */
export function renderPGMToCanvas(canvas, pgmData, regions = [], components = [], highlightedRegion = null) {
  const ctx = canvas.getContext('2d');
  const { width, height, pixels } = pgmData;

  canvas.width = width;
  canvas.height = height;

  // Draw grayscale image
  const imageData = ctx.createImageData(width, height);
  for (let i = 0; i < pixels.length; i++) {
    const v = pixels[i];
    imageData.data[i * 4] = v;
    imageData.data[i * 4 + 1] = v;
    imageData.data[i * 4 + 2] = v;
    imageData.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  // Component colors — vivid neon palette
  const COMPONENT_COLORS = [
    '#00ffc8', // phosphor green
    '#ff3c5f', // signal red
    '#00d4ff', // cyan
    '#ffaa00', // amber
    '#a855f7', // nova purple
    '#ff6b9d', // pink
    '#39ff14', // lime
    '#ff5722', // deep orange
  ];

  // Draw ROI rectangles
  for (const region of regions) {
    const compIdx = typeof region.component_id === 'number'
      ? region.component_id
      : components.findIndex(c =>
          c.regions.some(r => r.x === region.x && r.y === region.y)
        );
    const color = compIdx >= 0 ? COMPONENT_COLORS[compIdx % COMPONENT_COLORS.length] : '#00ffc8';

    const isHighlighted = highlightedRegion &&
      highlightedRegion.x === region.x &&
      highlightedRegion.y === region.y;
    const width = region.width ?? region.size;
    const height = region.height ?? region.size;

    ctx.strokeStyle = color;
    ctx.lineWidth = isHighlighted ? 3 : 1.5;
    ctx.globalAlpha = isHighlighted ? 1 : 0.8;
    ctx.strokeRect(region.x, region.y, width, height);

    // Fill with translucent color
    ctx.fillStyle = color;
    ctx.globalAlpha = isHighlighted ? 0.3 : 0.1;
    ctx.fillRect(region.x, region.y, width, height);
    ctx.globalAlpha = 1;
  }

  // Draw component bounding boxes
  for (let i = 0; i < components.length; i++) {
    const comp = components[i];
    const color = COMPONENT_COLORS[i % COMPONENT_COLORS.length];
    const bb = comp.bounding_box;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(bb.x, bb.y, bb.w, bb.h);
    ctx.setLineDash([]);

    // Component label
    ctx.font = '10px "JetBrains Mono"';
    ctx.fillStyle = color;
    ctx.fillText(`C${comp.id}`, bb.x + 2, bb.y - 3);
  }
}
