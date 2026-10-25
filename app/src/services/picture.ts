// Meal pictures, drawn from the ingredients as an SVG string. Ported unchanged from the single-file app.
/* eslint-disable no-var */
import { MIXCOLS, SHAPE_COUNT } from '../data/fixed';
import { rng } from './util';
import { ING } from './catalog';

function esc(s: string): string { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]); }

function lighten(hex: string, amt: number): string {
  var n=parseInt(hex.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;
  r=Math.round(r+(255-r)*amt); g=Math.round(g+(255-g)*amt); b=Math.round(b+(255-b)*amt);
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
function darken(hex: string, amt: number): string {
  var n=parseInt(hex.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;
  r=Math.round(r*(1-amt)); g=Math.round(g*(1-amt)); b=Math.round(b*(1-amt));
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
function drawShape(shape: string, col: string, x: number, y: number, R: () => number, s: number): string {
  var a=Math.round(R()*180), t='transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+a+') scale('+s+')"';
  switch(shape){
    case 'grain': return '<ellipse '+t+' rx="1.4" ry="0.75" fill="'+col+'" stroke="'+darken(col,.12)+'" stroke-width=".25"/>';
    case 'crumble': return '<circle '+t+' r="'+(1.4+R()*0.9).toFixed(2)+'" fill="'+(R()<.5?col:darken(col,.12))+'"/>';
    case 'curd': return '<circle '+t+' r="1.5" fill="'+col+'" stroke="'+darken(col,.08)+'" stroke-width=".3"/>';
    case 'round': return '<g '+t+'><circle r="5" fill="'+col+'"/><circle cx="-1.6" cy="-1.6" r="1.4" fill="'+lighten(col,.35)+'"/></g>';
    case 'coin': return '<g '+t+'><circle r="4.2" fill="'+darken(col,.15)+'"/><circle r="3.3" fill="'+lighten(col,.3)+'"/></g>';
    case 'stick': return '<rect '+t+' x="-1.3" y="-5.5" width="2.6" height="11" rx="1.3" fill="'+col+'"/>';
    case 'bit': return '<rect '+t+' x="-1.4" y="-1.1" width="2.8" height="2.2" rx=".6" fill="'+col+'"/>';
    case 'floret': return '<g '+t+'><rect x="-.8" y="0" width="1.6" height="4" fill="'+lighten(col,.25)+'"/><circle cx="-2" cy="-.5" r="2.4" fill="'+col+'"/><circle cx="2" cy="-.5" r="2.4" fill="'+col+'"/><circle cx="0" cy="-2.4" r="2.6" fill="'+darken(col,.08)+'"/></g>';
    case 'leaf': return '<g '+t+'><ellipse rx="5.2" ry="2.3" fill="'+col+'"/><path d="M-4.5 0H4.5" stroke="'+lighten(col,.3)+'" stroke-width=".4"/></g>';
    case 'chunk': return '<rect '+t+' x="-3.2" y="-2.6" width="6.4" height="5.2" rx="1.6" fill="'+col+'" stroke="'+darken(col,.12)+'" stroke-width=".4"/>';
    case 'shred': return '<rect '+t+' x="-.6" y="-4.5" width="1.2" height="9" rx=".6" fill="'+col+'"/>';
    case 'wedge': return '<g '+t+'><path d="M-5 0A5 5 0 0 1 5 0Z" fill="'+col+'"/><path d="M-3.8 -.3A3.8 3.8 0 0 1 3.8 -.3Z" fill="'+lighten(col,.4)+'"/></g>';
    case 'herb': return '<rect '+t+' x="-.45" y="-1.6" width=".9" height="3.2" rx=".45" fill="'+col+'"/>';
    case 'slab': return '<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+(a%40-20)+') scale('+s+')"><rect x="-12" y="-7" width="24" height="14" rx="6" fill="'+col+'" stroke="'+darken(col,.15)+'" stroke-width=".6"/><path d="M-7 -4l4 8M-1 -4l4 8M5 -4l3 6" stroke="'+darken(col,.22)+'" stroke-width="1" stroke-linecap="round" opacity=".55"/></g>';
    case 'strip': return '<rect '+t+' x="-4.5" y="-1.4" width="9" height="2.8" rx="1.4" fill="'+col+'"/>';
    case 'slice': return '<rect transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+(a%30-15)+') scale('+s+')" x="-7" y="-5" width="14" height="10" rx="3.5" fill="'+col+'" stroke="'+darken(col,.15)+'" stroke-width=".5"/>';
    case 'egg': return '<g '+t+'><ellipse rx="4.4" ry="3.4" fill="'+col+'"/><ellipse cx="-1.2" cy="-.8" rx="1.6" ry="1" fill="'+lighten(col,.4)+'"/></g>';
    case 'mound': return '<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') scale('+s+')"><ellipse rx="15" ry="11" fill="'+darken(col,.06)+'"/><ellipse cx="-2" cy="-2" rx="12" ry="8" fill="'+col+'"/></g>';
    case 'cube': return '<rect '+t+' x="-1.8" y="-1.8" width="3.6" height="3.6" rx=".6" fill="'+col+'" stroke="'+darken(col,.1)+'" stroke-width=".3"/>';
    case 'bread': return '<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+(a%30-15)+') scale('+s+')"><rect x="-8.5" y="-7.5" width="17" height="15" rx="4" fill="'+col+'"/><rect x="-6.6" y="-5.6" width="13.2" height="11.2" rx="3" fill="'+lighten(col,.25)+'"/></g>';
    case 'wrap': return '<g transform="translate('+x.toFixed(1)+' '+y.toFixed(1)+') rotate('+(a%40-20)+') scale('+s+')"><rect x="-14" y="-5" width="28" height="10" rx="5" fill="'+col+'" stroke="'+darken(col,.15)+'" stroke-width=".6"/><circle cx="11" cy="0" r="3.2" fill="#78B85A"/><circle cx="11" cy="0" r="1.6" fill="#E7C9A0"/></g>';
    case 'pasta': return '<rect '+t+' x="-3.2" y="-1.1" width="6.4" height="2.2" rx="1.1" fill="'+col+'" stroke="'+darken(col,.15)+'" stroke-width=".3"/>';
    case 'nut': return '<g '+t+'><ellipse rx="2.6" ry="1.9" fill="'+col+'"/><path d="M-1.8 0H1.8" stroke="'+darken(col,.25)+'" stroke-width=".4"/></g>';
    case 'seed': return '<ellipse '+t+' rx="1.5" ry=".75" fill="'+col+'"/>';
    case 'bean': return '<ellipse '+t+' rx="2.3" ry="1.4" fill="'+col+'" stroke="'+lighten(col,.2)+'" stroke-width=".3"/>';
    case 'berry': return '<g '+t+'><circle r="2.7" fill="'+col+'"/><circle cx="-.8" cy="-.8" r=".6" fill="'+lighten(col,.4)+'"/></g>';
    case 'mix': const mc=MIXCOLS[Math.floor(R()*MIXCOLS.length)]; return R()<.5?'<rect '+t+' x="-1.2" y="-4" width="2.4" height="8" rx="1.2" fill="'+mc+'"/>':'<rect '+t+' x="-1.8" y="-1.5" width="3.6" height="3" rx=".8" fill="'+mc+'"/>';
  }
  return '';
}
var TABLE: Record<string, string> = {breakfast:'#EFE2C6',lunch:'#DCE6D2',dinner:'#E4D6DB',snack:'#E1E0EE'};
const imgCache: Record<string, string> = {};
export function mealImage(m: { id: string; ing: [string, number][]; types: string[]; style?: string; base?: string; name: string }, label?: string): string {
  var key=m.id+'|'+m.ing.map(function(x: [string, number]){return x[0];}).join(',');
  if(imgCache[key]) return imgCache[key];
  var R=rng(m.id), cx=80, cy=50, out='';
  var table=TABLE[m.types[0]]||'#E4E6DF';
  out+='<rect width="160" height="100" fill="'+table+'"/>';
  for(var k=0;k<7;k++) out+='<rect x="0" y="'+(k*15+4)+'" width="160" height="1.2" fill="'+darken(table,.05)+'"/>';
  var ings=m.ing.filter(function(x: [string, number]){return ING[x[0]]&&ING[x[0]].shape!=='none';}).slice().sort(function(a: [string, number], b: [string, number]){return b[1]-a[1];});
  if(m.style==='bowl'){
    var base=ING[m.base!]||ING[ings[0][0]];
    out+='<ellipse cx="'+(cx+2)+'" cy="'+(cy+3)+'" rx="42" ry="41" fill="rgba(0,0,0,.08)"/>';
    out+='<circle cx="'+cx+'" cy="'+cy+'" r="41" fill="#F3F1EA"/><circle cx="'+cx+'" cy="'+cy+'" r="34" fill="'+(base.col||'#E9E4D6')+'"/>';
    out+='<circle cx="'+(cx-8)+'" cy="'+(cy-9)+'" r="16" fill="'+lighten(base.col||'#E9E4D6',.18)+'" opacity=".5"/>';
    ings.forEach(function(x: [string, number]){
      var it=ING[x[0]]; if(it===base||it.shape==='sauce'||it.shape==='mound') return;
      var n=Math.max(2,Math.round((SHAPE_COUNT[it.shape]||6)*0.55*(x[1]<20?0.6:1)));
      if(it.shape==='grain'&&m.base==='platki') return;
      for(var i=0;i<n;i++){ var ang=R()*Math.PI*2, rr=Math.sqrt(R())*26; out+=drawShape(it.shape,it.col,cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr,R,1.15); }
    });
  } else {
    out+='<ellipse cx="'+(cx+2)+'" cy="'+(cy+3)+'" rx="45" ry="44" fill="rgba(0,0,0,.08)"/>';
    out+='<circle cx="'+cx+'" cy="'+cy+'" r="44" fill="#FBFBF8"/><circle cx="'+cx+'" cy="'+cy+'" r="36" fill="#F3F2EC"/>';
    var sauce=ings.filter(function(x: [string, number]){return ING[x[0]].shape==='sauce';})[0];
    if(sauce) out+='<circle cx="'+cx+'" cy="'+cy+'" r="27" fill="'+ING[sauce[0]].col+'" opacity=".92"/>';
    var mains=ings.filter(function(x: [string, number]){return ING[x[0]].shape!=='sauce'&&x[1]>15;}).slice(0,4);
    var tops=ings.filter(function(x: [string, number]){return ING[x[0]].shape!=='sauce'&&x[1]<=15;});
    var tot=0; mains.forEach(function(x: [string, number]){tot+=Math.sqrt(x[1]);});
    var a0=-Math.PI/2+R()*0.6;
    mains.forEach(function(x: [string, number]){
      var it=ING[x[0]], span=Math.PI*2*Math.sqrt(x[1])/tot, a1=a0+span, mid=(a0+a1)/2;
      var big: Record<string, 1> = {slab:1,wrap:1,mound:1,bread:1,slice:1,wedge:1};
      var n=SHAPE_COUNT[it.shape]||6;
      if(big[it.shape]){
        for(var i=0;i<n;i++){ var off=(i-(n-1)/2)*0.38; var rr=it.shape==='mound'?14:17; out+=drawShape(it.shape,it.col,cx+Math.cos(mid+off)*rr,cy+Math.sin(mid+off)*rr,R,mains.length>2?1:1.15); }
      } else {
        for(var j=0;j<n;j++){ var ang=a0+0.12+R()*(span-0.24), r2=7+Math.sqrt(R())*22; out+=drawShape(it.shape,it.col,cx+Math.cos(ang)*r2,cy+Math.sin(ang)*r2,R,1.35); }
      }
      a0=a1;
    });
    tops.forEach(function(x: [string, number]){ var it=ING[x[0]], n=Math.max(2,Math.round((SHAPE_COUNT[it.shape]||6)*0.5));
      for(var i=0;i<n;i++){ var ang=R()*Math.PI*2, rr=Math.sqrt(R())*28; out+=drawShape(it.shape,it.col,cx+Math.cos(ang)*rr,cy+Math.sin(ang)*rr,R,1.1); } });
  }
  var html='<svg class="mimg" viewBox="0 0 160 100" role="img" aria-label="'+esc(label||m.name)+'">'+out+'</svg>';
  imgCache[key]=html; return html;
}
