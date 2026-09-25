import {Scenery} from './scenery.js';
import {Journey} from './model.js';
const $ = id => document.getElementById(id);
const svgNS = 'http://www.w3.org/2000/svg';
let scenery;
let fishSpeed = 1;
let data, journey, generation = 0, fullView = false, replaying = false;
const el = (tag, attrs = {}) => {const n = document.createElementNS(svgNS, tag); for (const [k,v] of Object.entries(attrs)) n.setAttribute(k,v); return n;};
const nodeById = id => data.nodes.find(n => n.id === id);
function text(tag, value, className) {const n=document.createElement(tag); n.textContent=value; if(className)n.className=className; return n;}
function selectedEpisode() {return data.episodes.find(e => e.id === $('episode').value);}
function configureEpisode() {
  generation++; journey=null; replaying=false;
  const e=selectedEpisode(); $('starting').disabled=!e; $('departure').disabled=!e;
  if(e){$('departure').min=e.start; $('departure').max=e.end; $('departure').value=e.start; $('episode-note').textContent=`${e.start} → ${e.end} · ${e.regime}. Select any departure within the Episode.`;}
  preview();
}
function preview() {
  const e=selectedEpisode();
  journey = e && $('starting').value && $('departure').value >= e.start && $('departure').value <= e.end ? new Journey(data,e,$('departure').value,$('fixture').checked) : null;
  render();
}
function lockSettings(locked) {$('episode').disabled=locked; $('starting').disabled=locked || !selectedEpisode(); $('departure').disabled=locked || !selectedEpisode();}
function restart() {generation++; replaying=false; fullView=false; lockSettings(false); preview();}
function start() {if(!journey || journey.state!=='ready')return; journey.start(); lockSettings(true); render(); announce('Journey started at Hoosier Pass. Choose your downstream Leg.');}
function announce(message) {$('announcement').textContent=message;}
function projection() {
  const downstream=journey && !['sntl-531','res-eleven_mile','res-cheesman'].includes(journey.node);
  const chosen=downstream&&!fullView?data.nodes.slice(3):data.nodes;
  const coords=chosen.map(n=>n.coord); const xs=coords.map(c=>c[0]*.77),ys=coords.map(c=>c[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const scale=Math.min(580/(maxX-minX),355/(maxY-minY));
  return {focus:downstream&&!fullView, point:c=>[105+(c[0]*.77-minX)*scale+(580-(maxX-minX)*scale)/2,425-(c[1]-minY)*scale-(355-(maxY-minY)*scale)/2]};
}
function path(coords,project) {return coords.map((c,i)=>`${i?'L':'M'}${project(c).join(',')}`).join(' ');}
function drawMap() {
  const {point,focus}=projection(); $('lines').replaceChildren(); $('nodes').replaceChildren();
  for(const leg of data.legs){
    const a=nodeById(leg.fromNode).coord,b=nodeById(leg.toNode).coord;
    const trace=leg.trace; const coords=[a,...trace,b];
    const taken=journey?.events.some(e=>e.name==='Leg traversed' && e.detail===leg.name);
    const motion=el('path',{id:`motion-${leg.id}`,d:path(coords,point),fill:'none',stroke:'none'}); $('lines').append(motion);
    if(trace.length){$('lines').append(el('path',{d:path(trace,point),class:`trace ${taken?'taken':''}`})); for(const pair of [[a,trace[0]],[trace.at(-1),b]])$('lines').append(el('path',{d:path(pair,point),class:'schematic'}));}
    else $('lines').append(el('path',{d:path([a,b],point),class:`schematic ${taken?'taken':''}`}));
  }
  const labels=focus?data.nodes.slice(3):data.nodes.slice(0,4);
  for(const n of data.nodes){
    const [x,y]=point(n.coord); if(x<0||x>800||y<0||y>510)continue;
    const circle=el('circle',{cx:x,cy:y,r:journey?.node===n.id?8:5,class:`node ${journey?.node===n.id?'current':''}`});
    const title=el('title');title.textContent=n.name;circle.append(title);$('nodes').append(circle);
    if(labels.includes(n)){
      const left=['dam-marston-diversion','gage-06707525','plant-marston'].includes(n.id);
      const dy=n.id==='res-marston'?22:n.id==='dam-strontia'?22:n.id==='gage-06707525'?14:-15;
      const label=el('text',{x:x+(left?-12:12),y:y+dy,'text-anchor':left?'end':'start'});
      label.textContent=n.name.replace(' Treatment Plant','').replace(' Reservoir','').replace(' SNOTEL','').replace('Sentinel Node','sentinel').replace('Dam','');$('nodes').append(label);
    }
  }
  if(!focus){const label=el('text',{x:545,y:48});label.textContent='Downstream → treatment plants';$('nodes').append(label);}
  $('fish').style.filter=journey?.state==='ended'?'grayscale(1)':'';
  const [x,y]=point(nodeById(journey?.node||'sntl-531').coord); $('fish').setAttribute('transform',`translate(${x},${y-14})`);
  $('extent').textContent=fullView?'Follow the fish':'Show full system';
}
function renderReadings() {
  $('readings').replaceChildren();
  if(!journey?.readings){$('readings').append(text('p','Readings appear when your Journey starts.'));return;}
  for(const r of journey.readings){
    const card=text('article','','card');card.append(text('h3',r.parameter));
    const value=text('div',r.value===null?'Reading unavailable':String(r.value),`value ${r.value===null?'missing':''}`);
    if(r.value!==null)value.append(text('span',` ${r.unit}`));card.append(value);
    card.append(text('span',r.provenance?`PROVENANCE · ${r.provenance.toUpperCase()}`:'PROVENANCE · NOT ASSIGNED','badge'));
    card.append(text('p',r.value===null?`Requested date: ${r.date} · units: ${r.unit}`:`Observation date: ${r.date}`));
    card.append(text('p',`Source: ${r.source}`));card.append(text('p',r.reason||r.method));
    if(r.provisional)card.append(text('p','Provisional · subject to revision; not assumed QA/QC reviewed.'));
    $('readings').append(card);
  }
}
function render(){
  const active=journey && journey.state!=='ready';
  $('start').disabled=!journey || active; $('replay').disabled=!journey || !['completed','ended'].includes(journey.state);
  $('fixture-banner').hidden=!$('fixture').checked;
  $('status').textContent=replaying?'REPLAYING THE JOURNEY':journey?.state==='completed'?'JOURNEY COMPLETED':journey?.state==='ended'?'JOURNEY ENDED':active?'ON THE MOVE':'READY WHEN YOU ARE';
  $('location').textContent=journey?nodeById(journey.node).name:'The mountains are calling.';
  $('moment').textContent=journey?`${journey.date} · ${journey.episode.name}`:'Select an Episode and a starting snow Node.';
  $('choices').replaceChildren();
  if(journey?.state==='choosing'){
    $('choices').append(text('p',journey.available().length>1?'A fork in the water. Choose a Leg.':'Choose your next downstream Leg.','small'));
    for(const leg of journey.available()){
      const b=text('button',leg.name);b.type='button';b.dataset.leg=leg.id;b.disabled=replaying;
      b.append(text('small',`${journey.days(leg)} day${journey.days(leg)===1?'':'s'} · baseline ${leg.days} × ${journey.episode.factor}${journey.fixture?' × 2 (test)':''}${journey.fixture&&leg.id==='foothills'?' · CLOSED TEST FIXTURE':''}`));
      b.addEventListener('click',()=>traverse(leg.id));$('choices').append(b);
    }
  }
  if(journey?.state==='traversing')$('choices').append(text('p','Following the selected Leg…'));
  $('summary').hidden=!journey || !['completed','ended'].includes(journey.state);
  $('summary').replaceChildren();
  if(!$('summary').hidden){
    $('summary').append(text('p',journey.reason));
    const measured=journey.visits.flatMap(v=>v.readings).filter(r=>r.value!==null).length;
    $('summary').append(text('p',`${journey.visits.length} Nodes visited · ${journey.departure} → ${journey.date} · ${measured} supported Readings`, 'small'));
    $('summary').append(text('p',journey.visits.map(v=>nodeById(v.node).name).join(' → '),'small'));
  }
  if(journey)$('regime').textContent=`Regime: ${journey.episode.regime}. Baseline × ${journey.episode.factor}${journey.fixture?' × 2 (test fixture)':''}, rounded up to whole days. Times are demo configuration, not physical predictions.`;
  $('events').replaceChildren();for(const e of journey?.events||[])$('events').append(text('li',`${e.date} · ${e.name}${e.detail?' — '+e.detail:''}`));
  $('event-count').textContent=`${journey?.events.length||0} events`;
  renderReadings();drawMap();scenery?.update(journey,fullView);
}
async function traverse(id){
  const token=generation, current=journey;
  const pending=current.select(id);render();
  if(!pending){announce(current.reason);return;}
  const motion=$(`motion-${id}`),len=motion.getTotalLength();
  scenery?.prepare(pending.leg);
  const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:scenery?.enabled?(scenery.firstPerson?8000:5000):1600;
  await new Promise(resolve=>{
    let previous=performance.now(), elapsed=0;
    function frame(now){
      if(token!==generation){resolve();return;}
      elapsed+=(now-previous)*fishSpeed;
      previous=now;
      const t=duration?Math.min(1,elapsed/duration):1;
      scenery?.progress(t);
      const p=motion.getPointAtLength(t*len),q=motion.getPointAtLength(Math.min(len,t*len+1));
      const angle=t===1?0:Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI;
      $('fish').setAttribute('transform',`translate(${p.x},${p.y}) rotate(${angle})`);
      if(t<1)requestAnimationFrame(frame);else resolve();
    }
    requestAnimationFrame(frame);
  });
  if(token!==generation)return;
  current.arrive();fullView=false;render();announce(`${nodeById(current.node).name}, ${current.date}. Readings presented. ${current.reason||'Choose the next Leg.'}`);
  if(!replaying)($('choices').querySelector('button')||$('replay')).focus({preventScroll:true});
}
async function replay(){
  const old=journey, choices=[...old.selected]; generation++; const token=generation; replaying=true;
  journey=new Journey(data,old.episode,old.departure,old.fixture);journey.start();fullView=false;lockSettings(true);render();
  for(const id of choices){if(token!==generation || journey.state!=='choosing')break;await traverse(id);}
  if(token===generation){replaying=false;render();announce('Replay finished.');}
}
async function load(){
  const [response,terms]=await Promise.all([fetch('data.json'),fetch('TERMS.md')]);
  if(!response.ok||!terms.ok)throw new Error('Could not load the local demo files.');
  data=await response.json();$('terms').textContent=await terms.text();
  for(const e of data.episodes){const o=text('option',e.name);o.value=e.id;$('episode').append(o);}
  $('episode').addEventListener('change',configureEpisode);$('starting').addEventListener('change',preview);$('departure').addEventListener('change',preview);
  $('setup').addEventListener('submit',e=>{e.preventDefault();start();});$('restart').addEventListener('click',restart);$('replay').addEventListener('click',replay);
  $('fish-speed').addEventListener('input',event=>{
    fishSpeed=Number(event.target.value);
    $('fish-speed-value').value=`${fishSpeed}×`;
    event.target.setAttribute('aria-valuetext',`${fishSpeed} times normal speed`);
  });
  $('fixture').addEventListener('change',restart);$('extent').addEventListener('click',()=>{if(journey?.state==='traversing')return;fullView=!fullView;drawMap();scenery?.update(journey,fullView);});render();
  const mode=$('view-mode');
  function set3D(enabled){
    $('scene-shell').hidden=!enabled;$('map').classList.toggle('diagram-hidden',enabled);
    mode.textContent=enabled?'2D diagram':'3D scenery';mode.setAttribute('aria-pressed',String(!enabled));scenery?.toggle(enabled);
  }
  try {scenery=new Scenery(data);set3D(true);} catch(error){set3D(false);mode.disabled=true;$('scene-status').textContent='3D unavailable; the 2D Journey remains available.';$('episode-note').append(' 3D graphics unavailable on this device; using the 2D diagram.');}
  mode.addEventListener('click',()=>set3D($('scene-shell').hidden));
  $('perspective').disabled=!scenery;
  $('eye-height-control').hidden=!scenery;
  $('water-effects').disabled=!scenery;
  $('water-effects').addEventListener('change',event=>{scenery?.water?.setEnabled(event.target.checked);scenery?.update(journey,fullView);});
  $('eye-height').addEventListener('input',event=>scenery?.setEyeHeight(event.target.value));
  $('perspective').addEventListener('click',()=>{fullView=false;scenery?.setPerspective(!scenery.firstPerson);$('extent').textContent='Show full system';});
}
load().catch(error=>{$('error').hidden=false;$('error').textContent=`${error.message} Launch with python3 serve.py and reload this page.`;});
