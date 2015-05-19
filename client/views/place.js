var jqueryInit = function (id) {
    initFroala();
};

Template.place.rendered = function () {
    jqueryInit();
};

Template.place.helpers({

    writePermission: function () {
        var cid = Session.get('active_collection');
        return writePermission(this, cid, Meteor.user());
    },

    dateField: function () {
        return this.createDate || this.properties.createDate;
    },

    dynamicPlace: function () {
        // compiled when we change the collection for performance
        if(templates.place_template_list) {
            return templates.place_template(this);
        } else {
            return Handlebars.compile(defaultPlaceTemplate)(this);
        }
    },

    creator: function () {
        return this.creator || this.properties.creator;
    },

    votes: function () {
        return '0 Votes';
    },

    postCount: function () {
        var c = this.post_count || 0;
        return c + ' Post' + (c == 1 ? '' : 's');
    },

    newTopic: function () {
        return Session.get('newTopic');
    },

    noPosts: function () {
        // doesn't count if place isn't loaded
        return this.posts.count() == 0 && this.place;
    },

    postPermission: function () {
        var cid = Session.get("active_collection");
        return writePermission(undefined, cid, Meteor.user(), "post");
    },

    myCollections: function () {
        var mine = MCollections.find(userIdExpression(Meteor.user())).fetch();
        var followed = MFollowed.find().fetch();
        var docs = mine.concat(followed);
        return _.sortBy(docs, function(doc) {return doc.name;});
    }
});

var closed = true;

Template.place.events = {

    'click .copy-to': function () {
        // I really shouldn't have to do this - there's some sort of bad
        // interaction with bootstrap and the leaflet container
        if(closed) {
            $('.dropdown-toggle').dropdown('toggle');
        } else {
            $('.dropdown.open .dropdown-toggle').dropdown('toggle');
        }
        closed = !closed;
    },

    'click .pan-map': function () {

        Map.goToPlace(this);
    },

    'click .profile-go': function (e) {

        e.preventDefault();
        Router.go('profile', {_id: this.creatorUID});
    },

    'click .read-more': function (e) {

        e.preventDefault();
        Router.go('post', {
            _id: this._id,
            _cid: this.collectionId
        });
    },

    'click .collection-go': function (e) {

        e.preventDefault();
        Router.go('collection', {
            _id: this.collectionId
        });
    },

    'click .edit-link': function (e) {

        e.preventDefault();
        Router.go('place_edit', {
            _cid: Session.get('active_collection'),
            _id: this._id
        });
    },

    'click .new-topic': function (e) {

        e.preventDefault();
        Session.set('newTopic', true);
        Meteor.defer(function() {
            jqueryInit();
        });

    },

    'click .add-topic': function (e) {

        e.preventDefault();

        var pid = Session.get('active_place');
        var cid = Session.get('active_collection');
        var title = $( "#title" ).val();
        var html = $( "#editable" ).val();

        if(!title || title.trim().length == 0) {
            return;
        }

        Meteor.call('insertPost', {
            title: title,
            description: html
        }, pid, cid);

        Session.set('newTopic', false);
    },

    'click .cancel': function (e) {

        e.preventDefault();
        Session.set('newTopic', false);

    }
};