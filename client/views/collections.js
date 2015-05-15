'use strict';

Template.collections.helpers({
    collections: function () {
        return MCollections.find(
            { name: { $ne: 'NEW COLLECTION' } },
            { sort: { place_count: -1 }});
    }
});


Template.collections.events = {

    'click .collection-go': function (e) {

        e.preventDefault();
        Router.go('collection', {_id: this._id});
    }
};