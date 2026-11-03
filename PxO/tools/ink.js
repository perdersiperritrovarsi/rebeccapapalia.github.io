'use strict';
const data=JSON.parse(document.getElementById('data').textContent);
const byId=id=>document.getElementById(id);
const canvas=byId('map'),ctx=canvas.getContext('2d');
// Fixed coordinates keep the pigment geometry consistent on any display.
const W=1000,H=620,DPR=1.6;
const dry=document.createElement('canvas');dry.width=canvas.width;dry.height=canvas.height;
const dryCtx=dry.getContext('2d');dryCtx.scale(DPR,DPR);
function layer(){const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;const g=c.getContext('2d');g.scale(DPR,DPR);return {canvas:c,ctx:g};}
const colors=['#d52b30','#49bda5','#086d73','#d42683','#40318c','#e6ac21','#00afd0','#f47721','#8c3659','#668544','#7560a8','#ba655c','#287da0','#827234','#5a667e'];
const colorNames=['Rosso','Acquamarina','Petrolio','Magenta','Indaco','Ambra','Ciano','Arancione','Amaranto','Oliva','Lavanda','Terracotta','Azzurro','Ocra','Ardesia'];
const points=data.flatMap(t=>t.segments.flat());
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
 return c;
}
const basemap=layer();
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
function paintBasemap(tiles=[]){
 const g=basemap.ctx;g.clearRect(0,0,W,H);g.fillStyle='#f2f2f0';g.fillRect(0,0,W,H);
 // Cached OSM roads also cover the area beyond the original raster tiles.
 g.save();g.lineCap='round';g.lineJoin='round';
 for(const road of cartography.roads){
  g.beginPath();road.forEach(([lon,lat],i)=>{const p=xy([0,lat,lon]);if(i)g.lineTo(...p);else g.moveTo(...p);});
  g.strokeStyle='#d5d6d2';g.lineWidth=2.4;g.stroke();
  g.strokeStyle='#fbfbf9';g.lineWidth=1.1;g.stroke();
 }
 g.restore();
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
 g.save();g.globalCompositeOperation='multiply';g.globalAlpha=.54;g.filter='grayscale(1) contrast(.82) brightness(1.17)';
 g.drawImage(raster.canvas,0,0,W,H);
 g.restore();paperMaterial(g);
}
paintBasemap();
Promise.all(cartography.tiles.map(tile=>new Promise((resolve,reject)=>{
 const bitmap=new Image();bitmap.onload=()=>resolve({...tile,bitmap});bitmap.onerror=()=>reject(new Error('Tessera incorporata non leggibile'));bitmap.src=tile.image;
}))).then(tiles=>{paintBasemap(tiles);byId('map-status').textContent='';render();}).catch(()=>{byId('map-status').textContent=' · Impossibile leggere la base cartografica';});
const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const maxTime=Math.max(...data.map(t=>t.duration));
let time=maxTime,playing=false,animation=null,last=null,spread=1,dryIndex=0,dryTime=-Infinity;
const stamps=[];
data.forEach((t,i)=>{
 t.color=colors[i];t.colorName=colorNames[i];t.paletteIndex=i;t.visible=true;t.paper=layer();t.parts=t.segments.map(points=>({points,coords:points.map(xy)}));
 t.sprites=Array.from({length:9},(_,j)=>Array.from({length:3},(_,stage)=>makeStamp(t.color,i*101+j+1,stage)));
 const rng=random(321+i*793);
 for(const part of t.parts){let prev=null,prevTime=-Infinity;part.points.forEach((p,j)=>{
  const pos=part.coords[j];
  if(!prev||p[0]-prevTime>=4||j===part.points.length-1){const m=motion(t,p[0]);stamps.push({t:p[0],x:pos[0]+(rng()-.5)*2,y:pos[1]+(rng()-.5)*2,owner:t,variant:Math.floor(rng()*9),radius:(17+rng()*22)*(1.35-Math.min(m.speed/9,1)*.65),angle:rng()*Math.PI*2,aspect:.55+rng()*.8,opacity:.5+rng()*.7});prev=pos;prevTime=p[0];}
 });}
 const button=document.createElement('button');button.type='button';button.className='track';button.style.setProperty('--color',t.color);button.setAttribute('aria-pressed','true');button.setAttribute('aria-label',`Mostra o nascondi il percorso ${t.id}`);
 button.innerHTML=`<span class="swatch"></span><span class="track-name"><span class="track-color-name">${t.id} · ${t.colorName}</span><span class="track-meta">${(t.distance/1000).toLocaleString('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2})} km · ${fmt(t.duration)}</span></span><span class="track-live"><span class="status"></span><span class="speed-readout"></span><span class="speed-meter"><span></span></span></span>`;
 t.status=button.querySelector('.status');t.speedReadout=button.querySelector('.speed-readout');t.speedMeter=button.querySelector('.speed-meter span');button.onclick=()=>{t.visible=!t.visible;button.setAttribute('aria-pressed',String(t.visible));resetPaper();render();};const row=document.createElement('div');row.className='track-row';row.appendChild(button);
 const picker=document.createElement('input');picker.type='color';picker.className='color-picker';picker.value=t.color;picker.setAttribute('aria-label',`Colore della traccia ${t.id}`);picker.title=`Cambia colore di ${t.id}`;row.appendChild(picker);byId('tracks').appendChild(row);
 t.button=button;t.picker=picker;t.colorLabel=button.querySelector('.track-color-name');
 let recolorTimer;
 const applyColor=()=>{clearTimeout(recolorTimer);if(t.color===picker.value)return;recolor(t,picker.value);};
 picker.addEventListener('input',()=>{clearTimeout(recolorTimer);recolorTimer=setTimeout(applyColor,100);});picker.addEventListener('change',applyColor);
});
stamps.sort((a,b)=>a.t-b.t);
function recolor(t,value){
 t.color=value;const match=colors.indexOf(value.toLowerCase());t.colorName=match<0?value.toUpperCase():colorNames[match];
 t.button.style.setProperty('--color',value);t.colorLabel.textContent=`${t.id} · ${t.colorName}`;
 t.sprites=Array.from({length:9},(_,j)=>Array.from({length:3},(_,stage)=>makeStamp(value,t.paletteIndex*101+j+1,stage)));
 resetPaper();render();
}
function resetPaper(){for(const t of data)t.paper.ctx.clearRect(0,0,W,H);dryIndex=0;dryTime=-Infinity;}
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
 ctx.save();ctx.globalCompositeOperation='source-over';ctx.translate(...pos);ctx.rotate(m.angle);ctx.scale(1.5,1.5);ctx.shadowColor=t.color+'44';ctx.shadowBlur=2;ctx.shadowOffsetY=1;
 // A rounded, wet head with a tapered tail that lengthens with ground speed.
 ctx.beginPath();ctx.moveTo(-tail,0);ctx.bezierCurveTo(-7,-1,-4,-5,0,-5);ctx.bezierCurveTo(8,-7,10,5,2,6);ctx.bezierCurveTo(-3,7,-7,2,-tail,0);ctx.closePath();
 const wet=ctx.createLinearGradient(-tail,0,8,0);wet.addColorStop(0,t.color+'16');wet.addColorStop(.55,t.color+'c0');wet.addColorStop(1,t.color);ctx.fillStyle=wet;ctx.fill();ctx.strokeStyle=t.color+'aa';ctx.lineWidth=.6;ctx.stroke();
 ctx.beginPath();ctx.ellipse(3,-2,2.2,.9,-.3,0,Math.PI*2);ctx.fillStyle='#ffffffaa';ctx.fill();ctx.restore();
}
function render(){
 const complete=time>=maxTime,cutoff=complete?maxTime:time-100;
 if(cutoff<dryTime)resetPaper();
 while(dryIndex<stamps.length&&stamps[dryIndex].t<=cutoff){const s=stamps[dryIndex++];deposit(s.owner.paper.ctx,s,1);s.owner.paper.ctx.globalAlpha=1;}
 dryTime=cutoff;dryCtx.globalAlpha=1;
 ctx.setTransform(DPR,0,0,DPR,0,0);ctx.clearRect(0,0,W,H);ctx.globalCompositeOperation='source-over';ctx.drawImage(basemap.canvas,0,0,W,H);
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
 }
 ctx.globalCompositeOperation='source-over';ctx.fillStyle='#827e70';ctx.strokeStyle='#aaa591';ctx.lineWidth=.6;ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText('N',942,55);ctx.beginPath();ctx.moveTo(942,64);ctx.lineTo(942,91);ctx.moveTo(938,70);ctx.lineTo(942,64);ctx.lineTo(946,70);ctx.stroke();ctx.textAlign='left';ctx.beginPath();ctx.moveTo(55,563);ctx.lineTo(55,568);ctx.lineTo(55+250*scale,568);ctx.lineTo(55+250*scale,563);ctx.stroke();ctx.fillText('250 m',55,589);
 byId('elapsed').textContent=fmt(time);byId('timeline').value=time;byId('timeline').setAttribute('aria-valuetext',fmt(time));byId('viewLabel').textContent=complete?'Ciò che resta sulla carta':time===0?'Prima della prima goccia':'Il colore incontra la carta';
}
function setPlaying(value){if(animation!==null)cancelAnimationFrame(animation);animation=null;playing=value;last=null;byId('play').textContent=playing?'Ⅱ Pausa':time>=maxTime?'▶ Avvia':'▶ Riprendi';if(playing)animation=requestAnimationFrame(frame);}
function frame(now){if(!playing)return;if(last!==null)time=Math.min(maxTime,time+(now-last)/1000*Number(byId('speed').value));last=now;render();if(time>=maxTime)setPlaying(false);else animation=requestAnimationFrame(frame);}
byId('play').onclick=()=>{if(!playing&&time>=maxTime){time=0;resetPaper();}setPlaying(!playing);render();};
byId('timeline').max=maxTime;byId('total').textContent=fmt(maxTime);
byId('timeline').oninput=e=>{time=Number(e.target.value);setPlaying(false);render();};
byId('all').onclick=()=>{time=maxTime;setPlaying(false);render();};
byId('bleed').onchange=e=>{spread=Number(e.target.value);resetPaper();render();};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)setPlaying(false);});
render();
