Template.collection.rendered = function () {
    $('[data-toggle="tooltip"]').tooltip()
};


var isOwnerF = function (data) {
    return data.permission.owner || data.collection.creatorUID == Meteor.userId();
};

Template.collection.helpers({

    isOwner: function () {
        return isOwnerF(this);
    },

    isPlaceWriter: function () {
        return isOwnerF(this) || this.permission.placeWriter || this.collection.place_write_private != true;
    },

    isPostWriter: function () {
        return isOwnerF(this) || this.permission.postWriter || this.collection.post_write_private != true;
    },

    isReader: function () {
        return isOwnerF(this) || this.permission.reader || this.collection.read_private != true;
    },

    places: function () {
        var cid = Session.get('active_collection');
        return MPlaces.find({collectionId: cid});
    },

    visible_places_count: function () {
        return Session.get('map_visible_places') || 0;
    },

    exceeds_place_limit: function () {
        return (Session.get('map_visible_places') || 0) >= PLACE_LIMIT;
    },

    places_loaded_count: function () {
        var cid = Session.get('active_collection');
        return MPlaces.find({collectionId: cid}).count();
    },

    write_permission: function () {
        var cid = Session.get('active_collection');
        return writePermission(this, cid, Meteor.user(), "collection");
    },

    followable: function () {
        return Meteor.user() && !isMine(this, Meteor.user()) &&
            !MFollowed.findOne({cid: this._id});
    },

    followed: function () {
        return MFollowed.findOne({cid: this._id});
    }
});


Template.collection.events = {

    'click .edit-link': function (e) {

        e.preventDefault();
        Router.go('collection_edit', {_id: this._id});
    },

    'click .permissions-link': function (e) {

        e.preventDefault();
        Router.go('permissions', {_id: this._id});
    },

    'click .recent-go': function (e) {

        e.preventDefault();
        Router.go('recent', {_id: this._id});
    },

    'click .profile-go': function (e) {

        e.preventDefault();
        Router.go('profile', {_id: this.creatorUID});
    },

    'click .follow': function (e) {

        e.preventDefault();
        // don't want to follow it twice, so we do an upsert
        Meteor.call('addFollow', this._id, this.name);
    },

    'click .unfollow': function (e) {

        e.preventDefault();
        var obj = MFollowed.findOne({cid: this._id});
        Meteor.call('removeFollow', obj._id);
    }
};