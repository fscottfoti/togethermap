DEFAULT_PLACE_LIMIT = 100;
MAX_PLACE_LIMIT = 10000;
RECENT_LIMIT = 10;

MCollections = new Meteor.Collection('collections');
MPlaces = new Meteor.Collection('places');
MFollowed = new Meteor.Collection('followed');
MComments = new Meteor.Collection('comments');
MPermissions = new Mongo.Collection('permissions');


addUserInfo = function (obj, uid) {
    var dt = new Date();
    var u;
    if(Meteor.isServer) {
        u = getUser(uid);
    } else {
        // is client;
        u = Meteor.user();
    }
    var name = uid;
    if(u.profile) {
        name = u.profile.displayName;
    }
    if(u.services && u.services.google) {
        name = u.services.google.name;
    }
        
    return _.extend(obj, {
        creatorUID: uid,
        creator: name,
        createDate: dt,
        updateDate: dt
    });
};


getUser = function (userId) {
    if(!userId)
        return undefined;
    return Meteor.users.findOne(userId);
};


Meteor.methods({

    createCollection: function (obj) {
        if (!this.userId) {
            throw new Meteor.Error(403, "Permission denied to add collection");
        }
        addUserInfo(obj, this.userId);
        return MCollections.insert(obj);
    },


    updateCollection: function (id, obj) {
        var c = MCollections.findOne(id);
        if(!writePermission(c, id, getUser(this.userId), "collection")) {
            throw new Meteor.Error(403, "Permission denied to update collection");
        }

        if(obj && obj['$set'] && obj['$set'].read_private != undefined) {

            var set_read_private = obj['$set'].read_private;

            // this is a very special case - when we set a collection to private (or public)
            // we need to set all of the places too so as to control permissions on the places

            MPlaces.update(
                {collectionId: id},
                {$set: {read_private: set_read_private}},
                {multi: true},
                function (err) {
                    if(err) {
                        console.log("Error updating places after changing collection permissions:", err);
                    }
                }
            );
        }

        MCollections.update(id, obj, false, function (err, modified) {
            if(modified) {
                // update modified date
                MCollections.update(id, {$set: {updateDate: new Date()}});
            }
        })
    },


    removeCollection: function (id) {
        var c = MCollections.findOne(id);
        if(!writePermission(c, id, getUser(this.userId), "collection")) {
            throw new Meteor.Error(403, "Permission denied to remove collection");
        }

        MPlaces.remove({collectionId: id});
        MComments.remove({collectionId: id});
        return MCollections.remove(id);
    },


    addFollow: function (cid, name) {
        if (!this.userId) {
            throw new Meteor.Error(403, "Permission denied to follow collection");
        }

        var f = MFollowed.findOne({userId: this.userId, cid: cid});

        if(f) {
            throw new Meteor.Error(403, "Already followed");
        }

        MFollowed.insert({
            userId: this.userId,
            cid: cid,
            name: name
        });
    },


    removeFollow: function (id) {
        var f = MFollowed.findOne(id);
        if(this.userId != f.userId) {
            throw new Meteor.Error(403, "Permission denied to remove follow");
        }

        return MFollowed.remove(id);
    },

    /*
    Place collection operations
     */


    // place geojson and collectionid
    insertPlace: function (obj, cid) {
        if (!writePermission(undefined, cid, getUser(this.userId), "place")) {
            throw new Meteor.Error(403, "Permission denied to insert place.");
        }

        addUserInfo(obj, this.userId);
        obj.collectionId = cid;
        obj.votes = 0;
        obj.comment_count = 0;

        var c = MCollections.findOne(cid);
        if(c.read_private)
            obj.read_private = c.read_private;

        return MPlaces.insert(obj, function (err) {
            if(!err) {
                // increment the count
                MCollections.update(cid, {$inc: {place_count: 1}});
            }
        });
    },


    updatePlace: function (id, obj) {
        var old_obj = MPlaces.findOne(id);
        var cid = old_obj.collectionId;
        if (!old_obj || !writePermission(old_obj, cid, getUser(this.userId), "place")) {
            throw new Meteor.Error(403, "Permission denied to update place.");
        }

        MPlaces.update(id, obj, false, function (err, modified) {
            if(modified) {
                // update modified date
                MPlaces.update(id, {$set: {updateDate: new Date()}});
            }
        });
    },


    // this method is used for autoform to update the properties only
    updatePlaceProperties: function (obj, id) {
        Object.keys(obj.$set).forEach(function(key) {
            obj.$set['properties.'+key] = obj.$set[key];
            delete obj.$set[key];
        });
        Meteor.call('updatePlace', id, obj);
    },


    // id and collectionid
    removePlace: function (id, cid) {
        var old_obj = MPlaces.findOne(id);
        var cid = old_obj.collectionId;
        if (!old_obj || !writePermission(old_obj, cid, getUser(this.userId), "place")) {
            throw new Meteor.Error(403, "Permission denied to remove place.");
        }

        MPlaces.remove(id, function (err, removed) {
            if(removed) {
                // decrement the count
                MCollections.update(cid, {$inc: {place_count: -1}});
                // remove associated comments
                MComments.remove({placeId: id});
            }
        });
    },


    // post json and placeId
    insertComment: function (obj, pid, cid) {
        if (!writePermission(undefined, cid, getUser(this.userId), "post")) {
            throw new Meteor.Error(403, "Permission denied to insert comment.");
        }

        addUserInfo(obj, this.userId);
        obj.placeId = pid;
        obj.collectionId = cid;

        MComments.insert(obj, function (err) {
            if(!err) {
                // increment the count
                MPlaces.update(pid, {$inc: {comment_count: 1}});
            }
        });
    },


    // id and collectionid
    removeComment: function (id, pid) {

        var old_obj = MComments.findOne(id);
        var cid = old_obj.collectionId;

        if (!old_obj || !writePermission(old_obj, cid, getUser(this.userId), "post")) {
            throw new Meteor.Error(403, "Permission denied to remove comment.");
        }

        MComments.remove(id, function (err, removed) {
            if(removed) {
                // decrement the count
                MPlaces.update(pid, {$inc: {comment_count: -1}});
            }
        });
    },


    // this is written to be able to vote on any object - originally you
    // could vote on collections as well as places - for now it's really
    // just used vote on places
    vote: function (type, id, val) {

        var collection = type2CollectionMap[type];

        if(!collection)
            throw new Meteor.Error(403, "Type is invalid: " + type);

        var obj = collection.findOne({_id: id});

        if(!obj)
            throw new Meteor.Error(403, "Object not found: " + id);

        var cid = type == "collection" ? id : obj.collectionId;

        if(!writePermission(undefined, cid, getUser(this.userId), "post"))
           throw new Meteor.Error(403, "Need post write permission in order to vote.");

        if(val != -1 && val != 0 && val != 1) {
            throw new Meteor.Error(403, "Vote must be -1, 0, or +1.");
        }

        var cancelVote = function (isUp, uid) {

            if(isUp) {
                return collection.update({
                    _id: id,
                    upvoters: {$in: [uid]}
                }, {
                    $pull: {upvoters: uid},
                    $inc: {votes: -1}
                });
            } else {
                return collection.update({
                    _id: id,
                    downvoters: {$in: [uid]}
                }, {
                    $pull: {downvoters: uid},
                    $inc: {votes: +1}
                });
            }

        };

        var makeVote = function (isUp, uid) {

            if(isUp) {
                return collection.update({
                    _id: id,
                    upvoters: {$ne: uid}
                }, {
                    $addToSet: {upvoters: uid},
                    $inc: {votes: +1}
                });
            } else {
                return collection.update({
                    _id: id,
                    downvoters: {$ne: uid}
                }, {
                    $addToSet: {downvoters: uid},
                    $inc: {votes: -1}
                });
            }
        };

        if(val == 1) {

            // cancel downvote and make upvote
            cancelVote(false, this.userId);
            var ret = makeVote(true, this.userId);
            if(!ret)
                throw new Meteor.Error(403, "Internal error: no update accomplished.");

        } else if (val == -1) {

            // cancel upvote and make downvote
            cancelVote(true, this.userId);
            makeVote(false, this.userId);

        } else {

            // cancel update and downvote both
            cancelVote(false, this.userId);
            cancelVote(true, this.userId);
        }
    }

});
