'use strict';

Template.collections.rendered = function () {
    if(!Meteor.user()) {
        Session.set('collectionFilter', 'public');
    } else {
        Session.set('collectionFilter', 'mine');
    }
};


Template.collections.helpers({
    myCollections: function () {
        return (Session.get('collectionFilter') || 'mine') == 'mine';
    },

    followedCollections: function () {
        return (Session.get('collectionFilter') || 'mine') == 'followed';
    },

    publicCollections: function () {
        return (Session.get('collectionFilter') || 'mine') == 'public';
    },

    collections: function () {
        var mine = MCollections.find(userIdExpression(Meteor.user())).fetch();
        mine = _.map(mine, function (c) {return c._id;})

        var followed = MFollowed.find().fetch();
        followed = _.map(followed, function (c) { return c.cid;})

        var cf = Session.get('collectionFilter') || 'mine';
        if(!Meteor.user()) cf = 'public';

        var filter;
        if(cf == 'mine') {
            filter = {_id: { $in: mine }};
        } else if(cf == 'followed') {
            filter = {_id: { $in: followed }};
        } else {
            var all = mine.concat(followed);
            filter = {_id: { $nin: all }};
        }

        return MCollections.find(
            {  $and: [ 
                filter,
                {
                    name: { 
                    $ne: 'NEW COLLECTION' 
                    }
                }
            ]},
            { sort: { name: +1}}
        );
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

    'click .my-collections': function (e) {

        e.preventDefault();
        Session.set('collectionFilter', 'mine');
    },

    'click .followed-collections': function (e) {

        e.preventDefault();
        Session.set('collectionFilter', 'followed');
    },

    'click .public-collections': function (e) {

        e.preventDefault();
        Session.set('collectionFilter', 'public');
    },

    'click .collection-go': function (e) {

        e.preventDefault();
        Router.go('collection', {_id: this._id});
    },

    'click .profile-go': function (e) {

        e.preventDefault();
        Router.go('profile', {_id: this.creatorUID});
    }
};