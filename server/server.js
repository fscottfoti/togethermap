var getUser = function (userId) {
    if(!userId)
        return undefined;
    return Meteor.users.findOne(userId);
};


var getUserEmail = function (userId) {
    var user = getUser(userId);

    if(user && user.services.google && user.services.google.email)
        return user.services.google.email;
    if(user && user.emails && user.emails.length) {
        return user.emails[0].address;
    }
};


var sensitiveCollectionFields = {
    post_writers: 0,
    place_writers: 0,
    owners: 0,
    readers: 0,
    readers_key: 0,
    owners_key: 0,
    post_writers_key: 0,
    place_writers_key: 0
};


/* get collections that are from the gallery, and remove
   sensitive fields */
Meteor.publish('collections', function () {
    return MCollections.find(
        {gallery: true},
        {fields: sensitiveCollectionFields, limit: 50}
    );
});


/* get all the collections for a given user */
Meteor.publish('collectionsUser', function () {
    if(!this.userId)
        return this.ready();
    return MCollections.find(userIdExpression(getUser(this.userId)));
});


/* get a sepcific collection */
Meteor.publish('collection', function (id) {
    if(!readPermission(getUser(this.userId), id))
        return this.ready();

    return MCollections.find(id, {fields: sensitiveCollectionFields});
});


// this publication is a way to release a small amount of information
// to people who have the permissions link but haven't yet actually
// been added to the permissions list on the collection
Meteor.publish('collectionViaKey', function (id, key) {

    var c = MCollections.findOne(id);
    if((c.readers_key && c.readers_key == key) ||
        (c.owners_key && c.owners_key == key) ||
        (c.post_writers_key && c.post_writers_key == key) ||
        (c.place_writers_key && c.place_writers_key == key)) {

        return MCollections.find(id, {fields: sensitiveCollectionFields});
    }

    return this.ready();
});


// this is the most important publication in the app, obviously
// it sends the geojson places to the client.  notice the "near"
// query overrides the "bounds" query as near loads all the places
// close to the center of the map and is now the preferred behavior
Meteor.publish('places', function (cid, bounds, sort, limit, user, query, filter, near) {

    if(cid && !readPermission(getUser(this.userId), cid))
        return this.ready();

    limit = limit || DEFAULT_PLACE_LIMIT;
    if (limit > MAX_PLACE_LIMIT) limit = MAX_PLACE_LIMIT;

    if(filter) filter = JSON.parse(filter);
    else filter = {};

    if(cid) {
        filter.collectionId = cid;
    }

    if(bounds) {
        filter.bbox = {
            $geoIntersects: {
                $geometry: {
                    type: "Polygon",
                    coordinates: [bounds]
                }
            }
        }
    }

    if(near) {
        // if near is passed, override the building box
        // above and sort by distance to the center point
        filter.bbox = {
            $near: {
                $geometry: {
                    type: "Point" ,
                    coordinates: near.center
                },
                $maxDistance: near.maxDistance
            }
        }
    }

    if(user) {
        filter.creatorUID = user;
    }

    if(query) {
        filter['properties.name'] = { $regex: RegExp.escape(query), $options: 'i' };
    }

    if(!cid) {
        // we're accessing places across collections - need to carefully
        // limit which places are available
        filter = limitToMyCollections(this.userId, filter);
    }

    opts = {
        limit: limit,
    }

    if(sort) opts.sort = sort;

    return MPlaces.find(filter, opts);
});


// get a single place */
Meteor.publish('place', function (id, cid) {
    if(!readPermission(getUser(this.userId), cid))
        return this.ready();

    return MPlaces.find({_id: id, collectionId: cid});
});


// get the list of comments for a given place
Meteor.publish('comments', function (pid, cid) {
    if(!cid || !readPermission(getUser(this.userId), cid))
        return this.ready();

    var filter = {};

    if(pid) {
        filter.placeId = pid;
    }

    if(cid) {
        filter.collectionId = cid;
    }

    return MComments.find(filter,
        {limit: 100, sort: {createDate: -1}});
});


// get the data for a specific user
Meteor.publish("userData", function (_id) {
    if(_id) {
        Meteor.users.find({_id: _id}, {fields: {profile: 1}});
    }
    return Meteor.users.find({_id: this.userId});
});


// find the collections a user follows
Meteor.publish("followed", function () {
    return MFollowed.find({userId: this.userId});
});


/* this is a magical piece of code
   read about it here
 http://stackoverflow.com/questions/18093560/meteor-collection-transform-is-it-done-on-the-server-or-on-the-client-or-it-de
 */
