"""Offline, reproducible subset; originals are read-only. Run from any directory."""
import csv, json, math, shutil
from pathlib import Path
from datetime import datetime
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
system=json.loads((ROOT/'water-system-3d/system.json').read_text())
points={p['id']:p for p in system['points']}
ids=['sntl-531','res-eleven_mile','res-cheesman','gage-06707525','dam-strontia','plant-foothills','dam-marston-diversion','res-marston','plant-marston']
nodes=[dict(id=i,name=points[i]['name'].replace('Gauge','Node'),kind=points[i]['kind'],coord=[points[i]['lon'],points[i]['lat']]) for i in ids]
# Upstream NLDI features are ordered downstream -> upstream, each oriented downstream.
up=json.loads((ROOT/'strontia-brief/basins/mainstem-flowlines-06707525.json').read_text())['features']
down=json.loads((ROOT/'strontia-brief/basins/downstream-mainstem-06707525.json').read_text())['features']
river=[]
for f in list(reversed(up))+down[1:]:
 for c in f['geometry']['coordinates']:
  if not river or c!=river[-1]:river.append(c)
def nearest(c,seq):return min(range(len(seq)),key=lambda i:(seq[i][0]-c[0])**2*0.6+(seq[i][1]-c[1])**2)
def reach(a,b):
 i,j=nearest(points[a] and [points[a]['lon'],points[a]['lat']],river),nearest([points[b]['lon'],points[b]['lat']],river)
 assert i<j,(a,b,i,j)
 return river[i:j+1]
legs=[]
def leg(id,a,b,name,days,trace=None,source='Infrastructure: water-system-3d/system.json'):
 legs.append(dict(id=id,fromNode=a,toNode=b,name=name,days=days,trace=trace or [],source=source,bore=False))
leg('headwaters',ids[0],ids[1],'Middle Fork → South Platte, via Spinney',4,source='Hoosier Pass snow catchment → Middle Fork South Platte → South Platte → Spinney → Eleven Mile. Reach overview; headwater Trace unavailable. See README sources.')
for id,a,b,name,days in [('canyon',ids[1],ids[2],'South Platte · Eleven Mile Canyon',4),('river',ids[2],ids[3],'South Platte · through Deckers',4),('reservoir',ids[3],ids[4],'South Platte · Strontia Springs',2),('waterton',ids[4],ids[6],'South Platte · Waterton Canyon',2)]:
 leg(id,a,b,name,days,reach(a,b),'USGS NLDI: committed mainstem-flowlines-06707525.json and downstream-mainstem-06707525.json; nearest vertices to Nodes. Dashed endpoint joins are schematic.')
leg('foothills',ids[4],ids[5],'Conduit 26 → Foothills',0)
osm=json.loads((ROOT/'strontia-brief/basins/conduits-osm.json').read_text())['features']
trunk=next(f for f in osm if f['properties']['osm_id']==1112753995)
leg('conduit20',ids[6],ids[7],'Conduit 20 → Marston Forebay',2,trunk['geometry']['coordinates'],'OpenStreetMap way 1112753995, committed conduits-osm.json. Partial Trace; dashed endpoint joins are schematic. © OpenStreetMap contributors.')
leg('marston',ids[7],ids[8],'Marston Forebay → treatment plant',0)
parameters={ids[0]:[['SWE','Snow water equivalent','in','HoosierPass.csv','NRCS SNOTEL 531:CO:SNTL','Measured']],ids[3]:[['Temp_C_Mean','Daily mean water temperature','°C','USGS_South_Platte.csv','USGS 06707525','Estimated'],['Turbidity_Median','Daily median turbidity','FNU','USGS_South_Platte.csv','USGS 06707525','Estimated']],ids[5]:[['TOC_mg_L','Total organic carbon','mg/L','FoothillsInfluent.csv','Denver Water · Foothills influent','Measured'],['Alk_mg_L','Alkalinity','mg/L','FoothillsInfluent.csv','Denver Water · Foothills influent','Measured']]}
records={}
for filename in ['HoosierPass.csv','USGS_South_Platte.csv','FoothillsInfluent.csv']:
 records[filename]={}
 for row in csv.DictReader((ROOT/'data'/filename).open()):
  raw=row.get('DATE',row.get('Date'))
  date=datetime.strptime(raw,'%Y-%m-%d' if '-' in raw else '%m/%d/%Y').date().isoformat()
  if any(f'{y}-05-25'<=date<=f'{y}-06-20' for y in (2023,2024)):
   records[filename][date]={k:float(v) for k,v in row.items() if k not in ['DATE','Date','site_no'] and v and v.lower() not in ['nan','na']}
episodes=[dict(id=str(y),name=f'{y} · Hoosier snowmelt',start=f'{y}-05-25',end=f'{y}-06-20',regime='Snow-flush · illustrative timing',factor=0.5) for y in (2023,2024)]
(HERE/'data.json').write_text(json.dumps(dict(nodes=nodes,legs=legs,parameters=parameters,records=records,episodes=episodes),separators=(',',':'))+'\n')
shutil.copyfile(ROOT/'data/TERMS.md',HERE/'TERMS.md')
print('Wrote offline records, infrastructure and Trace subset; copied both data notices.')
