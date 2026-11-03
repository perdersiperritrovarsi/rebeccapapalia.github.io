"""Regenerate the standalone HTML from the original GPX files (Python stdlib only)."""
from pathlib import Path
from datetime import datetime
import json
import base64
import math
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
tracks = []
for source in sorted((ROOT / 'gpx').glob('*.gpx')):
    segments = []
    origin = None
    distance = 0
    previous_time = None
    document = ET.parse(source)
    simulated = document.findtext('.//{*}trk/{*}type') == 'simulated'
    for segment in document.findall('.//{*}trkseg'):
        points = []
        previous = None
        for point in segment.findall('{*}trkpt'):
            timestamp = point.find('{*}time')
            if timestamp is None:
                raise ValueError(f'{source.name}: punto senza orario')
            time = datetime.fromisoformat(timestamp.text.replace('Z', '+00:00')).timestamp()
            if previous_time is not None and time < previous_time:
                raise ValueError(f'{source.name}: orari non ordinati')
            previous_time = time
            if origin is None:
                origin = time
            lat, lon = float(point.attrib['lat']), float(point.attrib['lon'])
            if previous:
                a, b = map(math.radians, (previous[0], lat))
                dlat = b-a
                dlon = math.radians(lon-previous[1])
                h = math.sin(dlat/2)**2 + math.cos(a)*math.cos(b)*math.sin(dlon/2)**2
                distance += 6371000*2*math.asin(min(1, math.sqrt(h)))
            previous = (lat, lon)
            points.append([round(time-origin, 3), lat, lon])
        if points:
            segments.append(points)
    if not segments:
        raise ValueError(f'{source.name}: nessuna traccia')
    tracks.append(dict(id=source.stem, simulated=simulated, segments=segments, distance=round(distance), duration=segments[-1][-1][0]))
assert len(tracks) == 15, 'Sono attesi otto percorsi registrati e sette simulati'
assert sum(t['simulated'] for t in tracks) == 7
template = (ROOT / 'tools' / 'page.html').read_text()
payload = json.dumps(tracks, separators=(',', ':'))
(ROOT / 'percorsi.html').write_text(template.replace('__TRACK_DATA__', payload))
ink = (ROOT / 'tools' / 'ink.html').read_text().replace('__INK_SCRIPT__', (ROOT / 'tools' / 'ink.js').read_text())
cartography_dir = ROOT / 'assets' / 'topography'
cartography = json.loads((cartography_dir / 'manifest.json').read_text())
roads = json.loads((ROOT / 'assets' / 'roads' / 'walking-network.geojson').read_text())
cartography['roads'] = [f['geometry']['coordinates'] for f in roads['features']]
# Preserve mapped road names beyond the coverage of the cached raster tiles.
cartography['road_names'] = []
for feature in roads['features']:
    name = feature['properties'].get('name')
    coords = feature['geometry']['coordinates']
    if not name or len(coords) < 2:
        continue
    lengths = [math.hypot((b[0]-a[0])*math.cos(math.radians(a[1])), b[1]-a[1]) for a,b in zip(coords, coords[1:])]
    total = sum(lengths)
    remaining = total/2
    for j, length in enumerate(lengths):
        if remaining <= length and length > 0:
            a,b = coords[j],coords[j+1]
            f = remaining/length
            cartography['road_names'].append(dict(name=name, at=[a[k]+(b[k]-a[k])*f for k in range(2)], tangent=[a,b], length=total))
            break
        remaining -= length
cartography['road_names'].sort(key=lambda label: label['length'], reverse=True)
for tile in cartography['tiles']:
    tile['image'] = 'data:image/png;base64,' + base64.b64encode((cartography_dir / tile['file']).read_bytes()).decode('ascii')
ink = ink.replace('__MAP_DATA__', json.dumps(cartography, separators=(',', ':')))
(ROOT / 'index.html').write_text(ink.replace('__TRACK_DATA__', payload))
print(f'Creato index.html: {len(tracks)} percorsi, {sum(len(s) for t in tracks for s in t["segments"])} punti')
