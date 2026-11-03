"""Generate P09–P15 on the cached OpenStreetMap pedestrian graph.
Synthetic artistic trajectories, not observations of additional participants.
P01–P08 are read-only. All GPX outputs preserve their synthetic provenance.
Fixed routing rules and random seeds make the output reproducible offline.
"""
import json,math,heapq,collections,xml.etree.ElementTree as E
from pathlib import Path
r=Path(__file__).resolve().parent.parent;g=json.loads((r/'assets/roads/walking-graph.json').read_text());nodes={int(k):v for k,v in g['nodes'].items()};adj={int(k):{int(b):d for b,d in v.items()} for k,v in g['adjacency'].items()};start=g['nearest_node'];origin=g['start']
def xy(p):return ((p[1]-origin[1])*111195*math.cos(math.radians(origin[0])),(p[0]-origin[0])*111195)
coords={n:xy(p) for n,p in nodes.items()}
buckets=collections.defaultdict(list)
for k in range(1,9):
 for p in E.parse(r/f'gpx/P{k:02}.gpx').findall('.//{*}trkpt'):
  x,y=xy([float(p.get('lat')),float(p.get('lon'))]);buckets[(int(x//40),int(y//40))].append((x,y))
def near(p):
 x,y=p;found=[]
 for dx in [-1,0,1]:
  for dy in [-1,0,1]:found.extend(buckets[(int(x//40)+dx,int(y//40)+dy)])
 return min((math.dist(p,q) for q in found),default=1000)<35
old={n:near(p) for n,p in coords.items()};used=collections.Counter()
novel_length={}
for a,neighbors in adj.items():
 for b,d in neighbors.items():
  if a>b:continue
  steps=max(1,math.ceil(d/15))
  fraction=sum(not near(tuple(coords[a][k]+(coords[b][k]-coords[a][k])*(j+.5)/steps for k in range(2))) for j in range(steps))/steps
  novel_length[(a,b)]=fraction*d
def edge(a,b):return tuple(sorted((a,b)))
def search(source):
 dist={source:0};length={source:0};parent={};heap=[(0,source)]
 while heap:
  cost,a=heapq.heappop(heap)
  if cost!=dist[a]:continue
  for b,d in adj[a].items():
   if math.hypot(*coords[b])>2200:continue
   v=cost+d*(1+3.5*(1-novel_length[edge(a,b)]/d)+6*used[edge(a,b)])
   if v<dist.get(b,math.inf):dist[b]=v;length[b]=length[a]+d;parent[b]=a;heapq.heappush(heap,(v,b))
 return dist,length,parent
routes=[]
for k,angle in enumerate([15,70,125,175,225,280,330]):
 dist,length,parent=search(start);bearing=math.radians(angle)
 choices=[]
 for n,p in coords.items():
  radial=math.hypot(*p)
  if n not in length or not 900<radial<1800 or not 1100<length[n]<4200:continue
  delta=abs(math.atan2(math.sin(math.atan2(p[1],p[0])-bearing),math.cos(math.atan2(p[1],p[0])-bearing)))
  score=dist[n]/length[n]+2*delta+abs(radial-1250)/1500
  path=[n]
  while path[-1]!=start:path.append(parent[path[-1]])
  path.reverse()
  edges={edge(a,b) for a,b in zip(path,path[1:])}
  novel=sum(novel_length[edge(a,b)] for a,b in zip(path,path[1:]))/length[n]
  shared=max((sum(adj[a][b] for a,b in edges & set(edge(x,y) for x,y in zip(q,q[1:])))/min(length[n],sum(adj[x][y] for x,y in zip(q,q[1:]))) for q in routes),default=0)
  if novel>=.65 and shared<=.4:choices.append((score,n))
 if not choices:raise ValueError(f'No sufficiently distinct route for P{k+9:02}; relax the search area explicitly rather than reuse an existing path')
 _,target=min(choices);path=[target]
 while path[-1]!=start:path.append(parent[path[-1]])
 path.reverse()
 edges={edge(a,b) for a,b in zip(path,path[1:])};total=sum(adj[a][b] for a,b in zip(path,path[1:]));novel=sum(novel_length[edge(a,b)] for a,b in zip(path,path[1:]))/total
 shared=max((sum(adj[a][b] for a,b in edges & prev)/total for prev in [set(edge(a,b) for a,b in zip(q,q[1:])) for q in routes]),default=0)
 print(k+9,'length',round(total),'novel',round(novel,2),'shared',round(shared,2),'end',coords[target])
 routes.append(path)
 for a,b in zip(path,path[1:]):used[edge(a,b)]+=1


# Write synthetic timestamps, speed variation and pauses along actual OSM edges.
from datetime import datetime,timedelta,timezone
import random
NS='http://www.topografix.com/GPX/1/1'
E.register_namespace('',NS)
def tag(name):return '{'+NS+'}'+name
report=[]
for number,path in enumerate(routes,9):
 rng=random.Random(20261103+number)
 root=E.Element(tag('gpx'),version='1.1',creator='PxO — OpenStreetMap-based artistic trajectory')
 meta=E.SubElement(root,tag('metadata'));E.SubElement(meta,tag('name')).text=f'P{number:02}'
 E.SubElement(meta,tag('desc')).text='Synthetic artistic trajectory on OpenStreetMap roads, not a participant GPS recording. Generated timings; conventional date 2000-01-01. Original P01–P08 unchanged.'
 trk=E.SubElement(root,tag('trk'));E.SubElement(trk,tag('name')).text=f'P{number:02}';E.SubElement(trk,tag('type')).text='simulated';seg=E.SubElement(trk,tag('trkseg'))
 elapsed=0.;base=datetime(2000,1,1,tzinfo=timezone.utc);points=[origin]+[nodes[n] for n in path]
 def emit(p,t):
  pt=E.SubElement(seg,tag('trkpt'),lat=f'{p[0]:.7f}',lon=f'{p[1]:.7f}')
  E.SubElement(pt,tag('time')).text=(base+timedelta(seconds=t)).isoformat(timespec='milliseconds').replace('+00:00','Z')
 emit(points[0],0)
 speed=rng.uniform(.95,1.35)
 for a,b in zip(points,points[1:]):
  speed=max(.75,min(1.55,speed+rng.uniform(-.12,.12)))
  duration=math.dist(xy(a),xy(b))/speed;steps=max(1,math.ceil(duration/3))
  for j in range(1,steps+1):emit(tuple(a[k]+(b[k]-a[k])*j/steps for k in range(2)),elapsed+duration*j/steps)
  elapsed+=duration
  if rng.random()<.045:elapsed+=rng.uniform(6,32);emit(b,elapsed)
 E.indent(root);E.ElementTree(root).write(r/'gpx'/f'P{number:02}.gpx',encoding='utf-8',xml_declaration=True)
 total=sum(adj[a][b] for a,b in zip(path,path[1:]));unique=sum(novel_length[edge(a,b)] for a,b in zip(path,path[1:]))/total
 own=set(edge(a,b) for a,b in zip(path,path[1:]));overlaps={}
 for other,q in enumerate(routes,9):
  if number==other:continue
  their=set(edge(a,b) for a,b in zip(q,q[1:]));other_length=sum(adj[a][b] for a,b in zip(q,q[1:]))
  overlaps[f'P{other:02}']=round(sum(adj[a][b] for a,b in own & their)/min(total,other_length),4)
 report.append({'id':f'P{number:02}','osm_nodes':path,'length_m':round(total),'duration_s':round(elapsed),'fraction_beyond_35m_of_originals':round(unique,4),'shared_length_fraction_of_shorter_route':overlaps})
(r/'assets/roads/route-report.json').write_text(json.dumps({'method':'Distance-weighted samples every <=15m; original GPS samples within 35m count as overlap. Shared graph edges measured against shorter route.','start':origin,'connector_m':round(math.dist(xy(origin),coords[start]),2),'routes':report},indent=2)+'\n')
