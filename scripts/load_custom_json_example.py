import tmlib as tm
import sys
import json

args = sys.argv[1:]
if len(args) != 2:
    print "Pass in username and password on command line"
    sys.exit()

user, password = args[0], args[1]

#####
FILENAME = "curbed-ny.json"
d = json.loads(open(FILENAME).read())
COLLECTION_NAME = "New York Buildings"
devs = d["5500aa96f92ea14e8a01b150"]["object"]["map_points"]

# modify these lines to load the san fran data instead
# FILENAME = "curbed-sf.json"
# d = json.loads(open(FILENAME).read())
# COLLECTION_NAME = "San Francisco Buildings"
# devs = d["542ebc4af92ea130410088dd"]["object"]["map_points"]
#####

tm.connect(user, password, debug=False,
           server='ws://127.0.0.1:3000/websocket')

print "Creating colection"
error, cid = tm.call('createCollection',
                     [{'name': COLLECTION_NAME}])
print "Created collection:", cid

print "Loading places"
for dev in devs:

    properties = {
        'caption': dev['caption'],
        'url': dev['url'],
        'image_url': dev['image_url'],
        'address': dev['address']
    }

    place = tm.createMarker(
        dev["latitude"],
        dev["longitude"],
        tm.randomColor(),
        dev["name"],
        description='',
        properties=properties
    )

    error, pid = tm.call('insertPlace', [place, cid])
    print "Loaded place:", pid
