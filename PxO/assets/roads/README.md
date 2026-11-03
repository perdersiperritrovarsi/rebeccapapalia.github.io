# OpenStreetMap road network

© OpenStreetMap contributors. Database licensed under ODbL 1.0:
https://www.openstreetmap.org/copyright
https://opendatacommons.org/licenses/odbl/1-0/

The source endpoint, exact query, retrieval time and OSM database timestamp are
recorded in source.json. walking-network.geojson and walking-graph.json are
filtered extracts of that database, retaining the ODbL terms. This folder is
part of the public repository so the routing database is available with the work.

Excluded: motorways; explicit foot=no/private; access=no/private unless foot
access explicitly permits walking; cycleways/bridleways without foot permission.
Public accessibility and physical safety cannot be established from OSM alone.

The graph preserves OSM node IDs and geographic coordinates; edges store metres.
Route selection uses the snapshot offline; no external requests are made by the
website. tools/simulate_tracks.py generates P09–P15 with deterministic rules.
route-report.json records each route's nodes, distance and overlap statistics.
These seven trajectories are generated artistic additions, not new observations.
The initial 7-metre connection from P01 to the nearest OSM node is a connector,
not an independently mapped street.
