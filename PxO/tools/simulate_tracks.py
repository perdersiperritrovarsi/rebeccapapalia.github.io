"""Create seven explicitly synthetic walks along the network sampled by P01–P08.
No new road survey: nearby GPS samples are merged within 12 m. Original GPX
files are never written. Fixed seeds make geometry and timing reproducible.
"""
from pathlib import Path
import math, random, collections
from datetime import datetime, timedelta, timezone
import xml.etree.ElementTree as ET
ROOT = Path(__file__).resolve().parent.parent
NS = 'http://www.topografix.com/GPX/1/1'
ET.register_namespace('', NS)
def tag(s): return '{'+NS+'}'+s
nodes=[]; graph=collections.defaultdict(set); buckets=collections.defaultdict(list)
lat0=38.22; factor=111195; cosine=math.cos(math.radians(lat0))
def xy(p): return (p[1]*factor*cosine,p[0]*factor)
def distance(a,b): return math.dist(xy(a),xy(b))
def node(p):
 x,y=xy(p); key=(int(x//12),int(y//12)); near=[]
 for dx in [-1,0,1]:
  for dy in [-1,0,1]:
   near.extend(buckets[(key[0]+dx,key[1]+dy)])
 best=min(near,key=lambda i:distance(p,nodes[i]),default=None)
 if best is not None and distance(p,nodes[best])<=12: return best
 i=len(nodes);nodes.append(p);buckets[key].append(i);return i
start=None
for k in range(1,9):
 tree=ET.parse(ROOT/'gpx'/f'P{k:02}.gpx')
 for segment in tree.findall('.//{*}trkseg'):
  previous=None
  for point in segment.findall('{*}trkpt'):
   p=(float(point.get('lat')),float(point.get('lon')))
   if start is None: start=p
   current=node(p)
   if previous is not None and current!=previous and distance(nodes[current],nodes[previous])<60:
    graph[current].add(previous);graph[previous].add(current)
   previous=current
source=min(range(len(nodes)),key=lambda i:distance(start,nodes[i]))
for number in range(9,16):
 rng=random.Random(20261103+number);current=source;previous=None;visits=collections.Counter();walk=[start];length=0
 target=1200+(number-9)*150
 while length<target:
  candidates=sorted(graph[current])
  weights=[(0.04 if n==previous else 1)/(1+visits[tuple(sorted((current,n)))])**2 for n in candidates]
  nxt=rng.choices(candidates,weights=weights)[0]
  visits[tuple(sorted((current,nxt)))]+=1
  p=nodes[nxt];length+=distance(walk[-1],p);walk.append(p);previous,current=current,nxt
 root=ET.Element(tag('gpx'),version='1.1',creator='PxO — synthetic artistic simulation')
 meta=ET.SubElement(root,tag('metadata'));ET.SubElement(meta,tag('name')).text=f'P{number:02} — percorso simulato'
 description='SIMULATO: percorso artificiale, non registrato da una persona. Ricombinazione della rete GPS P01–P08 con soste e tempi sintetici; non verifica la percorribilità delle strade.'
 ET.SubElement(meta,tag('desc')).text=description
 trk=ET.SubElement(root,tag('trk'));ET.SubElement(trk,tag('name')).text=f'P{number:02} — simulato';ET.SubElement(trk,tag('type')).text='simulated';seg=ET.SubElement(trk,tag('trkseg'))
 elapsed=0.;base=datetime(2000,1,1,tzinfo=timezone.utc)
 def emit(p,t):
  pt=ET.SubElement(seg,tag('trkpt'),lat=f'{p[0]:.7f}',lon=f'{p[1]:.7f}')
  ET.SubElement(pt,tag('time')).text=(base+timedelta(seconds=t)).isoformat(timespec='milliseconds').replace('+00:00','Z')
 emit(walk[0],0)
 for a,b in zip(walk,walk[1:]):
  d=distance(a,b);duration=d/rng.uniform(.75,1.5);steps=max(1,math.ceil(duration/3))
  for j in range(1,steps+1): emit(tuple(a[k]+(b[k]-a[k])*j/steps for k in range(2)),elapsed+duration*j/steps)
  elapsed+=duration
  if rng.random()<.055:
   elapsed+=rng.uniform(8,40);emit(b,elapsed)
 path=ROOT/'gpx'/f'P{number:02}.gpx';ET.indent(root);ET.ElementTree(root).write(path,encoding='utf-8',xml_declaration=True)
 print(path.name,round(length),'m',round(elapsed),'s')
