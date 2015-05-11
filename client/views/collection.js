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
        return writePermission(this);
    },

    followable: function () {
        return Meteor.user() && !writePermission(this) &&
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
        MFollowed.insert({
            userId: Meteor.userId(),
            cid: this._id,
            name: this.name
        });
    },

    'click .unfollow': function (e) {

        e.preventDefault();
        var obj = MFollowed.findOne({cid: this._id});
        MFollowed.remove(obj._id);
    }
};