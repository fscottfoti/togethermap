from pymongo import MongoClient

db = MongoClient('localhost', 3001).meteor

collections = {o['_id']: o for o in db['collections'].find()}
places = {o['_id']: o for o in db['places'].find()}
comments = {o['_id']: o for o in db['comments'].find()}

print "There are %d collections" % len(collections)
print "There are %d places" % len(places)
print "There are %d comments" % len(comments)

print "PLACES"
for p, o in places.iteritems():
    if o['collectionId'] not in collections:
        print "Collection not found for place: %s" % p
        # db['places'].remove(p)

print "COMMENTS"
for c, o in comments.iteritems():
    if o['collectionId'] not in collections:
        print "Collection not found for comment: %s" % c
        # db['comments'].remove(c)
    if 'placeId' not in o:
        # the older version of tm used postId rather than placeId
        # if you use the current version of tm you won't see this
        print 'placeId not in o for comment: %s' % c
    else:
        if o['placeId'] not in places:
            print "Place not found for comment: %s" % c
            # db['comments'].remove(c)
