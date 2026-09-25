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
const widths=JSON.parse(readFileSync('scripts/berkeley-public-width-excerpts.json','utf8'));
let widthBody=text('Berkeley Mono width options',0,0,28);
Object.entries(widths.rows).forEach(([label,row],i)=>{
 const y=62+i*142;
 widthBody+=text(label+' · vendor excerpt',0,y,20);
 // Uniform scaling for both rows preserves the source's relative widths.
 widthBody+=`<g fill="${ink}" transform="translate(16 ${y+56}) scale(1.4) translate(${-row.left} ${-row.top})">${row.paths.map(d=>`<path d="${d}"/>`).join('')}</g>`;
});
widthBody+=text('Same vendor specimen scale; original outlines.',0,350,18);
writeFileSync('images/comparison-monolisa-vs-berkeley-mono-widths.svg',svg(widthBody,820,400,'Berkeley Mono Normal and Condensed widths at the same source scale'));
// Detail outlines come from the already attributed three-line Generic specimen.
const details=JSON.parse(readFileSync('scripts/berkeley-public-glyph-excerpts.json','utf8'));
const detailRows=[['r','r','Baseline foot','No baseline foot'],['e','e','Crossbar and bowl','Crossbar and bowl'],['brackets','[]','Bracket terminals','Bracket terminals']];
const focusCircle=(x,y)=>`<circle cx="${x}" cy="${y}" r="22" fill="var(--comparison-accent, var(--ml-colors-primary, #f4cc50))" fill-opacity="0.28" aria-hidden="true"/>`;
let detailBody=text('Letterform details',0,0,28)+text('MonoLisa Code',0,50,23)+text('Berkeley Mono',330,50,23);
detailRows.forEach(([key,chars,leftNote,rightNote],i)=>{
 const y=100+i*180;
 const local=text(chars,6,y,104);
 if(key==='r') {
  // The local r is 104 units, with a baseline foot centered 28 units
  // from its glyph origin. hb-view's 16-unit margin remains in text().
  const baseline=Number(local.match(/<use[^>]*\sy="([^"]+)"/)?.[1]);
  if(!Number.isFinite(baseline)) throw new Error('Missing local r baseline');
  detailBody+=focusCircle(6+16+28,y+baseline-5);
  const [left,top,right,bottom]=details.r[0].bounds;
  detailBody+=focusCircle(356+(right-left)*2.4*0.15,y+64+(bottom-top)*2.4-5);
 }
 detailBody+=local+text(leftNote,0,y+122,17);
 detailBody+=`<g fill="${ink}" transform="translate(356 ${y+(key==='brackets'?34:64)})">${details[key].map((g,j)=>`<g transform="translate(${j*74} 0) scale(2.4) translate(${-g.bounds[0]} ${-g.bounds[1]})"><path d="${g.d}"/></g>`).join('')}</g>`;
 detailBody+=text(rightNote,330,y+122,17);
});
detailBody+=text('Enlarged independently to inspect construction.',0,646,17);
writeFileSync('images/comparison-monolisa-vs-berkeley-mono-details.svg',svg(detailBody,660,700,'Enlarged r, e, and brackets in MonoLisa and Berkeley Mono; circles highlight the baseline foot on MonoLisa r and the straight stem on Berkeley r'));
