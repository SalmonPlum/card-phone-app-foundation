/** Read static TrueType weight and Unicode cmap coverage without a native/font-tool dependency. */
export function inspectFont(bytes: Uint8Array): { weight: number; variable: boolean; codepoints: Set<number> } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 12 || view.getUint32(0) !== 0x00010000) throw new Error('Invalid TrueType font header');
  const tables = new Map<string, { offset: number; length: number }>();
  const count = view.getUint16(4);
  if (12 + count * 16 > bytes.length) throw new Error('Truncated font directory');
  for (let index = 0; index < count; index++) {
    const position = 12 + index * 16;
    const tag = String.fromCharCode(...bytes.slice(position, position + 4));
    const offset = view.getUint32(position + 8), length = view.getUint32(position + 12);
    if (offset + length > bytes.length) throw new Error(`Truncated font table: ${tag}`);
    tables.set(tag, { offset, length });
  }
  const cmap = tables.get('cmap'), os2 = tables.get('OS/2');
  if (!cmap || !os2 || os2.length < 6 || cmap.length < 4) throw new Error('Missing font Unicode/weight tables');
  const codepoints = new Set<number>(), visited = new Set<number>();
  const encodings = view.getUint16(cmap.offset + 2);
  if (4 + encodings * 8 > cmap.length) throw new Error('Truncated font Unicode directory');
  for (let index = 0; index < encodings; index++) {
    const encoding = cmap.offset + 4 + index * 8;
    const platform = view.getUint16(encoding), id = view.getUint16(encoding + 2);
    if (platform !== 0 && !(platform === 3 && (id === 1 || id === 10))) continue;
    const offset = cmap.offset + view.getUint32(encoding + 4);
    if (visited.has(offset)) continue;
    visited.add(offset);
    if (offset < cmap.offset || offset + 2 > cmap.offset + cmap.length) throw new Error('Invalid font Unicode subtable');
    const format = view.getUint16(offset);
    if (format === 4) {
      const segments = view.getUint16(offset + 6) / 2;
      const end = offset + 14, start = end + segments * 2 + 2;
      const delta = start + segments * 2, ranges = delta + segments * 2;
      const limit = offset + view.getUint16(offset + 2);
      if (limit > cmap.offset + cmap.length || ranges + segments * 2 > limit) throw new Error('Invalid font BMP map');
      for (let segment = 0; segment < segments; segment++) {
        const first = view.getUint16(start + segment * 2), last = view.getUint16(end + segment * 2);
        const adjustment = view.getInt16(delta + segment * 2), range = view.getUint16(ranges + segment * 2);
        for (let cp = first; cp <= last && cp < 0xffff; cp++) {
          let glyph: number;
          if (range === 0) glyph = (cp + adjustment) & 0xffff;
          else {
            const position = ranges + segment * 2 + range + (cp - first) * 2;
            if (position + 2 > limit) throw new Error('Invalid font glyph offset');
            glyph = view.getUint16(position);
            if (glyph !== 0) glyph = (glyph + adjustment) & 0xffff;
          }
          if (glyph !== 0) codepoints.add(cp);
        }
      }
    } else if (format === 12) {
      const groups = view.getUint32(offset + 12), limit = offset + view.getUint32(offset + 4);
      if (limit > cmap.offset + cmap.length || offset + 16 + groups * 12 > limit) throw new Error('Invalid font Unicode map');
      for (let group = 0; group < groups; group++) {
        const position = offset + 16 + group * 12;
        const first = view.getUint32(position), last = view.getUint32(position + 4), glyph = view.getUint32(position + 8);
        for (let cp = first; cp <= last && cp <= 0x10ffff; cp++) if (glyph + cp - first !== 0) codepoints.add(cp);
      }
    }
  }
  if (codepoints.size === 0) throw new Error('Font has no supported Unicode map');
  return { weight: view.getUint16(os2.offset + 4), variable: tables.has('fvar'), codepoints };
}
