'use strict';
const data=JSON.parse(document.getElementById('data').textContent);
const byId=id=>document.getElementById(id);
const canvas=byId('map'),ctx=canvas.getContext('2d');
// Fixed coordinates keep the pigment geometry consistent on any display.
const W=1000,H=620,DPR=1.6;
const dry=document.createElement('canvas');dry.width=canvas.width;dry.height=canvas.height;
const dryCtx=dry.getContext('2d');dryCtx.scale(DPR,DPR);
function layer(ratio=DPR){const c=document.createElement('canvas');c.width=Math.round(W*ratio);c.height=Math.round(H*ratio);const g=c.getContext('2d');g.scale(ratio,ratio);return {canvas:c,ctx:g};}
const experience=JSON.parse(byId('experience').textContent);
const colors=data.map(t=>t.initialColor||experience.color);
const colorNames=data.map(t=>t.initialColorName||experience.colorName);
const trackTitle=t=>t.series?`${t.id} · ${t.series}`:t.id;
const points=JSON.parse(byId('map-frame').textContent);
const lat0=points.reduce((s,p)=>s+p[1],0)/points.length;
// Web Mercator, scaled to local metres at the mean track latitude.
// Tiles and tracks use exactly the same transform.
const correction=Math.cos(lat0*Math.PI/180);
const project=p=>[p[2]*Math.PI/180*6371000*correction,-Math.log(Math.tan(Math.PI/4+p[1]*Math.PI/360))*6371000*correction];
const pp=points.map(project),xs=pp.map(p=>p[0]),ys=pp.map(p=>p[1]);
const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
const scale=Math.min(850/(maxX-minX),395/(maxY-minY));
const ox=(W-(maxX-minX)*scale)/2,oy=120+(395-(maxY-minY)*scale)/2;
const xy=p=>{const [x,y]=project(p);return [ox+(x-minX)*scale,oy+(y-minY)*scale];};
function random(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let a=Math.imul(seed^seed>>>15,1|seed);a=a+Math.imul(a^a>>>7,61|a)^a;return ((a^a>>>14)>>>0)/4294967296;};}
// Fractal blooms and branching capillaries, generated locally and reproducibly.
// The three stages have different extents: pigment spreads unevenly, not as a disk.
function makeStamp(color,seed,stage){
 const c=document.createElement('canvas');c.width=c.height=192;const g=c.getContext('2d'),rng=random(seed);
 const rgb=color.match(/\w\w/g).map(s=>parseInt(s,16)),ink=a=>`rgba(${rgb.join(',')},${a})`;
 const lobes=Array.from({length:9},()=>({angle:rng()*Math.PI*2,width:.12+rng()*.35,height:9+rng()*29}));
 const phase=rng()*6.28, stretch=.65+rng()*.65;
 const contour=[];
 for(let j=0;j<160;j++){
  const angle=j/160*Math.PI*2;
  let radius=23+Math.sin(angle*3+phase)*5+Math.sin(angle*7-phase)*3;
  for(const l of lobes){const d=Math.atan2(Math.sin(angle-l.angle),Math.cos(angle-l.angle));radius+=l.height*Math.exp(-d*d/(l.width*l.width));}
  radius+=(rng()-.5)*7;
  radius*=.48+stage*.26;
  contour.push([96+Math.cos(angle)*radius,96+Math.sin(angle)*radius*stretch]);
 }
 const outline=()=>{g.beginPath();contour.forEach((p,j)=>j?g.lineTo(...p):g.moveTo(...p));g.closePath();};
 // Thin capillary branches at the advancing wet edge.
 if(stage>0)for(let j=0;j<40;j++){
  const p=contour[Math.floor(rng()*contour.length)];let x=p[0],y=p[1];const angle=Math.atan2(y-96,x-96);
  g.beginPath();g.moveTo(x,y);
  const n=3+Math.floor(rng()*7);
  for(let k=0;k<n;k++){x+=Math.cos(angle)*(1+rng()*2)+(rng()-.5)*4;y+=Math.sin(angle)*(1+rng()*2)+(rng()-.5)*4;g.lineTo(x,y);}
  g.strokeStyle=ink(.04+rng()*.10);g.lineWidth=.3+rng()*.7;g.stroke();
 }
 g.save();g.filter='blur(.7px)';outline();g.fillStyle=ink(.12);g.fill();g.restore();
 outline();g.fillStyle=ink(.08);g.fill();g.save();g.clip();
 for(let j=0;j<18;j++){
  const x=60+rng()*70,y=65+rng()*60,r=5+rng()*28;
  const grad=g.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,ink(.04+rng()*.12));grad.addColorStop(1,ink(0));g.fillStyle=grad;g.fillRect(x-r,y-r,r*2,r*2);
 }
 // Paper-sized voids and pigment granules interrupt the wash.
 for(let j=0;j<650;j++){g.fillStyle=ink(.06+rng()*.28);g.fillRect(30+rng()*132,30+rng()*132,.3+rng()*1.2,.3+rng()*.9);}
 g.globalCompositeOperation='destination-out';for(let j=0;j<100;j++){g.globalAlpha=.12+rng()*.4;g.fillRect(30+rng()*132,30+rng()*132,1+rng()*2,.3+rng()*1.2);}g.restore();
 // Broken tide marks, never a uniform outline.
 for(let j=0;j<160;j++){if(rng()<.45)continue;const a=contour[j],b=contour[(j+1)%160];g.beginPath();g.moveTo(...a);g.lineTo(...b);g.strokeStyle=ink(.12+rng()*.23);g.lineWidth=.4+rng()*.7;g.stroke();}
 if(experience.combined){
  const small=document.createElement('canvas');small.width=small.height=128;small.getContext('2d').drawImage(c,0,0,128,128);return small;
 }
 return c;
}
const basemap=layer(),hazyMap=layer(),revealedMap=layer(),revealMask=layer(),finalPrint=layer();
let revealDirty=true,revealIndex=0,revealTime=-Infinity;
// Fixed, soft impressions make the reveal independent of playback frame rate.
const revealBrush=document.createElement('canvas');revealBrush.width=revealBrush.height=128;
const brushContext=revealBrush.getContext('2d');
const halo=brushContext.createRadialGradient(64,64,0,64,64,64);
halo.addColorStop(0,'#ffffffff');halo.addColorStop(.28,'#ffffffdd');
halo.addColorStop(.65,'#ffffff35');halo.addColorStop(1,'#ffffff00');
brushContext.fillStyle=halo;brushContext.fillRect(0,0,128,128);
function resetExploration(){
 revealMask.ctx.clearRect(0,0,W,H);revealIndex=0;revealTime=-Infinity;revealDirty=true;
}
function monochromeSurface(g){
 const image=g.getImageData(0,0,g.canvas.width,g.canvas.height),pixels=image.data;
 for(let i=0;i<pixels.length;i+=4){const grey=Math.round(.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2]);pixels[i]=pixels[i+1]=pixels[i+2]=grey;}
 g.putImageData(image,0,0);
}
function refreshHazyMap(){
 const g=hazyMap.ctx;g.save();g.globalCompositeOperation='source-over';g.globalAlpha=1;g.filter='none';
 g.fillStyle='#f2f2f2';g.fillRect(0,0,W,H);paperMaterial(g);
 g.globalCompositeOperation='source-over';g.globalAlpha=.16;g.filter='blur(7px)';
 g.drawImage(basemap.canvas,0,0,W,H);g.restore();monochromeSurface(g);revealDirty=true;
 // Only the outer margins dissolve into the paper in the closing print.
 const f=finalPrint.ctx;f.save();f.globalCompositeOperation='source-over';f.clearRect(0,0,W,H);f.drawImage(basemap.canvas,0,0,W,H);
 f.globalCompositeOperation='destination-in';
 for(const [x0,y0,x1,y1] of [[0,0,55,0],[W,0,W-55,0],[0,0,0,32],[0,H,0,H-32]]){
  const edge=f.createLinearGradient(x0,y0,x1,y1);edge.addColorStop(0,'#0000');edge.addColorStop(1,'#000');f.fillStyle=edge;f.fillRect(0,0,W,H);
 }
 f.restore();
}
function paperMaterial(g){
 const rng=random(74931);
 // Large, low-contrast stains and local changes of paper density.
 g.globalCompositeOperation='multiply';
 for(let j=0;j<22;j++){
  const x=rng()*W,y=rng()*H,r=35+rng()*190;
  const stain=g.createRadialGradient(x,y,0,x,y,r);stain.addColorStop(0,`rgba(108,95,84,${.012+rng()*.025})`);stain.addColorStop(1,'rgba(108,95,84,0)');g.fillStyle=stain;g.fillRect(x-r,y-r,r*2,r*2);
 }
 // Visible fibres and pores, deterministic rather than animated noise.
 for(let j=0;j<17000;j++){
  g.fillStyle=rng()>.55?'rgba(101,94,85,.04)':'rgba(255,254,250,.23)';
  g.fillRect(rng()*W,rng()*H,.25+rng()*.8,.2+rng()*.65);
 }
 g.lineWidth=.25;
 for(let j=0;j<1200;j++){
  const x=rng()*W,y=rng()*H;g.strokeStyle=`rgba(104,97,88,${.015+rng()*.035})`;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+2,y-1,x+2+rng()*7,y+(rng()-.5)*3);g.stroke();
 }
 g.globalCompositeOperation='source-over';
 // Gentle fold shadows with a light ridge; they remain beneath the ink.
 for(const x of [333,667]){
  const fold=g.createLinearGradient(x-7,0,x+7,0);fold.addColorStop(0,'#71502b00');fold.addColorStop(.4,'#71502b0c');fold.addColorStop(.52,'#fffdfa20');fold.addColorStop(1,'#71502b00');g.fillStyle=fold;g.fillRect(x-7,0,14,H);
 }
 const crease=g.createLinearGradient(0,305,0,318);crease.addColorStop(0,'#71502b00');crease.addColorStop(.45,'#71502b09');crease.addColorStop(.6,'#fffdfa17');crease.addColorStop(1,'#71502b00');g.fillStyle=crease;g.fillRect(0,305,W,13);
 const edge=g.createRadialGradient(W/2,H/2,230,W/2,H/2,610);edge.addColorStop(0,'#72502400');edge.addColorStop(1,'#786f6315');g.fillStyle=edge;g.fillRect(0,0,W,H);
}
const cartography=JSON.parse(byId('cartography').textContent);
let cartographyReady=false;
function paintBasemap(tiles=[]){
 const g=basemap.ctx;g.clearRect(0,0,W,H);g.fillStyle='#f2f2f2';g.fillRect(0,0,W,H);
 // Feather the original topographic coverage into the wider road network.
 const raster=layer(),rg=raster.ctx,bounds=[];
 for(const tile of tiles){
  const n=2**tile.z,lon=x=>x/n*360-180,lat=y=>Math.atan(Math.sinh(Math.PI*(1-2*y/n)))*180/Math.PI;
  const a=xy([0,lat(tile.y),lon(tile.x)]),b=xy([0,lat(tile.y+1),lon(tile.x+1)]);
  rg.drawImage(tile.bitmap,a[0],a[1],b[0]-a[0],b[1]-a[1]);bounds.push(a,b);
 }
 if(bounds.length){
  const left=Math.min(...bounds.map(p=>p[0])),right=Math.max(...bounds.map(p=>p[0]));
  const top=Math.min(...bounds.map(p=>p[1])),bottom=Math.max(...bounds.map(p=>p[1]));
  rg.globalCompositeOperation='destination-in';
  for(const [x0,y0,x1,y1] of [[left,0,left+35,0],[right,0,right-35,0],[0,top,0,top+35],[0,bottom,0,bottom-35]]){
   const fade=rg.createLinearGradient(x0,y0,x1,y1);fade.addColorStop(0,'#0000');fade.addColorStop(1,'#000');rg.fillStyle=fade;rg.fillRect(0,0,W,H);
  }
 }
 g.save();g.globalCompositeOperation='multiply';g.globalAlpha=.42;g.filter='grayscale(1) contrast(1.18) brightness(1.08)';
 g.drawImage(raster.canvas,0,0,W,H);
 g.restore();
 // An independent ink plate keeps the paper grain out of the moving pigments.
 const plate=layer(),ink=plate.ctx,rng=random(92841);
 ink.lineCap='round';ink.lineJoin='round';
 for(const road of cartography.roads){
  const major=['primary','primary_link','secondary','secondary_link','tertiary','tertiary_link'].includes(road.kind);
  const trail=['path','footway','steps','track','cycleway','bridleway'].includes(road.kind);
  const width=major?2.05:trail?.65:1.2;
  ink.beginPath();road.points.forEach(([lon,lat],i)=>{const p=xy([0,lat,lon]);if(i)ink.lineTo(...p);else ink.moveTo(...p);});
  ink.setLineDash(trail?[1.4,1.1]:[]);ink.globalAlpha=.82+rng()*.15;ink.strokeStyle='#101010';ink.lineWidth=width;ink.stroke();
  if(!trail){ink.globalAlpha=.92;ink.strokeStyle='#f2f2f2';ink.lineWidth=major?.85:.35;ink.stroke();}
 }
 ink.globalAlpha=1;ink.setLineDash([]);
 // OSM names complement the existing topographic labels, never inventing places.
 const labelBoxes=[],named=new Set();ink.save();ink.font='9.5px Georgia,serif';ink.textAlign='center';ink.textBaseline='middle';ink.lineJoin='round';
 for(const label of cartography.road_names){
  const [lon,lat]=label.at,[x,y]=xy([0,lat,lon]);
  if(x<35||x>W-35||y<35||y>H-35||named.has(label.name))continue;
  const width=ink.measureText(label.name).width;
  if(width>170||labelBoxes.some(p=>Math.abs(p.x-x)<(p.width+width)/2+12&&Math.abs(p.y-y)<28))continue;
  const [a,b]=label.tangent.map(([lo,la])=>xy([0,la,lo]));let angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
  if(angle>Math.PI/2)angle-=Math.PI;if(angle<-Math.PI/2)angle+=Math.PI;
  ink.save();ink.translate(x,y);ink.rotate(angle);ink.strokeStyle='#f2f2f2';ink.lineWidth=2.8;ink.strokeText(label.name,0,-5);ink.fillStyle='#101010';ink.fillText(label.name,0,-5);ink.restore();
  labelBoxes.push({x,y,width});named.add(label.name);
 }
 ink.restore();
 // Small missing deposits and fine fibres mimic ink caught by paper, not blur.
 ink.save();ink.globalCompositeOperation='destination-out';
 for(let j=0;j<22000;j++){
  ink.fillStyle=`rgba(0,0,0,${.12+rng()*.34})`;ink.fillRect(rng()*W,rng()*H,.18+rng()*.55,.15+rng()*.45);
 }
 ink.lineWidth=.22;
 for(let j=0;j<1400;j++){
  const x=rng()*W,y=rng()*H;ink.strokeStyle=`rgba(0,0,0,${.15+rng()*.3})`;
  ink.beginPath();ink.moveTo(x,y);ink.quadraticCurveTo(x+1.5,y-.6,x+2+rng()*3,y+(rng()-.5)*1.7);ink.stroke();
 }
 ink.restore();g.save();g.globalCompositeOperation='multiply';g.drawImage(plate.canvas,0,0,W,H);g.restore();
 paperMaterial(g);monochromeSurface(g);refreshHazyMap();
}
paintBasemap();
Promise.all(cartography.tiles.map(tile=>new Promise((resolve,reject)=>{
 const bitmap=new Image();bitmap.onload=()=>resolve({...tile,bitmap});bitmap.onerror=()=>reject(new Error('Tessera incorporata non leggibile'));bitmap.src=tile.image;
}))).then(tiles=>{paintBasemap(tiles);cartographyReady=true;byId('export-jpeg').disabled=false;byId('map-status').textContent='';render();}).catch(()=>{byId('map-status').textContent=' · Impossibile leggere la base cartografica';});
const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const maxTime=Math.max(...data.map(t=>t.duration));
let time=0,showFullMap=false,playing=false,animation=null,last=null,spread=.65,dryIndex=0,dryTime=-Infinity;
// Trial based on commit 08757a1: restore that revision to undo this finale.
let finaleProgress=0,finaleFrame=null,finaleLast=null;
function stopFinale(){if(finaleFrame!==null)cancelAnimationFrame(finaleFrame);finaleFrame=null;finaleLast=null;}
function updateFinale(){
 if(time<maxTime&&!showFullMap){stopFinale();finaleProgress=0;return;}
 if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){stopFinale();finaleProgress=1;return;}
 if(finaleProgress<1&&finaleFrame===null&&!document.hidden)finaleFrame=requestAnimationFrame(animateFinale);
}
function animateFinale(now){
 finaleFrame=null;
 if(time<maxTime&&!showFullMap)return;
 if(finaleLast!==null)finaleProgress=Math.min(1,finaleProgress+Math.min(100,now-finaleLast)/3000);
 finaleLast=now;render();
}
const stamps=[],revealEvents=[];
data.forEach((t,i)=>{
 t.color=colors[i];t.colorName=colorNames[i];t.paletteIndex=i;t.visible=true;t.paper=layer(experience.combined?1:DPR);t.parts=t.segments.map(points=>({points,coords:points.map(xy)}));
 t.sprites=Array.from({length:9},(_,j)=>Array.from({length:3},(_,stage)=>makeStamp(t.color,i*101+j+1,stage)));
 // Keep segment boundaries: no cartography is revealed across gaps in a GPX.
 for(const part of t.parts){
  let previous=null,lastTime=-Infinity;
  part.points.forEach((p,j)=>{
   const pos=part.coords[j];
   if(!previous||Math.hypot(pos[0]-previous[0],pos[1]-previous[1])>=1.5||p[0]-lastTime>=10||j===part.points.length-1){
    revealEvents.push({t:p[0],x:pos[0],y:pos[1],owner:t});previous=pos;lastTime=p[0];
   }
  });
 }
 const rng=random(321+i*793);
 for(const part of t.parts){let prev=null,prevTime=-Infinity;part.points.forEach((p,j)=>{
  const pos=part.coords[j];
  if(!prev||p[0]-prevTime>=4||j===part.points.length-1){const m=motion(t,p[0]);stamps.push({t:p[0],x:pos[0]+(rng()-.5)*2,y:pos[1]+(rng()-.5)*2,owner:t,variant:Math.floor(rng()*9),radius:(17+rng()*22)*(1.35-Math.min(m.speed/9,1)*.65),angle:rng()*Math.PI*2,aspect:.55+rng()*.8,opacity:.5+rng()*.7});prev=pos;prevTime=p[0];}
 });}
 const button=document.createElement('button');button.type='button';button.className='track';button.style.setProperty('--color',t.color);button.setAttribute('aria-pressed','true');button.setAttribute('aria-label',`Mostra o nascondi il percorso ${trackTitle(t)}`);
 button.innerHTML=`<span class="swatch"></span><span class="track-name"><span class="track-color-name">${trackTitle(t)} · ${t.colorName}</span><span class="track-meta">${(t.distance/1000).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2})} km · ${fmt(t.duration)}</span></span><span class="track-live"><span class="status"></span><span class="speed-readout"></span><span class="speed-meter"><span></span></span></span>`;
 t.status=button.querySelector('.status');t.speedReadout=button.querySelector('.speed-readout');t.speedMeter=button.querySelector('.speed-meter span');button.onclick=()=>{t.visible=!t.visible;button.setAttribute('aria-pressed',String(t.visible));resetPaper();render();};const row=document.createElement('div');row.className='track-row';row.appendChild(button);
 const picker=document.createElement('input');picker.type='color';picker.className='color-picker';picker.value=t.color;picker.setAttribute('aria-label',`Colore della traccia ${trackTitle(t)}`);picker.title=`Cambia colore di ${trackTitle(t)}`;const locate=document.createElement('button');locate.type='button';locate.className='locate';locate.textContent='⌖';locate.setAttribute('aria-label',`Esplora il luogo di ${trackTitle(t)}`);locate.title='Esplora questo luogo';locate.onclick=()=>openPlace(t);row.appendChild(locate);row.appendChild(picker);byId('tracks').appendChild(row);
 t.button=button;t.picker=picker;t.colorLabel=button.querySelector('.track-color-name');
 let recolorTimer;
 const applyColor=()=>{clearTimeout(recolorTimer);if(t.color===picker.value)return;recolor(t,picker.value);};
 picker.addEventListener('input',()=>{clearTimeout(recolorTimer);recolorTimer=setTimeout(applyColor,100);});picker.addEventListener('change',applyColor);
});
stamps.sort((a,b)=>a.t-b.t);
revealEvents.sort((a,b)=>a.t-b.t);
function drawCartography(){
 if(time<revealTime)resetExploration();
 while(revealIndex<revealEvents.length&&revealEvents[revealIndex].t<=time){
  const event=revealEvents[revealIndex++];
  if(event.owner.visible){revealMask.ctx.drawImage(revealBrush,event.x-36,event.y-36,72,72);revealDirty=true;}
 }
 revealTime=time;
 if(revealDirty){
  const g=revealedMap.ctx;g.save();g.globalCompositeOperation='source-over';g.clearRect(0,0,W,H);
  g.drawImage(basemap.canvas,0,0,W,H);g.globalCompositeOperation='destination-in';
  g.drawImage(revealMask.canvas,0,0,W,H);g.restore();revealDirty=false;
 }
 ctx.drawImage(hazyMap.canvas,0,0,W,H);ctx.drawImage(revealedMap.canvas,0,0,W,H);
 if(finaleProgress>0){
  ctx.save();ctx.globalAlpha=finaleProgress*finaleProgress*(3-2*finaleProgress);
  ctx.drawImage(finalPrint.canvas,0,0,W,H);ctx.restore();
 }
}
function recolor(t,value){
 t.color=value;const match=colors.indexOf(value.toLowerCase());t.colorName=match<0?value.toUpperCase():colorNames[match];
 t.button.style.setProperty('--color',value);t.colorLabel.textContent=`${trackTitle(t)} · ${t.colorName}`;
 t.sprites=Array.from({length:9},(_,j)=>Array.from({length:3},(_,stage)=>makeStamp(value,t.paletteIndex*101+j+1,stage)));
 resetPaper();render();
}
function resetPaper(){resetExploration();for(const t of data)t.paper.ctx.clearRect(0,0,W,H);dryIndex=0;dryTime=-Infinity;}
function deposit(g,s,maturity){
 const r=s.radius*spread;
 g.save();g.translate(s.x,s.y);g.rotate(s.angle);g.scale(1,s.aspect);
 // Crossfade fixed irregular fronts, rather than uniformly enlarging a circle.
 const phase=maturity*2,lo=Math.floor(phase),hi=Math.min(2,lo+1),f=phase-lo;
 for(const [stage,weight] of [[lo,1-f],[hi,f]]){if(weight<=0)continue;g.globalAlpha=(.26+.06*maturity)*s.opacity*weight;g.drawImage(s.owner.sprites[s.variant][stage],-r,-r,r*2,r*2);}
 g.restore();
}
function position(t,at=time){let pos=t.parts[0].coords[0];for(const part of t.parts){if(at<part.points[0][0])break;let lo=0,hi=part.points.length;while(lo<hi){const mid=(lo+hi)>>1;if(part.points[mid][0]<=at)lo=mid+1;else hi=mid;}pos=part.coords[Math.max(0,lo-1)];if(lo>0&&lo<part.points.length){const a=part.points[lo-1][0],b=part.points[lo][0],f=b===a?1:(at-a)/(b-a);pos=pos.map((v,k)=>v+(part.coords[lo][k]-v)*f);}}return pos;}
function motion(t,at=time){
 // A 12-second local window reduces one-second GPS jitter. Do not bridge GPX gaps.
 const part=t.parts.find(p=>at>=p.points[0][0]&&at<=p.points[p.points.length-1][0]);
 if(!part)return {speed:0,angle:0};
 const a=Math.max(part.points[0][0],at-6),b=Math.min(part.points[part.points.length-1][0],at+6);
 const p=position(t,a),q=position(t,b),dx=q[0]-p[0],dy=q[1]-p[1];
 return {speed:b>a?Math.hypot(dx,dy)/scale/(b-a)*3.6:0,angle:Math.atan2(dy,dx)};
}
function drawDrop(t,pos,m){
 const v=Math.min(m.speed/8,1),tail=5+v*7;
 ctx.save();ctx.globalCompositeOperation=experience.combined?'multiply':'source-over';ctx.translate(...pos);ctx.rotate(m.angle);ctx.scale(1.5,1.5);ctx.shadowColor=t.color+'44';ctx.shadowBlur=2;ctx.shadowOffsetY=1;
 // A rounded, wet head with a tapered tail that lengthens with ground speed.
 ctx.beginPath();ctx.moveTo(-tail,0);ctx.bezierCurveTo(-7,-1,-4,-5,0,-5);ctx.bezierCurveTo(8,-7,10,5,2,6);ctx.bezierCurveTo(-3,7,-7,2,-tail,0);ctx.closePath();
 const wet=ctx.createLinearGradient(-tail,0,8,0);wet.addColorStop(0,t.color+'16');wet.addColorStop(.55,t.color+'c0');wet.addColorStop(1,t.color);ctx.fillStyle=wet;ctx.fill();ctx.strokeStyle=t.color+'aa';ctx.lineWidth=.6;ctx.stroke();
 ctx.globalCompositeOperation='source-over';ctx.beginPath();ctx.ellipse(3,-2,2.2,.9,-.3,0,Math.PI*2);ctx.fillStyle='#ffffffaa';ctx.fill();ctx.restore();
}
// Viewport changes never alter the geographic coordinates or the play clock.
const view={zoom:1,x:0,y:0};
let selectedTrack=null,viewFrame=null;
function requestView(){if(viewFrame===null)viewFrame=requestAnimationFrame(()=>{viewFrame=null;render();});}
function clampView(){view.x=Math.max(W*(1-view.zoom),Math.min(0,view.x));view.y=Math.max(H*(1-view.zoom),Math.min(0,view.y));}
function zoomAt(point,factor){
 const next=Math.max(1,Math.min(6,view.zoom*factor)),ratio=next/view.zoom;
 view.x=point.x-(point.x-view.x)*ratio;view.y=point.y-(point.y-view.y)*ratio;view.zoom=next;clampView();requestView();
}
function resetView(){view.zoom=1;view.x=view.y=0;requestView();}
function eventPoint(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
function geographicPosition(track){
 const p=position(track),x=(p[0]-ox)/scale+minX,y=(p[1]-oy)/scale+minY;
 return {lat:(2*Math.atan(Math.exp(-y/(6371000*correction)))-Math.PI/2)*180/Math.PI,lon:x/(6371000*correction)*180/Math.PI};
}
function updatePlace(){
 byId('zoom-level').textContent=Math.round(view.zoom*100)+'%';
 byId('zoom-out').disabled=view.zoom<=1;byId('zoom-in').disabled=view.zoom>=6;
 if(!selectedTrack||byId('place-card').hidden)return;
 const p=geographicPosition(selectedTrack),query=p.lat.toFixed(6)+','+p.lon.toFixed(6);
 byId('place-title').textContent=trackTitle(selectedTrack)+' · Esplora il luogo';
 byId('place-coordinates').textContent=p.lat.toFixed(6)+'° N, '+p.lon.toFixed(6)+'° E · '+fmt(Math.min(time,selectedTrack.duration));
 byId('place-maps').href='https://www.google.com/maps/search/?'+new URLSearchParams({api:'1',query});
 byId('place-street').href='https://www.google.com/maps/@?'+new URLSearchParams({api:'1',map_action:'pano',viewpoint:query});
 byId('place-track').value=String(data.indexOf(selectedTrack));
}
function openPlace(track){const wasHidden=byId('place-card').hidden;selectedTrack=track;byId('place-card').hidden=false;updatePlace();requestView();if(wasHidden)requestAnimationFrame(()=>{const box=byId('place-card').getBoundingClientRect(),headerBottom=Math.max(0,document.querySelector('header').getBoundingClientRect().bottom);if(box.top<headerBottom+12||box.bottom>innerHeight-12)window.scrollTo({top:Math.max(0,scrollY+box.top-headerBottom-16),behavior:'instant'});});}
function closePlace(){selectedTrack=null;byId('place-card').hidden=true;canvas.focus({preventScroll:true});requestView();}
function pickTrack(point){
 const r=canvas.getBoundingClientRect(),radius=Math.max(18*W/r.width,12*view.zoom);
 const near=data.filter(t=>t.visible).map(t=>{const p=position(t);return {track:t,d:Math.hypot(point.x-(view.x+p[0]*view.zoom),point.y-(view.y+p[1]*view.zoom))};}).filter(x=>x.d<=radius).sort((a,b)=>a.d-b.d);
 if(near.length)openPlace(near[0].track);
}
canvas.addEventListener('wheel',e=>{
 e.preventDefault();const unit=e.deltaMode===1?16:e.deltaMode===2?canvas.clientHeight:1;
 if(!e.ctrlKey&&(e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)*1.5)){
  const r=canvas.getBoundingClientRect();view.x-=e.deltaX*unit*W/r.width;view.y-=e.deltaY*unit*H/r.height;clampView();requestView();
 }else zoomAt(eventPoint(e),Math.exp(Math.max(-.5,Math.min(.5,-e.deltaY*unit*(e.ctrlKey?.01:.002)))));
},{passive:false});
const pointers=new Map();let gesture=null,press=null,moved=false;
function gestureState(){const p=[...pointers.values()];if(p.length<2)return null;return {x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)};}
canvas.addEventListener('pointerdown',e=>{
 if(e.button!==0)return;canvas.setPointerCapture(e.pointerId);const p=eventPoint(e);pointers.set(e.pointerId,p);
 if(pointers.size===1){press=p;moved=false;}else moved=true;
 gesture=gestureState();canvas.classList.add('is-dragging');
});
canvas.addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId))return;
 const previous=pointers.get(e.pointerId),p=eventPoint(e);pointers.set(e.pointerId,p);
 if(pointers.size>=2){const next=gestureState();if(gesture&&gesture.d>0){view.x+=next.x-gesture.x;view.y+=next.y-gesture.y;zoomAt(next,next.d/gesture.d);}gesture=next;moved=true;}
 else{
  if(press&&Math.hypot(p.x-press.x,p.y-press.y)>4*W/canvas.clientWidth)moved=true;
  if(moved){view.x+=p.x-previous.x;view.y+=p.y-previous.y;clampView();requestView();}
 }
});
function endPointer(e,cancelled=false){
 if(!pointers.has(e.pointerId))return;
 const p=eventPoint(e),wasSingle=pointers.size===1;pointers.delete(e.pointerId);
 if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
 if(!cancelled&&wasSingle&&!moved)pickTrack(p);
 if(!pointers.size){canvas.classList.remove('is-dragging');press=null;}else{press=[...pointers.values()][0];moved=true;}
 gesture=gestureState();
}
canvas.addEventListener('pointerup',e=>endPointer(e));canvas.addEventListener('pointercancel',e=>endPointer(e,true));
canvas.addEventListener('lostpointercapture',e=>{if(pointers.has(e.pointerId))endPointer(e,true);});
canvas.addEventListener('keydown',e=>{
 if(e.key==='+'||e.key==='='){e.preventDefault();zoomAt({x:W/2,y:H/2},1.25);}
 else if(e.key==='-'){e.preventDefault();zoomAt({x:W/2,y:H/2},.8);}
 else if(e.key==='0'){e.preventDefault();resetView();}
 else if(e.key==='Escape'){e.preventDefault();closePlace();}
 else if(e.key==='Enter'){e.preventDefault();const t=selectedTrack||data.find(t=>t.visible);if(t)openPlace(t);}
 else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
  e.preventDefault();view.x+=e.key==='ArrowLeft'?45:e.key==='ArrowRight'?-45:0;view.y+=e.key==='ArrowUp'?45:e.key==='ArrowDown'?-45:0;clampView();requestView();
 }
});
byId('zoom-in').onclick=()=>zoomAt({x:W/2,y:H/2},1.3);byId('zoom-out').onclick=()=>zoomAt({x:W/2,y:H/2},1/1.3);byId('zoom-reset').onclick=resetView;
byId('place-close').onclick=closePlace;byId('place-card').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closePlace();}});
for(const [i,t] of data.entries()){const option=document.createElement('option');option.value=String(i);option.textContent=trackTitle(t);byId('place-track').appendChild(option);}
byId('place-track').onchange=e=>openPlace(data[Number(e.target.value)]);

