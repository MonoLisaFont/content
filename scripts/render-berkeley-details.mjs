// Render local MonoLisa specimens alongside attributed public Berkeley artwork.
import {readFileSync, writeFileSync, existsSync} from 'node:fs';
import {text, svg} from './render-berkeley-comparison.mjs';
const data = JSON.parse(readFileSync('scripts/berkeley-public-style-excerpts.json','utf8'));
const config = JSON.parse(readFileSync('scripts/comparison-fonts.local.json','utf8'));
const italic = [process.argv[3],config.fonts.monolisa.italic,'/Library/Fonts/MonoLisaCodeItalic.ttf'].find(p=>p && existsSync(p));
if (!italic) throw new Error('MonoLisa italic font required (optional third argument).');
const ink='var(--icon-primary, currentColor)';
function vendorStyle(style,x,y) {
 return `<g fill="${ink}" transform="translate(${x} ${y}) scale(2)">${data[style].map(g=>`<g transform="translate(${g.x} 0)">${g.paths.map(d=>`<path d="${d}"/>`).join('')}</g>`).join('')}</g>`;
}
for(const mobile of [false,true]) {
 const x=mobile?0:570,y=mobile?300:0;
 const left=text('MonoLisa Code',0,0,28)+text('Upright',0,58,18)+text(data.text,0,86,34)+text('Italic',0,166,18)+text(data.text,0,194,34,italic);
 const right=`<g transform="translate(${x} ${y})">${text('Berkeley Mono',0,0,28)}${text('Regular · vendor excerpt',0,58,18)}${vendorStyle('upright',16,130)}${text('Oblique · vendor excerpt',0,166,18)}${vendorStyle('oblique',16,238)}</g>`;
 writeFileSync(`images/comparison-monolisa-vs-berkeley-mono-styles${mobile?'-mobile':''}.svg`,svg(left+right,mobile?540:1110,mobile?570:270,'Upright and sloped styles in MonoLisa and Berkeley Mono'));
}
