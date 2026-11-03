"""Fetch only the fixed map frame, once. Cached tiles are reused on later runs.
Source: OpenTopoMap; attribution and CC BY-SA 3.0 in assets/topography/LICENSE.md.
"""
from pathlib import Path
import math
import json
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'assets' / 'topography'
DEST.mkdir(parents=True, exist_ok=True)
points = [p for f in sorted((ROOT / 'gpx').glob('*.gpx')) for p in ET.parse(f).findall('.//{*}trkpt')]
lat0 = sum(float(p.get('lat')) for p in points) / len(points)
R = 6371000
correction = math.cos(math.radians(lat0))
project = lambda lat, lon: (R*math.radians(lon)*correction, -R*math.log(math.tan(math.pi/4+math.radians(lat)/2))*correction)
coords = [project(float(p.get('lat')), float(p.get('lon'))) for p in points]
x0, x1 = min(p[0] for p in coords), max(p[0] for p in coords)
y0, y1 = min(p[1] for p in coords), max(p[1] for p in coords)
scale = min(850/(x1-x0),395/(y1-y0))
ox, oy = (1000-(x1-x0)*scale)/2,120+(395-(y1-y0)*scale)/2
inverse = lambda x,y: (math.degrees(2*math.atan(math.exp(-y/(R*correction)))-math.pi/2), math.degrees(x/(R*correction)))
north,west = inverse(x0-ox/scale,y0-oy/scale)
south,east = inverse(x0+(1000-ox)/scale,y0+(620-oy)/scale)
z = 15
n = 2**z
def tile(lat,lon):
    return ((lon+180)/360*n, (1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n)
left,top = map(math.floor,tile(north,west))
right,bottom = map(math.floor,tile(south,east))
items=[]
for y in range(top,bottom+1):
    for x in range(left,right+1):
        name=f'{z}-{x}-{y}.png'
        path=DEST/name
        url=f'https://a.tile.opentopomap.org/{z}/{x}/{y}.png'
        if not path.exists():
            req=urllib.request.Request(url,headers={'User-Agent':'PxO-Thesis-Artwork/1.0 (fixed single map frame)'})
            with urllib.request.urlopen(req,timeout=30) as response:
                data=response.read()
            if not data.startswith(b'\x89PNG\r\n\x1a\n'):
                raise ValueError(f'Invalid tile: {url}')
            path.write_bytes(data)
        items.append(dict(z=z,x=x,y=y,file=name))
manifest=dict(source='OpenTopoMap',zoom=z,bounds=dict(north=north,south=south,east=east,west=west),tiles=items)
(DEST/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'{len(items)} tessere nella sola inquadratura: {west:.5f},{south:.5f} – {east:.5f},{north:.5f}')
