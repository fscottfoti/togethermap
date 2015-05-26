PLACE_LIMIT = 100;
RECENT_LIMIT = 10;

MCollections = new Meteor.Collection('collections');
MPlaces = new Meteor.Collection('places');
MFollowed = new Meteor.Collection('followed');
MPosts = new Meteor.Collection('posts');
MComments = new Meteor.Collection('comments');
MPermissions = new Mongo.Collection('permissions');


MPlaces.initEasySearch(['properties.name', 'propeties.description'], {
    'limit' : 15,
    'use' : 'mongo-db'
});


addUserInfo = function (obj, uid) {
    var dt = new Date();
    var u;
    if(Meteor.isServer) {
        u = getUser(uid);
    } else {
        // is client;
        u = Meteor.user();
    }
    var name = u.profile.displayName ||
        u.services.google.name;
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
        MPosts.remove({collectionId: id});
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
                // remove associated posts
                MPosts.remove({placeId: id});
            }
        });
    },

    // post json and placeId
    insertPost: function (obj, pid, cid) {
        if (!writePermission(undefined, cid, getUser(this.userId), "post")) {
            throw new Meteor.Error(403, "Permission denied to insert post.");
        }

        addUserInfo(obj, this.userId);
        obj.placeId = pid;
        obj.collectionId = cid;

        MPosts.insert(obj, function (err) {
            if(!err) {
                // increment the count
                MPlaces.update(pid, {$inc: {post_count: 1}});
            }
        });
    },


    // id and update object
    updatePost: function (id, obj) {
        var old_obj = MPosts.findOne(id);
        var cid = old_obj.collectionId;
        if (!old_obj || !writePermission(old_obj, cid, getUser(this.userId), "post")) {
            throw new Meteor.Error(403, "Permission denied to update post.");
        }

        MPosts.update(id, obj, false, function (err, modified) {
            if(modified) {
                // update modified date
                MPosts.update(id, {$set: {updateDate: new Date()}});
            }
        });
    },


    // id and collectionid
    removePost: function (id, pid) {
        var old_obj = MPosts.findOne(id);
        var cid = old_obj.collectionId;
        if (!old_obj || !writePermission(old_obj, cid, getUser(this.userId), "post")) {
            throw new Meteor.Error(403, "Permission denied to remove post.");
        }

        MPosts.remove(id, function (err, removed) {
            if(removed) {
                // decrement the count
                MPlaces.update(pid, {$inc: {post_count: -1}});
                // remove associated comments
                MComments.remove({postId: id});
            }
        });
    },

    // post json and placeId
    insertComment: function (obj, pid, cid, postid) {
        if (!writePermission(undefined, cid, getUser(this.userId), "post")) {
            throw new Meteor.Error(403, "Permission denied to insert comment.");
        }

        addUserInfo(obj, this.userId);
        obj.placeId = pid;
        obj.collectionId = cid;
        obj.postId = postid;

        MComments.insert(obj, function (err) {
            if(!err) {
                // increment the count
                MPosts.update(postid, {$inc: {comment_count: 1}});
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
                MPosts.update(pid, {$inc: {comment_count: -1}});
            }
        });
    }

});