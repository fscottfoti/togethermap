'use strict';

Template.collections.rendered = function () {
    $('[data-toggle="tooltip"]').tooltip()
};


Template.collections.helpers({
    collections: function () {
        return MCollections.find(
            { name: { $ne: 'NEW COLLECTION' } },
            { sort: { place_count: -1 }});
    },

    readPublic: function () {
        // this will always be true by the nature of our find query
        return this ? this.read_private != true : false;
    },

    postPublic: function () {
        return this ? (this.read_private != true && this.post_write_private != true) : false;
    },

    mapPublic: function () {
        return this ? (this.read_private != true && this.place_write_private != true) : false;
    }
});


Template.collections.events = {

    'click .collection-go': function (e) {

        e.preventDefault();
        Router.go('collection', {_id: this._id});
    },

    'click .profile-go': function (e) {

        e.preventDefault();
        Router.go('profile', {_id: this.creatorUID});
    }
};