Meteor.publish("permissionsForCid", function(cids) {

    if(!(cids instanceof Array)) {
        // if not an array make it an array
        cids = [cids];
    }

    // if you don't have read permission you don't even get
    // to look at the read permission - how's that for meta?
    if(!this.userId)
        return this.ready();

    var u = this.userId;

    //Transform function
    var transform = function(c) {
        return {
            owner: _.indexOf(c.owners, u) != -1,
            placeWriter:  _.indexOf(c.place_writers, u) != -1,
            postWriter:  _.indexOf(c.post_writers, u) != -1,
            reader:  _.indexOf(c.readers, u) != -1
        }
    };

    var self = this;

    var observer = MCollections.find({_id: {$in: cids}}).observe({
        added: function (document) {
            self.added('permissions', document._id, transform(document));
        },
        changed: function (newDocument, oldDocument) {
            self.changed('permissions', oldDocument._id, transform(newDocument));
        },
        removed: function (oldDocument) {
            self.removed('permissions', oldDocument._id);
        }
    });

    self.onStop(function () {
        observer.stop();
    });

    self.ready();

});


// get everything about a collection, and make sure to show user names
// rather than ids
Meteor.publishComposite("fullCollection", function (cid) {
    return {
        find: function () {
            // you actually need write permissions for this collection
            // to be able to see everyone's permissions
            if (!writePermission(undefined, cid, getUser(this.userId), "collection"))
                return this.ready();

            return MCollections.find({_id: cid});
        },

        // this a lot of hoops to jump through just to get real names as
        // opposed to just user ids, but you sure can't show user ids
        // in a reasonable UI - OUCH!!

        children: [{
            find: function (doc) {
                if(!doc.readers || !doc.readers.length) {
                    return this.ready();
                }
                return Meteor.users.find(
                    {_id: {$in: doc.readers}},
                    {fields: {profile: 1}});
            }
        }, {
            find: function (doc) {
                if(!doc.owners || !doc.owners.length) {
                    return this.ready();
                }
                return Meteor.users.find(
                    {_id: {$in: doc.owners}},
                    {fields: {profile: 1}});
            }
        }, {
            find: function (doc) {
                if(!doc.post_writers || !doc.post_writers.length) {
                    return this.ready();
                }
                return Meteor.users.find(
                    {_id: {$in: doc.post_writers}},
                    {fields: {profile: 1}});
            }
        }, {
            find: function (doc) {
                if(!doc.place_writers || !doc.place_writers.length) {
                    return this.ready();
                }
                return Meteor.users.find(
                    {_id: {$in: doc.place_writers}},
                    {fields: {profile: 1}});
            }
        }]
    }
});


// this is method to build a filter that reduces the places collection
// to only those you're allowed to see - this includes ones you own
// ones you have read permission for, and places that are read_public
limitToMyCollections = function (userId, q, dontIncludePublic, returnCids) {

    dontIncludePublic = true;

    var cids = MCollections.find(
        userIdExpression(getUser(userId)),
        {fields: {_id: 1}, reactive: false}).fetch()
        .map(function (c) {
            return c._id
        });

    // don't have to filter the collections you created
    // but do have to verify you still have access to followed collections below

    var f_cids = MFollowed.find(
        {userId: userId},
        {fields: {cid: 1}, reactive: false}).fetch()
        .map(function (c) { return c.cid})
        .filter(function (c) {
            return readPermission(this.userId, c);
        });

    cids = cids.concat(f_cids);

    if(returnCids)
        return cids;

    // now put it all together - we're looking for things (places for now) that are
    // 1) in our (created by us) collections
    // 2) in followed collections that we have confirmed access to
    // or 3) are public e.g. read_private is not set to true
    // this means we assume that when we change a collection to read_private, we must
    // change all the places in that collection to read_private as well

    // if dontIncludePublic is set, then, well, don't include
    // public things in the filter
    if(dontIncludePublic) {
        return {
            $and: [
                {collectionId: {$in: cids}},
                q
            ]
        };
    }

    return {
        $and: [
            { $or: [
                {read_private: {$ne: true}},
                {collectionId: {$in: cids}}
            ]},
            q
        ]
    };
};


sendEmail = function (to, from, subject, text) {
    Email.send({
        to: to,
        from: from,
        subject: subject,
        html: text
    });
};


