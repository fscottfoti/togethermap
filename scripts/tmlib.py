import random
import time

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

def randomColor():
    return "#%06x" % random.randint(0,0xFFFFFF)

# meteor stuff here
from MeteorClient import MeteorClient

def callback_function(error, result):
    if error:
        print(error)
        return

    print(result)

def connect(user, password, server=None):
    server = server or "wss://togethermap.com/websocket"
    client = MeteorClient(
        server,
        debug=False,
        auto_reconnect=False)
    client.connect()
    client.login(user, password, callback=callback_function)
    return client

def call(client, method, args):
    client.call(method, args, callback=callback_function)

def wait():
    # so this is Python that looks like node - it's all async
    # you have to wait for things to complete
    while True:
        try:
            time.sleep(1)
        except KeyboardInterrupt:
            break
