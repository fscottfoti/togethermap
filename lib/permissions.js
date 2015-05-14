// get the google is from a user object
googleId = function (u) {
    if( !u ||
        !u.services ||
        !u.services.google)
        return null;
    return 'google:'+u.services.google.id;
};


// this or's the meteor userid with the google id since historically
// things were owned by the google id - this allows users to get their
// data back from the old version of the site.

userIdExpression = function (user) {
    var users = [user._id];
    var g = googleId(user);
    if(g)
        users.push(g);

    return {creatorUID: {$in: users}};
};


var admins = ['ceTir2NKMN87Gq7wj'];

isAdmin = function (userId) {
    return _.indexOf(admins, userId) != -1
};


isMine = function (o, userId) {
    return o.creatorUID == userId;
};


isReadPublic = function (o) {
    return o.read_private != true;
};


isWritePublic = function (o) {
    return o.write_private != true;
};


isInReaders = function (p, userId) {
    return p && _.indexOf(p.readers, userId) != -1;
};


isInWriters = function (p, userId, type) {

    if(!p) {
        return false;
    }
    var post_writer = _.indexOf(p.post_writers, userId) != -1
    var place_writer = _.indexOf(p.place_writers, userId) != -1

    if(type == "post") {
        return post_writer;
    } else if(type == "place") {
        return place_writer;
    } else {
        // this is actually user to check if ok for reading
        return post_writer || place_writer;
    }
};


isInOwners = function (p, userId) {
    return p && _.indexOf(p.owners, userId) != -1;
};


readPermission = function (user, cid) {

    // be safe, have to specify a collection
    if(!cid)
        return false;

    var c = MCollections.findOne(cid);

    if(!c) {
        // server already rejected this
        return false;
    }

    if(!user) {
        return isReadPublic(c);
    }

    var p = MPermissions.findOne(cid);
    var userId = user._id;

    if(!c)
        return false;

    return isAdmin(userId) ||
        isMine(c, userId) ||
        isMine(c, googleId(user)) ||
        isReadPublic(c) ||
        isInReaders(p, userId) ||
        isInWriters(p, userId) ||
        isInOwners(p, userId);
};


writePermission = function(obj, cid, user, type) {

    if(!user)
        return false;

    var c = MCollections.findOne(cid);
    var p = MPermissions.findOne(cid);
    var userId = user._id;

    if(!c)
        return false;

    return isAdmin(userId) ||
        isMine(c, userId) ||
        isMine(c, googleId(user)) ||
        isMine(obj, userId) ||
        isMine(obj, googleId(user)) ||
        isWritePublic(c) ||
        isInOwners(p, userId) ||
        isInWriters(p, userId, type);
};