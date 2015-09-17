import random
import time
from shapely.geometry import shape

def createPlace(lat, lng, color, name, description, properties):
    d = {
        "type": "Feature",
        "bbox": {
            "type": "Point",
            "coordinates": [lng, lat]
        },
        "geometry": {
            "type": "Point",
            "coordinates": [lng, lat]
        },
        "properties": {
            "color": color,
            "icon_size": "m",
            "icon": "building",
            "name": name,
            "description": description
        }
    }
    for k, v in properties.items():
       d["properties"][k] = v
    return d


def add_bbox(p):
    if p['geometry']['type'] in ['Polygon', 'MultiPolygon']:
        bounds = shape(p['geometry']).bounds
        minx, miny, maxx, maxy = bounds
        poly = {
            "type": "Polygon",
            "coordinates": [
                [ [minx, miny], [minx, maxy], [maxx, maxy],
                  [maxx, miny], [minx, miny] ]
            ]
        } 
    else:
        poly = p['geometry']
    p['bbox'] = poly
    return p


def randomColor():
    return "#%06x" % random.randint(0,0xFFFFFF)

# meteor stuff here
from MeteorClient import MeteorClient

def callback_function(error, result):
    if error:
        print(error)
        return

    print(result)

def connect(user, password, server=None, callback=None):
    server = server or "wss://togethermap.com/websocket"
    client = MeteorClient(
        server,
        debug=False,
        auto_reconnect=False)
    client.connect()
    client.login(user, password, callback=(callback or callback_function))
    return client

def call(client, method, args, callback=None):
    client.call(method, args, callback=(callback or callback_function))

def wait():
    # so this is Python that looks like node - it's all async
    # you have to wait for things to complete
    while True:
        try:
            time.sleep(1)
        except KeyboardInterrupt:
            break
