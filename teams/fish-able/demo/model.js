export const addDays = (date, days) => new Date(Date.parse(date + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10);

// Deliberate policy seam: no fabricated fallback, per the task's override of CONTEXT.md.
export function unavailableReading(parameter, unit, date, source) {
  return { parameter, unit, date, source, value: null, provenance: null, reason: 'No supported observation on this date in the demo records.' };
}
export function readingsAt(data, node, date) {
  const definitions = data.parameters[node] || [
    ['TOC_mg_L', 'Total organic carbon', 'mg/L', null, 'No supported dataset for this Node', null],
    ['Alk_mg_L', 'Alkalinity', 'mg/L', null, 'No supported dataset for this Node', null],
  ];
  return definitions.map(([key, parameter, unit, file, source, provenance]) => {
    const value = data.records[file]?.[date]?.[key];
    if (!Number.isFinite(value)) return unavailableReading(parameter, unit, date, file ? `${source} · data/${file}` : source);
    return {parameter, unit, date, value, provenance, source: `${source} · data/${file}`, file,
      method: provenance === 'Estimated' ? 'Supplied daily summary of sensor observations (mean or median as named); aggregation code is not reproduced here.' : 'Recorded sensor or lab observation from the supplied daily file.', provisional: true};
  });
}
export class Journey {
  constructor(data, episode, departure, fixture = false) {
    if (departure < episode.start || departure > episode.end) throw new Error('Departure must be within the Episode.');
    this.data = data; this.episode = episode; this.departure = departure; this.date = departure;
    this.node = 'sntl-531'; this.fixture = fixture; this.state = 'ready'; this.events = []; this.visits = []; this.selected = []; this.pending = null;
    this.emit('Episode selected', episode.name); this.emit('Starting Node selected', this.node);
  }
  emit(name, detail = '') {this.events.push({name, detail, date: this.date, node: this.node});}
  present() {this.readings = readingsAt(this.data, this.node, this.date); this.visits.push({node: this.node, date: this.date, readings: this.readings}); this.emit('Readings presented', this.readings.map(r => `${r.parameter}: ${r.value ?? 'Reading unavailable'}`).join('; '));}
  start() {if (this.state !== 'ready') throw new Error('Journey already started'); this.state = 'choosing'; this.emit('Journey started'); this.present();}
  available() {return this.data.legs.filter(l => l.fromNode === this.node);}
  days(leg) {return Math.ceil(leg.days * this.episode.factor * (this.fixture ? 2 : 1));}
  select(id) {
    if (this.state !== 'choosing') throw new Error('Cannot select a Leg now');
    const leg = this.available().find(l => l.id === id); if (!leg) throw new Error('Leg is not downstream of the current Node');
    this.selected.push(id); this.emit('Leg selected', leg.name);
    if (this.fixture && id === 'foothills') {
      this.emit('Selected Leg found closed under the Regime', 'TEST FIXTURE ONLY · Conduit 26');
      this.end('Closed Leg · test fixture, not a historical event.'); return null;
    }
    const arrival = addDays(this.date, this.days(leg));
    if (arrival > this.episode.end) {this.end(`Episode boundary: proposed arrival ${arrival} exceeds ${this.episode.end}. Fish remains at the current Node; no traversal or out-of-Episode Readings.`); return null;}
    this.state = 'traversing'; this.pending = {leg, arrival}; return this.pending;
  }
  arrive() {
    if (this.state !== 'traversing' || !this.pending) throw new Error('No Leg in transit');
    const {leg, arrival} = this.pending; this.date = arrival; this.emit('Leg traversed', leg.name);
    this.node = leg.toNode; this.emit('Node reached', this.node); this.present(); this.pending = null;
    if (this.data.nodes.find(n => n.id === this.node).kind === 'plant') {
      this.emit('Treatment plant reached', this.node); this.state = 'completed'; this.reason = 'Your fish has reached a treatment plant.'; this.emit('Journey completed');
    } else this.state = 'choosing';
  }
  end(reason) {this.state = 'ended'; this.reason = reason; this.emit('Journey ended', reason);}
}
