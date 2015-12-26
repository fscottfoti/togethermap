from pymongo import MongoClient
import sys
import json
from bson import json_util

args = sys.argv[1:]
if len(args) != 2:
    print "Usage: <collectionId> <type>\n" +\
          "    type should be one of 'json', 'geojson', or 'shp'\n" +\
          "    will write to a file of the form '<collectionId>.<type>'"
    sys.exit()
cid, typ = args

assert typ in ["json", "geojson", "shp"]

db = MongoClient('localhost', 3001).meteor

fname = cid + "." + typ


if typ == "json":
	with open(fname, "w") as f:
	    for place in db['places'].find({"collectionId": cid}):
		    f.write(json.dumps(place, default=json_util.default) + "\n")


if typ == "geojson":
	with open(fname, "w") as f:
  	    features = [f for f in db['places'].find({"collectionId": cid})]
	    f.write(json.dumps({
            "type": "FeatureCollection",
            "features": features
	    }, default=json_util.default))


if typ == "shp":
	import fiona
	with fiona.open('your_shapefile.shp', 
		'w',
		crs=fiona.crs.from_epsg(4326),
		driver='ESRI Shapefile', schema=yourschema) as f:
		    for place in db['places'].find({"collectionId": cid}):
				f.write(place)