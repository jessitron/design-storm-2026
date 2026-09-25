// Decorative water, not a hydraulic model or measured river boundary.
const surfaceLegs = new Set(['canyon', 'river', 'reservoir', 'waterton']);
const fc = features => ({type: 'FeatureCollection', features});

// A narrow illustrative ribbon around the original Trace. Width is visual only.
export function waterRibbon(trace, width = 24) {
  const points = trace.filter((p, i) => !i || p[0] !== trace[i - 1][0] || p[1] !== trace[i - 1][1]);
  if (points.length < 2) return null;
  const latitude = points[0][1], sx = 111320 * Math.cos(latitude * Math.PI / 180), sy = 111320;
  const normals = points.slice(1).map((p, i) => {
    const dx = (p[0] - points[i][0]) * sx, dy = (p[1] - points[i][1]) * sy, length = Math.hypot(dx, dy);
    return [-dy / length, dx / length];
  });
  const left = [], right = [];
  points.forEach((p, i) => {
    const a = normals[Math.max(0, i - 1)], b = normals[Math.min(i, normals.length - 1)];
    const nx = a[0] + b[0], ny = a[1] + b[1], length = Math.hypot(nx, ny);
    const n = length > .01 ? [nx / length, ny / length] : b;
    const offset = Math.min(width, width / 2 / Math.max(.5, n[0] * b[0] + n[1] * b[1]));
    left.push([p[0] + n[0] * offset / sx, p[1] + n[1] * offset / sy]);
    right.push([p[0] - n[0] * offset / sx, p[1] - n[1] * offset / sy]);
  });
  return {type: 'Polygon', coordinates: [[...left, ...right.reverse(), left[0]]]};
}

export class Water {
  constructor(map, data) {
    this.map = map; this.data = data; this.enabled = true; this.lastTick = 0;
    this.canvas = document.createElement('canvas'); this.canvas.width = this.canvas.height = 128;
    map.addImage('water-ripples', this.texture(0), {pixelRatio: 2});
    map.addSource('water-surface', {type: 'geojson', data: fc([])});
    map.addSource('water-flow', {type: 'geojson', data: fc([])});
    this.layers = ['water-body', 'water-ripples', 'water-edge', 'water-visible', 'water-symbol', 'water-current'];
    map.addLayer({id: 'water-body', type: 'fill', source: 'water-surface', paint: {'fill-color': '#087a9c', 'fill-opacity': .9}});
    map.addLayer({id: 'water-ripples', type: 'fill', source: 'water-surface', paint: {'fill-pattern': 'water-ripples', 'fill-opacity': .8}});
    map.addLayer({id: 'water-edge', type: 'line', source: 'water-surface', paint: {'line-color': '#71dace', 'line-opacity': .65, 'line-width': 1}});
    map.addLayer({id: 'water-visible', type: 'line', source: 'water-flow', filter: ['==', ['get', 'symbolic'], false], paint: {'line-color': '#159fc3', 'line-width': 4, 'line-opacity': .85}});
    map.addLayer({id: 'water-symbol', type: 'line', source: 'water-flow', filter: ['==', ['get', 'symbolic'], true], paint: {'line-color': '#37cbe2', 'line-width': 9, 'line-opacity': .65, 'line-dasharray': [1.5, 2]}});
    map.addLayer({id: 'water-current', type: 'line', source: 'water-flow', filter: ['==', ['get', 'active'], true], paint: {'line-color': '#d8fcff', 'line-width': 2, 'line-opacity': .8, 'line-dasharray': [0, 3, 1, 0]}});
    this.ribbons = new Map(data.legs.filter(l => surfaceLegs.has(l.id) && l.trace.length).map(l => [l.id, waterRibbon(l.trace)]));
  }
  texture(phase) {
    const ctx = this.canvas.getContext('2d'); ctx.clearRect(0, 0, 128, 128);
    for (let y = -16; y < 144; y += 16) {
      ctx.beginPath();
      for (let x = 0; x <= 128; x += 4) {
        const ripple = y + Math.sin(x * Math.PI / 32 + phase) * 2.5 + Math.sin(phase) * 2;
        if (!x) ctx.moveTo(x, ripple); else ctx.lineTo(x, ripple);
      }
      ctx.strokeStyle = y % 32 === 0 ? '#d3ffff88' : '#003d5a55'; ctx.lineWidth = y % 32 === 0 ? 1.4 : 3; ctx.stroke();
    }
    return ctx.getImageData(0, 0, 128, 128);
  }
  update(journey) {
    this.journey = journey;
    const surfaces = [], flow = [];
    for (const leg of this.data.legs) {
      const active = journey?.pending?.leg.id === leg.id;
      const visited = journey?.events.some(e => e.name === 'Leg traversed' && e.detail === leg.name);
      if (!active && !visited) continue;
      const a = this.data.nodes.find(n => n.id === leg.fromNode).coord, b = this.data.nodes.find(n => n.id === leg.toNode).coord;
      const properties = {leg: leg.id, active: !!active, symbolic: !surfaceLegs.has(leg.id)};
      if (this.ribbons.has(leg.id)) {
        surfaces.push({type: 'Feature', properties, geometry: this.ribbons.get(leg.id)});
        flow.push({type: 'Feature', properties, geometry: {type: 'LineString', coordinates: leg.trace}});
      } else {
        flow.push({type: 'Feature', properties: {...properties, symbolic: true}, geometry: {type: 'LineString', coordinates: [a, ...leg.trace, b]}});
      }
    }
    this.map.getSource('water-surface').setData(fc(surfaces));
    this.map.getSource('water-flow').setData(fc(flow));
    // Expose rendered state for browser verification without exposing the model.
    const scene = document.getElementById('scenery');
    scene.dataset.waterSurfaces = surfaces.map(f => f.properties.leg).join(',');
    scene.dataset.waterFlow = flow.map(f => f.properties.leg).join(',');
    const active = journey?.pending?.leg;
    document.getElementById('water-note').textContent = !this.enabled ? 'Water effects off' : active && !surfaceLegs.has(active.id) ? 'Symbolic water movement · schematic reach or enclosed conduit' : 'Illustrative water · width, ripples and speed are not measured';
  }
  setEnabled(enabled) {
    this.enabled = enabled;
    this.layers.forEach(id => this.map.setLayoutProperty(id, 'visibility', enabled ? 'visible' : 'none'));
    this.update(this.journey);
  }
  tick(now) {
    if (!this.enabled || this.journey?.state !== 'traversing' || matchMedia('(prefers-reduced-motion: reduce)').matches || now - this.lastTick < 120) return;
    this.lastTick = now;
    this.map.updateImage('water-ripples', this.texture(now / 650));
    const phase = (Math.floor(now / 120) % 12) / 4;
    this.map.setPaintProperty('water-current', 'line-dasharray', [phase, 3, 1, 3 - phase]);
  }
}
