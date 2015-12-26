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

db = MongoClient('localhost', 27017).togethermap

fname = cid + "." + typ


if typ == "json":
    with open(fname, "w") as f:
        for place in db['places'].find({"collectionId": cid}):
            f.write(json.dumps(place, default=json_util.default) + "\n")


if typ == "geojson":
    with open(fname, "w") as f:
        features = [p for p in db['places'].find({"collectionId": cid})]
        f.write(json.dumps({
            "type": "FeatureCollection",
            "features": features
        }, default=json_util.default))


tmap = {
    "unicode": "str",
    "float": "float",
    "int": "int",
    "NoneType": "str"
}

if typ == "shp":
    import fiona
    from fiona.crs import from_epsg

    # get a sample place do build a schema from - if other places don't match
    # this schema you'll get a fiona error, although this should be dealt with
    # in the future
    p = db['places'].find_one({"collectionId": cid})
    props = {k: tmap[type(v).__name__] for k, v in p["properties"].iteritems()}

    myschema = {
        'geometry': p["geometry"]["type"],
        'properties': props,
    }
    with fiona.open(fname, 'w', crs=from_epsg(4326),
                    driver='ESRI Shapefile', schema=myschema) as f:
        for place in db['places'].find({"collectionId": cid}):
            f.write(place)