function render(){
 updateFinale();
 const complete=time>=maxTime,cutoff=complete?maxTime:time-100;
 if(cutoff<dryTime)resetPaper();
 while(dryIndex<stamps.length&&stamps[dryIndex].t<=cutoff){const s=stamps[dryIndex++];deposit(s.owner.paper.ctx,s,1);s.owner.paper.ctx.globalAlpha=1;}
 dryTime=cutoff;dryCtx.globalAlpha=1;
 ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);ctx.save();ctx.translate(view.x,view.y);ctx.scale(view.zoom,view.zoom);ctx.globalCompositeOperation='source-over';drawCartography();
 ctx.globalCompositeOperation='multiply';
 // Source-over within each pigment preserves its hue; multiply between
 // people creates mixtures without blackening a single person's long pauses.
 for(const t of data){if(!t.visible)continue;dryCtx.clearRect(0,0,W,H);dryCtx.globalAlpha=1;dryCtx.globalCompositeOperation='source-over';dryCtx.drawImage(t.paper.canvas,0,0,W,H);
  for(let j=dryIndex;j<stamps.length&&stamps[j].t<=time;j++){const s=stamps[j];if(s.owner===t)deposit(dryCtx,s,Math.min(1,Math.sqrt((time-s.t)/100)));}
  ctx.drawImage(dry,0,0,W,H);
 }
 ctx.globalAlpha=1;
 for(const t of data){
  const arrived=time>=t.duration,m=motion(t),pos=position(t);
  t.status.textContent=!t.visible?'nascosto':arrived?'arrivo':time===0?'partenza':'in cammino';
  t.speedReadout.textContent=!t.visible?'—':arrived?'0,0 km/h':`${m.speed.toFixed(1).replace('.',',')} km/h`;
  t.speedMeter.style.width=`${!t.visible||arrived?0:Math.min(m.speed/8,1)*100}%`;
  if(t.visible&&!complete&&!arrived)drawDrop(t,pos,m);
  else if(t.visible&&view.zoom>1.25){ctx.save();ctx.globalCompositeOperation='source-over';ctx.fillStyle=t.color;ctx.strokeStyle='#fff';ctx.lineWidth=1.2/view.zoom;ctx.beginPath();ctx.arc(pos[0],pos[1],4/view.zoom,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
 }
 if(selectedTrack&&selectedTrack.visible){const p=position(selectedTrack);ctx.save();ctx.globalCompositeOperation='source-over';ctx.strokeStyle='#222';ctx.lineWidth=1.4/view.zoom;ctx.beginPath();ctx.arc(p[0],p[1],15/view.zoom,0,Math.PI*2);ctx.stroke();ctx.restore();}
 ctx.restore();updatePlace();
 ctx.globalCompositeOperation='source-over';ctx.fillStyle='#555555';ctx.strokeStyle='#777777';ctx.lineWidth=.6;ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText('N',942,55);ctx.beginPath();ctx.moveTo(942,64);ctx.lineTo(942,91);ctx.moveTo(938,70);ctx.lineTo(942,64);ctx.lineTo(946,70);ctx.stroke();ctx.textAlign='left';ctx.beginPath();ctx.moveTo(55,563);ctx.lineTo(55,568);ctx.lineTo(55+250*scale*view.zoom,568);ctx.lineTo(55+250*scale*view.zoom,563);ctx.stroke();ctx.fillText('250 m',55,589);
 byId('elapsed').textContent=fmt(time);byId('timeline').value=time;byId('timeline').setAttribute('aria-valuetext',fmt(time));byId('viewLabel').textContent=complete?'Ciò che resta sulla carta':time===0?'Prima della prima goccia':'Il colore incontra la carta';
}
function setPlaying(value){if(animation!==null)cancelAnimationFrame(animation);animation=null;playing=value;last=null;byId('play').textContent=playing?'Ⅱ Pausa':time>=maxTime?'▶ Avvia':'▶ Riprendi';if(playing)animation=requestAnimationFrame(frame);}
function frame(now){if(!playing)return;if(last!==null)time=Math.min(maxTime,time+(now-last)/1000*Number(byId('speed').value));last=now;render();if(time>=maxTime)setPlaying(false);else animation=requestAnimationFrame(frame);}
byId('play').onclick=()=>{showFullMap=false;if(!playing&&time>=maxTime){time=0;resetPaper();}setPlaying(!playing);render();};
byId('timeline').max=maxTime;byId('total').textContent=fmt(maxTime);
byId('timeline').oninput=e=>{showFullMap=false;time=Number(e.target.value);if(maxTime-time<.1)time=maxTime;setPlaying(false);render();};
byId('all').onclick=()=>{showFullMap=true;time=maxTime;setPlaying(false);render();};
// Export the complete artwork, independent of zoom, without moving the playhead.
function finalPrintSnapshot(){
 const saved={time,showFullMap,playing,view:{...view},selectedTrack,finaleProgress,playLabel:byId('play').textContent};
 setPlaying(false);stopFinale();
 try{
  time=maxTime;showFullMap=true;finaleProgress=1;view.zoom=1;view.x=view.y=0;selectedTrack=null;render();
  const output=document.createElement('canvas'),top=76,bottom=78;
  output.width=canvas.width;output.height=canvas.height+top+bottom;
  const g=output.getContext('2d');g.fillStyle='#f2f2f2';g.fillRect(0,0,output.width,output.height);
  g.fillStyle='#171717';g.font='italic 30px Georgia,serif';g.fillText('Perdersi, ritrovarsi',32,44);
  g.font='15px Arial,sans-serif';g.textAlign='right';g.fillText(experience.name,output.width-32,43);g.textAlign='left';
  g.drawImage(canvas,0,top);
  g.font='13px Arial,sans-serif';g.fillStyle='#444';
  g.fillText('Dati e strade © OpenStreetMap contributors (ODbL) · SRTM · Cartografia © OpenTopoMap (CC BY-SA 3.0)',32,top+canvas.height+29);
  g.font='11px Arial,sans-serif';g.fillText('openstreetmap.org/copyright · opentopomap.org/about · creativecommons.org/licenses/by-sa/3.0/ · Elaborazione grafica digitale',32,top+canvas.height+51);
  return output;
 }finally{
  time=saved.time;showFullMap=saved.showFullMap;Object.assign(view,saved.view);selectedTrack=saved.selectedTrack;
  stopFinale();finaleProgress=saved.finaleProgress;render();setPlaying(saved.playing);
  if(!saved.playing)byId('play').textContent=saved.playLabel;
 }
}
byId('export-jpeg').onclick=async()=>{
 if(!cartographyReady)return;
 const button=byId('export-jpeg'),status=byId('export-status');button.disabled=true;status.textContent='Preparo la stampa…';
 try{
  const output=finalPrintSnapshot();
  const blob=await new Promise((resolve,reject)=>output.toBlob(value=>value?resolve(value):reject(new Error('JPEG non disponibile')),'image/jpeg',.95));
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;
  link.download='perdersi-ritrovarsi-'+experience.name.toLowerCase()+'-stampa.jpg';document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent='JPEG pronto.';
 }catch(error){status.textContent='Non riesco a creare il JPEG. Riprova.';}
 finally{button.disabled=false;}
};

byId('bleed').onchange=e=>{spread=Number(e.target.value);resetPaper();render();};
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(playing)setPlaying(false);stopFinale();}else render();});
render();
