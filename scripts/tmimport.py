import sys
import json
import tmlib as tm
from pymongo import MongoClient

args = sys.argv[1:]
if len(args) != 4:
	print "Usage: <user> <password> <filename> <collection_name>\n\nPass the name of the geojson, shapefile, or list of json objects you want to import.  An ending of '.json' will be assumed to have one geojson object per line (mongo style) whereas an ending of '.geojson' will be assumed as standard geojson."
	sys.exit()
user, password, fname, collection_name = args

tm.connect(user, password, debug=False,
           server='ws://127.0.0.1:3000/websocket')

def update_place_count(cid, cnt):
	global tm
	tm.call('updateCollection', [cid, {'$set': {'place_count': cnt}}])


user = tm.getUser()

print "Creating colection"
error, cid = tm.call('createCollection', [{'name': collection_name}])
print "Created collection:", cid

# initialize mongo client (change host and port if not local)
db = MongoClient('localhost', 3001).meteor

if fname.endswith(".geojson"):

    obj = json.loads(open(fname).read())

    def chunks(l, n):
	    """Yield successive n-sized chunks from l."""
	    for i in xrange(0, len(l), n):
	        yield l[i:i+n]

    for chunk in chunks(obj["features"], 10000):

    	features = [tm.addTmAttributes(f, cid, user) for f in chunk]
    	print "Inserting %d features" % len(features)
    	db.places.insert_many(features)

    update_place_count(cid, len(obj["features"]))

