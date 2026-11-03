"""Regenerate the standalone HTML from the original GPX files (Python stdlib only)."""
from pathlib import Path
from datetime import datetime
import json
import base64
import math
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
def read_tracks(folder):
    tracks = []
    for source in sorted(folder.glob('*.gpx')):
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
    return tracks

tracks = read_tracks(ROOT / "gpx")
perdersi = read_tracks(ROOT / "gpx" / "perdersi")
assert len(perdersi) == 15 and all(t["simulated"] for t in perdersi)
assert len(tracks) == 15, 'Sono attesi otto percorsi registrati e sette simulati'
assert sum(t['simulated'] for t in tracks) == 7
template = (ROOT / 'tools' / 'page.html').read_text()
payload = json.dumps(tracks, separators=(',', ':'))
(ROOT / 'percorsi.html').write_text(template.replace('__TRACK_DATA__', payload))
ink = (ROOT / 'tools' / 'ink.html').read_text().replace('__INK_SCRIPT__', (ROOT / 'tools' / 'ink.js').read_text())
cartography_dir = ROOT / 'assets' / 'topography'
cartography = json.loads((cartography_dir / 'manifest.json').read_text())
roads = json.loads((ROOT / 'assets' / 'roads' / 'walking-network.geojson').read_text())
cartography['roads'] = [dict(points=f['geometry']['coordinates'], kind=f['properties']['highway']) for f in roads['features']]
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
# Both experiences use one geographic frame, so north remains up when switching.
frame = json.dumps([p for t in tracks + perdersi for segment in t['segments'] for p in segment], separators=(',', ':'))
ink = ink.replace('__MAP_FRAME__', frame)
import zipfile
for title, filename, comparison, series_tracks, color, color_name in [
    ('Ritrovarsi', 'index.html', 'percorsi.html', tracks, '#ff2600', 'Rosso'),
    ('Perdersi', 'perdersi.html', 'perdersi-linee.html', perdersi, '#4938a8', 'Indaco'),
]:
    archive_name = title.lower() + '.zip'
    folder = ROOT / 'gpx' / ('perdersi' if title == 'Perdersi' else '')
    with zipfile.ZipFile(ROOT / 'gpx' / archive_name, 'w', zipfile.ZIP_DEFLATED) as archive:
        for source in sorted(folder.glob('P*.gpx')):
            info = zipfile.ZipInfo(source.name, date_time=(2000,1,1,0,0,0))
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, source.read_bytes())
    links = []
    for name, target, pigment in [('Perdersi','perdersi.html','#4938a8'),('Ritrovarsi','index.html','#ff2600')]:
        current = ' aria-current="page"' if name == title else ''
        links.append(f'<a href="{target}" style="--series-color:{pigment}"{current}>{name}</a>')
    config = json.dumps(dict(name=title, color=color, colorName=color_name))
    page = ink.replace('__TRACK_DATA__', json.dumps(series_tracks, separators=(',', ':')))
    page = page.replace('__EXPERIENCE__', config).replace('__SERIES_LINKS__', ''.join(links))
    page = page.replace('__SERIES_LABEL__', title).replace('__GPX_ARCHIVE__', 'gpx/' + archive_name)
    if title == 'Perdersi':
        page = page.replace('href="percorsi.html"', f'href="{comparison}"')
    (ROOT / filename).write_text(page)
    if title == 'Perdersi':
        lines = template.replace('__TRACK_DATA__', json.dumps(series_tracks, separators=(',', ':')))
        lines = lines.replace("const colors=data.map(()=>'#ff2600');", "const colors=data.map(()=>'#4938a8');")
        (ROOT / comparison).write_text(lines)
    print(f'{filename}: {title}, {len(series_tracks)} percorsi, colore {color}')
print(f'Creato index.html: {len(tracks)} percorsi, {sum(len(s) for t in tracks for s in t["segments"])} punti')
