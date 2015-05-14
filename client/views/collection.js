Template.collection.helpers({

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
        return writePermission(this, cid, Meteor.user());
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