"""Generate an independent south-to-north artistic GPX series on cached OSM.
These are generated trajectories, not participant recordings. Existing GPX files
are read-only. A fixed seed keeps all geometry, timestamps and stops repeatable.
"""
from pathlib import Path
from datetime import datetime,timedelta,timezone
import collections,heapq,json,math,random,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parent.parent
network=json.loads((ROOT/'assets/roads/walking-graph.json').read_text())
nodes={int(n):p for n,p in network['nodes'].items()}
graph={int(n):{int(b):d for b,d in adj.items()} for n,adj in network['adjacency'].items()}
def distance(a,b):return 111195*math.hypot(a[0]-b[0],(a[1]-b[1])*math.cos(math.radians(a[0])))
start=min(graph,key=lambda n:distance(nodes[n],[38.2075,15.6585]))
origin=nodes[start]
def xy(p):return ((p[1]-origin[1])*111195*math.cos(math.radians(origin[0])),(p[0]-origin[0])*111195)
def edge(a,b):return tuple(sorted((a,b)))
coords={n:xy(p) for n,p in nodes.items()}
used=collections.Counter();paths=[];endpoints=[];report=[]
for i in range(15):
 # Two staggered fans, plus a central high destination.
 desired=(-1450+(i%7)*450,1350+(i//7)*450)
 costs={start:0};lengths={start:0};parents={};queue=[(0,start)]
 while queue:
  cost,a=heapq.heappop(queue)
  if cost!=costs[a]:continue
  for b,d in graph[a].items():
   x,y=coords[b]
   if y < -70 or math.hypot(x,y)>3600:continue
   noise=((min(a,b)*31+max(a,b)*17+i*101)%997)/997
   value=cost+d*(1+2.0*used[edge(a,b)]+.35*noise)
   if value<costs.get(b,math.inf):
    costs[b]=value;lengths[b]=lengths[a]+d;parents[b]=a;heapq.heappush(queue,(value,b))
 candidates=[]
 for n,total in lengths.items():
  x,y=coords[n]
  if not 1000<y<3000 or not 1600<total<6000:continue
  if any(math.dist(coords[n],coords[e])<160 for e in endpoints):continue
  score=math.dist(coords[n],desired)/900+.3*costs[n]/total
  candidates.append((score,n))
 chosen=None
 for score,n in sorted(candidates):
  path=[n]
  while path[-1]!=start:path.append(parents[path[-1]])
  path.reverse();own=set(edge(a,b) for a,b in zip(path,path[1:]))
  overlaps=[]
  for q in paths:
   other=set(edge(a,b) for a,b in zip(q,q[1:]));other_length=sum(graph[a][b] for a,b in zip(q,q[1:]))
   overlaps.append(sum(graph[a][b] for a,b in own & other)/min(lengths[n],other_length))
  if max(overlaps,default=0)<=.75:chosen=(n,path,overlaps);break
 if chosen is None:raise ValueError(f'No sufficiently distinct northbound route for P{i+1:02}')
 n,path,overlaps=chosen;paths.append(path);endpoints.append(n)
 for a,b in zip(path,path[1:]):used[edge(a,b)]+=1
 report.append({'id':f'P{i+1:02}','osm_nodes':path,'length_m':round(lengths[n]),'northward_displacement_m':round(coords[n][1]),'maximum_shared_fraction_of_shorter_route':round(max(overlaps,default=0),4)})
NS='http://www.topografix.com/GPX/1/1';ET.register_namespace('',NS)
def tag(s):return '{'+NS+'}'+s
folder=ROOT/'gpx/perdersi';folder.mkdir(parents=True,exist_ok=True)
for route,path in zip(report,paths):
 rng=random.Random(20261103+int(route['id'][1:])*133)
 root=ET.Element(tag('gpx'),version='1.1',creator='PxO — OpenStreetMap-based artistic trajectory')
 meta=ET.SubElement(root,tag('metadata'));ET.SubElement(meta,tag('name')).text='Perdersi · '+route['id']
 ET.SubElement(meta,tag('desc')).text='Generated artistic trajectory on OpenStreetMap roads, not a participant recording. South-to-north series. Synthetic timing with conventional date 2000-01-01.'
 trk=ET.SubElement(root,tag('trk'));ET.SubElement(trk,tag('name')).text=route['id'];ET.SubElement(trk,tag('type')).text='simulated';segment=ET.SubElement(trk,tag('trkseg'))
 elapsed=0.;base=datetime(2000,1,1,tzinfo=timezone.utc)
 def emit(p,t):
  pt=ET.SubElement(segment,tag('trkpt'),lat=f'{p[0]:.7f}',lon=f'{p[1]:.7f}')
  ET.SubElement(pt,tag('time')).text=(base+timedelta(seconds=t)).isoformat(timespec='milliseconds').replace('+00:00','Z')
 emit(origin,0);speed=rng.uniform(.9,1.4)
 for a,b in zip(path,path[1:]):
  speed=max(.75,min(1.55,speed+rng.uniform(-.12,.12)));duration=graph[a][b]/speed;steps=max(1,math.ceil(duration/3))
  for j in range(1,steps+1):emit([nodes[a][k]+(nodes[b][k]-nodes[a][k])*j/steps for k in range(2)],elapsed+duration*j/steps)
  elapsed+=duration
  if rng.random()<.045:elapsed+=rng.uniform(6,35);emit(nodes[b],elapsed)
 route['duration_s']=round(elapsed)
 ET.indent(root);ET.ElementTree(root).write(folder/(route['id']+'.gpx'),encoding='utf-8',xml_declaration=True)
 print(route['id'],route['length_m'],'m; north',route['northward_displacement_m'],'m; shared',route['maximum_shared_fraction_of_shorter_route'])
(ROOT/'assets/roads/perdersi-report.json').write_text(json.dumps({'series':'Perdersi','start_node':start,'start':origin,'routes':report},indent=2)+'\n')