Meteor.methods({


    sendEmail: function (to, from, subject, text) {
        // Let other method calls from the same client start running,
        // without waiting for the email sending to complete.
        this.unblock();
        sendEmail(to, from, subject, text);
    },


    // when you click on a permission link, you get sent to the website
    // to accept the permission, this is the method that actually
    // gives you the permission (e.g. adds you to the appropriate array
    // on the collection)
    acceptPermission: function(cid, type, key) {
        var c = MCollections.findOne({_id: cid});

        var name = type + '_key';
        if(!c[name] || c[name] != key) {
            throw new Meteor.Error('Invalid', "Permissions key not valid");
        }

        var addToSet = {};
        addToSet[type] = this.userId;

        MCollections.update({_id: cid}, {$addToSet: addToSet});
    },


    // this method is for import - create collection and places all
    // at once, with a couple of shortcut methods to make it efficient
    createCollectionWithPlaces: function (obj, places) {

        if (!this.userId) {
            throw new Meteor.Error(403, "Permission denied to add collection");
        }

        if(places && places.length > 5000 && !isAdmin(this.userId)) {
            throw new Meteor.Error(403, "Batch creation size currently limited to 5000");
        }

        addUserInfo(obj, this.userId);
        var cid = MCollections.insert(obj);
        if(places) {
            var that = this;
            for(var i = 0 ; i < places.length ; i++) {
                p = places[i];
                addUserInfo(p, that.userId);
                p.collectionId = cid;
            }
            MPlaces.batchInsert(places);
        }
        return cid;
    },


    exportCollectionAsJson: function (cid) {
        var c = MCollections.findOne(cid);
        if(!writePermission(c, cid, getUser(this.userId), "collection")) {
            // you have to be owner to be able to export
            throw new Meteor.Error(403, "Permission denied to export");
        }

        var name = c.name;
        var places = MPlaces.find({collectionId: cid}).fetch();
        var zip = new jsZip();
        zip.file(name+'.json', JSON.stringify({places: places}));
        return zip.generate({type: "base64"});
    },


    exportCollectionAsCsv: function (cid) {
        var c = MCollections.findOne(cid);
        if(!writePermission(c, cid, getUser(this.userId), "collection")) {
            // you have to be owner to be able to export
            throw new Meteor.Error(403, "Permission denied to export");
        }

        var name = c.name;
        var places = MPlaces.find({collectionId: cid}).fetch();
        for(var i = 0 ; i < places.length ; i++) {
            places[i] = flattenGeojsonObject(places[i]);
        }

        var createCsv = function (places, cb) {
            var csv = fastCsv;
            var zip = new jsZip();
            csv.writeToString(
                places,
                {headers: true},
                function(err, s){
                    zip.file(name+'.csv', s);
                    var out = zip.generate({type: "base64"});
                    if(err) {
                        cb('Csv error: ' + err);
                    } else {
                        cb(null, out);
                    }
                }
            );
        };

        var createCsvSync = Meteor.wrapAsync(createCsv);

        try {
            return createCsvSync(places);
        } catch (e) {
            throw new Meteor.Error(500, e);
        }
    },


    // insert several places at once for performance reasons
    // this is nice cause it adds the attributes that need to be added
    // but it's much faster to add places directly using Python
    insertPlaces: function (places, cid) {
        
        if (!writePermission(undefined, cid, getUser(this.userId), "place")) {
            throw new Meteor.Error(403, "Permission denied to insert places.");
        }

        places = _.filter(places, function (p) {
            // filter the ones that already exist
            return !MPlaces.findOne(p._id);
        });

        if(places && places.length) {
            var that = this;
            for(var i = 0 ; i < places.length ; i++) {
                p = places[i];
                addUserInfo(p, that.userId);
                p.collectionId = cid;
            }
            MPlaces.batchInsert(places);
            MCollections.update(cid, {$inc: {place_count: places.length}});
            return places.length;
        }
        return 0;
    },
});


MCollections._ensureIndex({ private: 1, createDate: 1 });
MPlaces._ensureIndex({ collectionId: 1, createDate: 1, bbox : "2dsphere" });
MComments._ensureIndex({ placeId: 1, createDate: 1 });
MFollowed._ensureIndex({ userId: 1, cid: 1 });


SyncedCron.add({
    name: 'Send daily email update of all items to admins.',
    schedule: function(parser) {
        return parser.recur().on('05:00:00').time();
    },
    job: function() {
        var data = recentPlacesData();

        if(!data.collections || data.collections.length == 0) {
            // no email if nothing to say
            return;
        }

        var html = Handlebars.templates['recent'](data);
        html = buildTemplate(html);

        Meteor.settings.MAILGUN.ADMINS.forEach(function (to) {
            sendEmail(
                to,
                Meteor.settings.MAILGUN.REPLYTO,
                "Yesterday's News from TogetherMap (for Admins)",
                html
            );
        });
    }
});


SyncedCron.add({
    name: 'Send daily email update of owned collections to owners.',
    schedule: function(parser) {
        return parser.recur().on('05:30:00').time();
    },
    job: function() {

        var users = Meteor.users.find().fetch().map(function (u) {
            return u._id;
        });

        var excludeList = [];

        users.forEach(function (userId) {

                var to = getUserEmail(userId);

                if(_.find(excludeList, function (e) {
                        return e == to;
                    }, to)) {
                    console.log("Excluding", to);
                    return;
                }

                var data = recentPlacesDataByUser(userId);

                if(!data.collections || data.collections.length == 0) {
                    // no email if nothing to say
                    return;
                }

                var html = Handlebars.templates['recent'](data);
                html = buildTemplate(html);

                sendEmail(
                    to,
                    Meteor.settings.MAILGUN.REPLYTO,
                    "Yesterday's News from TogetherMap",
                    html
                );
            });
    }
});


Meteor.startup(function() {

    jsZip = Meteor.npmRequire('jszip');
    fastCsv = Meteor.npmRequire('fast-csv');

    SyncedCron.start();

    var username = Meteor.settings.MAILGUN.USERNAME;
    var password = Meteor.settings.MAILGUN.PASSWD;
    var server = "smtp.mailgun.org";
    var port = "587";

    process.env.MAIL_URL = 'smtp://' + encodeURIComponent(username) + ':' + encodeURIComponent(password) + '@' + encodeURIComponent(server) + ':' + port;
});
