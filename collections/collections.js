addUserInfo = function (obj, uid) {
    var dt = new Date();
    var name = Meteor.user().profile.displayName ||
        Meteor.user().services.google.name;
    return _.extend(obj, {
        creatorUID: uid,
        creator: name,
        createDate: dt,
        updateDate: dt
    });
};


MCollections = new Meteor.Collection('collections');
MPlaces = new Meteor.Collection('places');
MFollowed = new Meteor.Collection('followed');
MPosts = new Meteor.Collection('posts');
MComments = new Meteor.Collection('comments');


MPlaces.initEasySearch(['properties.name', 'propeties.description'], {
    'limit' : 15,
    'use' : 'mongo-db'
});


Meteor.methods({
    createCollection: function (obj) {
        addUserInfo(obj, this.userId);
        return MCollections.insert(obj);
    },

    /*
    Place collection operations
     */

    // place geojson and collectionid
    insertPlace: function (obj, cid) {

        addUserInfo(obj, this.userId);
        obj.collectionId = cid;

        MPlaces.insert(obj, function (err) {
            if(!err) {
                // increment the count
                MCollections.update(cid, {$inc: {place_count: 1}});
            }
        });
    },
    updatePlace: function (id, obj) {

        MPlaces.update(id, obj, false, function (err, modified) {
            if(modified) {
                // update modified date
                MPlaces.update(id, {$set: {updateDate: new Date()}});
            }
        });
    },
    // id and collectionid
    removePlace: function (id, cid) {

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
    // id and collectionid
    removePost: function (id, pid) {

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

        MComments.remove(id, function (err, removed) {
            if(removed) {
                // decrement the count
                MPosts.update(pid, {$inc: {comment_count: -1}});
            }
        });
    }

});