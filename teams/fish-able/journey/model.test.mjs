import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Journey,readingsAt} from './model.js';
const data=JSON.parse(readFileSync(new URL('./data.json',import.meta.url)));
function make(fixture=false,date=data.episodes[0].start){const j=new Journey(data,data.episodes[0],date,fixture);j.start();return j;}
function go(j,id){if(j.select(id))j.arrive();}
const trunk=['headwaters','canyon','river','reservoir'];
test('complete both real forks, exact dates, per-Reading Provenance and deterministic replay',()=>{
 for(const branch of [['foothills'],['waterton','conduit20','marston']]){
  const run=()=>{const j=make();for(const id of [...trunk,...branch])go(j,id);return j;};
  const j=run();assert.equal(j.state,'completed');assert.deepEqual(j.events,run().events);
  assert.equal(j.events.at(-1).name,'Journey completed');
  assert.equal(j.events.filter(e=>e.name==='Leg traversed').length,trunk.length+branch.length);
  assert.equal(j.visits[1].readings[0].value,null);
  if(branch[0]==='foothills'){
   assert.equal(j.date,'2023-06-01');assert.equal(j.readings.length,2);
   for(const r of j.readings){assert.equal(r.date,j.date);assert.equal(r.provenance,'Measured');assert.equal(r.value,data.records['FoothillsInfluent.csv'][j.date][r.parameter==='Alkalinity'?'Alk_mg_L':'TOC_mg_L']);}
  }
 }
});
test('missing data never substitutes a neighboring observation',()=>{
 const r=readingsAt(data,'plant-foothills','2023-06-21');assert.ok(r.every(r=>r.value===null&&r.provenance===null));
});
test('Episode end blocks traversal, retains location/date, and cannot continue',()=>{
 const j=make(false,'2023-06-20');go(j,'headwaters');assert.equal(j.state,'ended');assert.equal(j.node,'sntl-531');assert.equal(j.date,'2023-06-20');assert.match(j.reason,/Episode boundary/);assert.equal(j.events.filter(e=>e.name==='Leg traversed').length,0);assert.throws(()=>j.select('headwaters'));
});
test('closed fixture stops at fork with exact alternative ending events',()=>{
 const j=make(true);for(const id of trunk)go(j,id);const before=j.date;go(j,'foothills');
 assert.equal(j.state,'ended');assert.equal(j.node,'dam-strontia');assert.equal(j.date,before);
 assert.deepEqual(j.events.slice(-3).map(e=>e.name),['Leg selected','Selected Leg found closed under the Regime','Journey ended']);
});
test('state guards reject duplicate traversals and non-downstream Legs',()=>{
 const j=make();assert.throws(()=>j.start());assert.throws(()=>j.select('marston'));j.select('headwaters');assert.throws(()=>j.select('headwaters'));j.arrive();assert.throws(()=>j.arrive());
});
