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
const codeBody = '<rect width="798" height="260" fill="#000"/>' + code.map((line,i) => text(line,16,-4+i*76,64).replaceAll('var(--icon-primary, currentColor)', '#00c4a3')).join('');
writeFileSync('images/comparison-monolisa-vs-berkeley-mono-monolisa-code.svg',svg(codeBody,798,260,'MonoLisa Code: the same three lines as the Berkeley vendor excerpt, rendered locally'));
