Template.collection.rendered = function () {
    Session.set('viewPlaces', true); // might be better to show places by default
    $('.dropdown-button').dropdown();
    $('.tooltipped').tooltip();
};


var isOwnerF = function (data) {
    return data.permission.owner || data.collection.creatorUID == Meteor.userId();
};


Template.collection.helpers({

    isOwner: function () {
        var cid = Session.get('active_collection');
        return writePermission(this, cid, Meteor.user(), "collection");
    },

    isPlaceWriter: function () {
        var cid = Session.get('active_collection');
        return writePermission(undefined, cid, Meteor.user(), "place");
    },

    isPostWriter: function () {
        var cid = Session.get('active_collection');
        return writePermission(undefined, cid, Meteor.user(), "post");
    },

    isReader: function () {
        var cid = Session.get('active_collection');
        return readPermission(Meteor.user(), cid);
    },

    places: function () {
        if(Session.get('active_connector')) {
            if(!Session.get('results_ready'))
                return;
            var conn = connectors[Session.get('active_connector')];
            // if special connector to places for this collection
            return conn.places;
        }

        var cid = Session.get('active_collection');
        var sort = Session.get('active_sort') || {createDate: -1};
        return MPlaces.find({collectionId: cid}, {sort: sort});
    },

    viewPlaces: function () {
        return Session.get('viewPlaces');
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
    },

    sortTypes: function () {
        return ['Recent', 'Votes', 'Name', 'Image', 'User', 'Posts'];
    }
});

var closed = true;

Template.collection.events = {

    'click .back': function () {
        Router.go('collections');
    },

    'click .sortings': function () {
        // I really shouldn't have to do this - there's some sort of bad
        // interaction with bootstrap and the leaflet container
        if(closed) {
            $('.dropdown-toggle').dropdown('toggle');
        } else {
            $('.dropdown.open .dropdown-toggle').dropdown('toggle');
        }
        closed = !closed;
    },

    'click .sort-by': function (e) {

        e.preventDefault();
        var type = $(e.target).attr('id');

        if(Map.mapDriver.sortChanged) {

            var sort;

            if(type == "Recent")
                sort = {createDate: -1};
            if(type == "Votes")
                sort = {'votes': -1};
            if(type == "Name")
                sort = {'properties.name': +1};
            if(type == "Image")
                sort = {'properties.image_url': -1};
            if(type == "User")
                sort = {'creator': +1};
            if(type == "Posts")
                sort = {'post_count': -1};

            Session.set('active_sort', sort);
            Session.set('active_sort_type', type);
            Map.mapDriver.sortChanged();
        }
        $('.dropdown.open .dropdown-toggle').dropdown('toggle');
        closed = true;
    },

    'click .edit-link': function (e) {

        e.preventDefault();
        Router.go('collection_edit', {_id: this._id});
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

        $('.tooltipped').tooltip('remove');

        e.preventDefault();
        // don't want to follow it twice, so we do an upsert
        Meteor.call('addFollow', this._id, this.name);
        growl.success("Collection followed");

        Meteor.defer(function() {
            $('.tooltipped').tooltip();
        });
    },

    'click .view-place-list': function () {
        Session.set('viewPlaces', true);
    },

    'click .hide-place-list': function () {
        Session.set('viewPlaces', false);
    },

    'click .unfollow': function (e) {

        $('.tooltipped').tooltip('remove');

        e.preventDefault();
        var obj = MFollowed.findOne({cid: this._id});
        Meteor.call('removeFollow', obj._id);
        growl.success("Collection unfollowed");

        Meteor.defer(function() {
            $('.tooltipped').tooltip();
        });
    },

    'click .pan-collection': function () {
        if(this.location) {
            Map.map.setView(this.location.center,
                this.location.zoom);
        } else {
            Map.zoomToBounds();
        }
        if(mobileFormFactor) {
            Map.sidebar.toggle();
        }
    }
};
