import {Water} from './water.js';
// MapLibre 5.15.0 supports explicit camera elevation; providers match the existing map.
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const collection = features => ({type:'FeatureCollection',features});
export class Scenery {
  constructor(data) {
    this.firstPerson=true;this.eyeHeight=3;this.lastProgress=0;this.data=data;this.ready=false;this.enabled=true;this.current=null;this.lastCamera=null;
    this.node=id=>data.nodes.find(n=>n.id===id);
    this.notice=document.getElementById('scene-status');
    this.map=new maplibregl.Map({container:'scenery',center:data.nodes[0].coord,zoom:11.5,pitch:65,bearing:-28,maxPitch:85,
      style:{version:8,sources:{
        satellite:{type:'raster',tileSize:256,maxzoom:18,tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],attribution:'Imagery © Esri and contributors'},
        dem:{type:'raster-dem',tileSize:256,maxzoom:13,encoding:'terrarium',tiles:['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],attribution:'Terrain: Mapzen / AWS'},
      },layers:[{id:'satellite',type:'raster',source:'satellite',paint:{'raster-saturation':-.12,'raster-fade-duration':0}}],
      sky:{'sky-color':'#80b2d5','horizon-color':'#e5ecdf','fog-color':'#c6dacd','sky-horizon-blend':.7,'horizon-fog-blend':.7}},
    });
    this.map.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'top-right');
    this.map.addControl(new maplibregl.FullscreenControl(),'top-right');
    this.map.scrollZoom.disable();
    this.map.on('error',()=>{this.notice.textContent='Some scenery could not load. Check your connection or use 2D diagram.';});
    this.map.on('idle',()=>{
      if(!this.ready||!this.enabled||!this.firstPerson||!this.coords||this.current?.state==='traversing')return;
      const ground=this.map.queryTerrainElevation(this.sample(this.lastProgress));
      if(ground!==null&&Math.abs(ground-(this.lastEyeGround||0))>2)this.eyeAt(this.lastProgress);
    });
    this.map.getCanvas().addEventListener('webglcontextlost',()=>{this.notice.textContent='3D graphics interrupted. Use 2D diagram to continue.';});
    this.fishElement=document.createElement('div');this.fishElement.className='terrain-fish';this.fishElement.setAttribute('aria-label','Journey fish');
    this.fishElement.innerHTML='<svg viewBox="0 0 84 48" width="84" height="48" aria-hidden="true"><defs><linearGradient id="fish-color" x2="0" y2="1"><stop stop-color="#ffd09a"/><stop offset=".5" stop-color="#fb8e42"/><stop offset="1" stop-color="#c94a21"/></linearGradient></defs><path d="M32 24 L9 9 Q15 24 9 39 Z" fill="#f28b49"/><ellipse cx="46" cy="24" rx="27" ry="15" fill="url(#fish-color)"/><path d="M34 11 L46 2 L57 12 M38 35 L49 45 L56 35" fill="#dd6b37"/><path d="M42 23 Q29 32 44 35" fill="#ffe0ac"/><circle cx="63" cy="20" r="4" fill="#fff3d4"/><circle cx="64" cy="20" r="2" fill="#143b36"/><path d="M72 27 L65 28" stroke="#7a392a" stroke-width="2"/></svg>';
    this.fish=new maplibregl.Marker({element:this.fishElement,anchor:'bottom',offset:[0,8]}).setLngLat(data.nodes[0].coord).addTo(this.map);
    this.labels=data.nodes.map(n=>{const e=document.createElement('div');e.className='terrain-label';e.textContent=n.name.replace(' Reservoir','').replace(' Treatment Plant',' · treatment').replace(' SNOTEL',' · snow');return {n,e,marker:new maplibregl.Marker({element:e,anchor:'top',offset:[0,14]}).setLngLat(n.coord).addTo(this.map)};});
    this.map.on('load',()=>{
      this.map.setTerrain({source:'dem',exaggeration:1.35});
      this.map.addSource('journey-legs',{type:'geojson',data:collection([])});
      for(const [id,kind,color,width,dash] of [['trace-glow','trace','#103e3b',9],['trace','trace','#71edd7',4],['schematic','schematic','#ffca82',3,[2,2]]]){
        this.map.addLayer({id,type:'line',source:'journey-legs',filter:['all',['==',['get','kind'],kind],['!=',['get','watery'],true]],paint:{'line-color':['case',['get','active'],'#ffae59',['get','visited'],'#fff5bb',color],'line-width':width,...(dash?{'line-dasharray':dash}:{})}});
      }
      this.water=new Water(this.map,this.data);
      this.water.setEnabled(document.getElementById('water-effects').checked);
      this.map.addSource('journey-nodes',{type:'geojson',data:collection(data.nodes.map(n=>({type:'Feature',properties:{},geometry:{type:'Point',coordinates:n.coord}})))});
      this.map.addLayer({id:'nodes',type:'circle',source:'journey-nodes',paint:{'circle-radius':6,'circle-color':'#eaffdf','circle-stroke-color':'#133f38','circle-stroke-width':2}});
      this.ready=true;this.notice.textContent='3D terrain · drag to explore · right-drag to tilt';
      this.update(this.current,this.full);this.syncPerspective();document.getElementById('scenery').dataset.ready='true';
    });
    this.resize=new ResizeObserver(()=>this.map.resize());this.resize.observe(document.getElementById('scenery'));
  }
  update(journey,full=false){
    this.current=journey;this.full=full;
    if(full)this.firstPerson=false;
    this.syncPerspective();
    const id=journey?.node||'sntl-531',node=this.node(id);
    this.fish.setLngLat(node.coord);this.fishElement.classList.toggle('ended',journey?.state==='ended');
    const visible=new Set([id,...(journey?.available()||[]).map(l=>l.toNode)]);
    this.labels.forEach(({n,e})=>{e.hidden=!full&&!visible.has(n.id);});
    if(!this.ready)return;
    const features=[];
    const add=(leg,kind,coordinates)=>features.push({type:'Feature',properties:{kind,watery:this.water.enabled&&kind==='trace'&&['canyon','river','reservoir','waterton'].includes(leg.id)&&!!(journey?.pending?.leg.id===leg.id||journey?.events.some(e=>e.name==='Leg traversed'&&e.detail===leg.name)),active:!!(journey?.pending?.leg.id===leg.id),visited:!!journey?.events.some(e=>e.name==='Leg traversed'&&e.detail===leg.name)},geometry:{type:'LineString',coordinates}});
    for(const l of this.data.legs){const a=this.node(l.fromNode).coord,b=this.node(l.toNode).coord;
      if(l.trace.length){add(l,'trace',l.trace);add(l,'schematic',[a,l.trace[0]]);add(l,'schematic',[l.trace.at(-1),b]);}
      else add(l,'schematic',[a,b]);
    }
    this.map.getSource('journey-legs').setData(collection(features));
    this.water.update(journey);
    const key=`${id}/${full}/${this.firstPerson}`;
    if(key!==this.lastCamera&&this.enabled){this.lastCamera=key;this.map.stop();
      if(this.firstPerson){
        const next=this.data.legs.find(l=>l.fromNode===id);
        if(next){this.setPath(next);this.eyeAt(0);}else if(this.coords)this.eyeAt(1);
      } else if(full)this.fit(this.data.nodes.map(n=>n.coord));
      else this.map.flyTo({center:node.coord,zoom:id==='sntl-531'?11.5:id==='dam-strontia'?12.3:12,pitch:65,bearing:-28,duration:reduced()?0:1700});
    }
  }
  fit(coords){const bounds=new maplibregl.LngLatBounds();coords.forEach(c=>bounds.extend(c));this.map.fitBounds(bounds,{padding:70,pitch:55,bearing:-15,maxZoom:13,duration:reduced()?0:1300});}
  syncPerspective(){
    const first=this.firstPerson&&this.enabled;
    this.map.setCenterClampedToGround(!first);
    document.getElementById('eye-height-control').hidden=!first;
    this.fishElement.hidden=first;
    document.getElementById('fish-eye-overlay').hidden=!first;
    const button=document.getElementById('perspective');
    button.textContent=this.firstPerson?'Overview camera':'Fish-eye camera';
    button.setAttribute('aria-pressed',String(this.firstPerson));button.disabled=!this.enabled;
    document.getElementById('scenery').dataset.perspective=this.firstPerson?'first-person':'overview';
  }
  setEyeHeight(value){
    const height=Number(value);
    if(!Number.isFinite(height))return;
    this.eyeHeight=Math.max(1,Math.min(150,height));
    document.getElementById('eye-height-value').value=`${this.eyeHeight} m`;
    document.getElementById('eye-height').setAttribute('aria-valuetext',`${this.eyeHeight} metres above terrain`);
    if(this.firstPerson&&this.enabled)this.eyeAt(this.lastProgress);
  }
  setPerspective(first){
    this.firstPerson=first;this.full=false;this.lastCamera=null;this.map.stop();this.syncPerspective();
    if(this.current?.state==='traversing'&&this.coords){
      if(first)this.eyeAt(this.lastProgress);else this.fit(this.coords);
    }else this.update(this.current,false);
  }
  setPath(leg){
    this.lastProgress=0;
    this.coords=[this.node(leg.fromNode).coord,...leg.trace,this.node(leg.toNode).coord];this.distances=[0];
    for(let i=1;i<this.coords.length;i++){const a=this.coords[i-1],b=this.coords[i];this.distances.push(this.distances.at(-1)+Math.hypot((b[0]-a[0])*.77,b[1]-a[1]));}
  }
  prepare(leg){
    this.setPath(leg);this.lastProgress=0;
    if(this.ready&&this.enabled){this.map.stop();if(this.firstPerson)this.eyeAt(0);else this.fit(this.coords);}
  }
  sample(t){
    const target=Math.max(0,Math.min(1,t))*this.distances.at(-1);let i=1;while(i<this.distances.length-1&&this.distances[i]<target)i++;
    const f=(target-this.distances[i-1])/(this.distances[i]-this.distances[i-1]||1),a=this.coords[i-1],b=this.coords[i];
    return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];
  }
  eyeAt(t){
    if(!this.coords||!this.ready||!this.enabled)return;
    const from=this.sample(t),lookAhead=.0018/(this.distances.at(-1)||1);
    let toward=this.sample(Math.min(1,t+lookAhead));
    if(t>=1){const behind=this.sample(Math.max(0,1-lookAhead));toward=[from[0]+from[0]-behind[0],from[1]+from[1]-behind[1]];}
    if(Math.hypot(toward[0]-from[0],toward[1]-from[1])<1e-9)return;
    // DEM is ground elevation, not a river surface/depth model. Keep visual clearance.
    const ground=this.map.queryTerrainElevation(from)||0;
    this.lastEyeGround=ground;
    // Height is relative to the fish's location, never the higher terrain ahead.
    const eyeAltitude=ground+this.eyeHeight;
    const bearing=Math.atan2((toward[0]-from[0])*.77,toward[1]-from[1])*180/Math.PI;
    this.map.setCenterElevation(ground);
    const options=this.map.calculateCameraOptionsFromCameraLngLatAltRotation(from,eyeAltitude,bearing,82,0);
    this.map.jumpTo(options);
    const canvas=document.getElementById('scenery');canvas.dataset.eyeLocation=from.join(',');canvas.dataset.eyePitch=String(this.map.getPitch());canvas.dataset.cameraClearance=String(eyeAltitude-ground);

  }
  progress(t){
    if(!this.coords)return;this.lastProgress=t;
    this.fish.setLngLat(this.sample(t));
    if(this.enabled)this.water?.tick(performance.now());
    if(this.firstPerson)this.eyeAt(t);
  }
  toggle(enabled){this.enabled=enabled;this.syncPerspective();this.map.stop();if(enabled){this.map.resize();this.lastCamera=null;this.update(this.current,this.full);}}
}
