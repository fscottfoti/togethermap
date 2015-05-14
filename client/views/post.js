var jqueryInit = function () {
    initFroala(function (html) {});
};

Template.post.rendered = function () {
    jqueryInit();
};

Template.post.helpers({

    writePermission: function () {
        var cid = Session.get('active_collection');
        return writePermission(this, cid, Meteor.user());
    },

    noComments: function () {
        return this.comments.count() == 0;
    },

    numComments: function () {
        var c = this.comments.count() || 0;
        return c + ' comment' + (c == 1 ? '' : 's');
    },

    newTopic: function () {
        return Session.get('newTopic');
    }
});


Template.post.events = {

    'click .place-go': function (e) {

        e.preventDefault();
        Router.go('place', {
            _id: this.placeId,
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
        Router.go('post_edit', {
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

    'click .add-comment': function (e) {

        e.preventDefault();

        var pid = Session.get('active_place');
        var cid = Session.get('active_collection');
        var postid = this.post._id;
        var html = $( "#editable" ).val();

        if(!html || html.trim().length == 0) {
            return;
        }

        Meteor.call('insertComment', {
            text: html
        }, pid, cid, postid);

        Session.set('newTopic', false);
    },

    'click .cancel': function (e) {

        e.preventDefault();
        Session.set('newTopic', false);

    }
};