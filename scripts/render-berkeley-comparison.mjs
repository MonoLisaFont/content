// Public-information comparison: never loads or renders Berkeley font software.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const config = JSON.parse(readFileSync('scripts/comparison-fonts.local.json', 'utf8'));
const font = [process.argv[2], config.fonts.monolisa.regular, '/Library/Fonts/MonoLisaCodeUpright.ttf'].find(p => p && existsSync(p));
if (!font) throw new Error('Pass a local MonoLisa Code font path.');
let id = 0;
function text(value, x, y, size = 24) {
  const result = spawnSync('hb-view', ['--output-format=svg', `--font-size=${size}`, '--variations=wght=400', '--', font, value], {encoding:'utf8'});
  if (result.status !== 0) throw new Error(result.stderr);
  const prefix = `b${id++}-`;
  return result.stdout.replace(/<\?xml[^>]*>/g, '').replace('<svg ', `<svg x="${x}" y="${y}" `)
    .replace(/id="([^"]+)"/g, `id="${prefix}$1"`).replace(/xlink:href="#/g, `xlink:href="#${prefix}`)
    .replace(/<rect[^>]*\/>/g, '').replaceAll('rgb(0%, 0%, 0%)', 'var(--icon-primary, currentColor)');
}
function svg(body, width, height, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}"><title>${label}</title>${body}</svg>\n`;
}
// Three complete lines transcribed from the vendor's Generic code specimen.
// Display size and colors aid reading, but do not establish matched rendering.
const code = ['return { i += 1,', '  get["KEY"].run()', '};'];
const syntaxFills = {
  keyword: 'var(--comparison-syntax-keyword, var(--ml-colors-primary, #b7791f))',
  string: 'var(--comparison-syntax-string, var(--ml-colors-primary, #b7791f))',
  number: 'var(--comparison-syntax-number, var(--ml-colors-primary, #b7791f))',
  punctuation: 'var(--comparison-syntax-punctuation, var(--ml-colors-comment, currentColor))',
  identifier: 'var(--comparison-syntax-identifier, var(--ml-colors-text, currentColor))',
};
// Fixed specimen token ranges; shared by both fonts so highlights are identical.
function tokenTypes(line, index) {
  return [...line].map((char, column) => {
    if (index === 0 && column < 6) return 'keyword';
    if (index === 0 && char === '1') return 'number';
    if (index === 1 && column >= 6 && column <= 10) return 'string';
    if ('{}[],.;()'.includes(char)) return 'punctuation';
    return 'identifier';
  });
}
const codeBody = code.map((line,i) => {
  let glyph = 0;
  const types = tokenTypes(line,i);
  const rendered = text(line,16,-4+i*76,64).replace(/<use\b/g, () => {
    if (glyph >= types.length) throw new Error('Unexpected MonoLisa glyph count');
    const type = types[glyph++];
    return `<use fill="${syntaxFills[type]}" data-token="${type}"`;
  });
  if (glyph !== line.length) throw new Error('Expected one glyph per specimen character');
  return rendered;
}).join('');
// Public source: https://usgraphics.com/static/products/TX-02/images/TX-02-code-ticktock.eefb36c5c7fe.svg
// Each of the 30 vendor paths is one non-space character in reading order.
// Original outlines retained; only fills are adapted, using the same token ranges.
const vendorTypes = code.flatMap((line,i) => tokenTypes(line,i).filter((_,column) => line[column] !== ' '));
let vendorGlyph = 0;
const vendor = readFileSync('images/comparison-monolisa-vs-berkeley-mono-vendor-code.svg','utf8')
  .replace(/<rect[^>]*\/>/g, '').replace(/fill="#00c6a0"/g, () => {
    const type = vendorTypes[vendorGlyph++];
    if (!type) throw new Error('Unexpected vendor glyph count');
    return `fill="${syntaxFills[type]}" data-token="${type}"`;
  });
if (vendorGlyph !== vendorTypes.length) throw new Error('Missing vendor glyphs');
function panel(label, note, content, x, y) {
  return `<g transform="translate(${x} ${y})">${text(label,0,0,28)}${text(note,0,45,18)}<g transform="translate(0 96)">${content}</g></g>`;
}
const mono = `<g transform="scale(${600/798})">${codeBody}</g>`;
for (const mobile of [false,true]) {
  const body = panel('MonoLisa Code','Rendered locally',mono,0,0) + panel('Berkeley Mono','Vendor vector excerpt',vendor,mobile?0:632,mobile?330:0);
  writeFileSync(`images/comparison-monolisa-vs-berkeley-mono-code${mobile?'-mobile':''}.svg`,svg(body,mobile?600:1232,mobile?630:300,'MonoLisa Code and Berkeley Mono code comparison; different rendering sources'));
}
