Template.quick_post.helpers({

    postRoute: function () {
        return Router.current().lookupTemplate() == "Post";
    },

    commentCount: function () {
        var c = this.comment_count || 0;
        return c + ' Comment' + (c == 1 ? '' : 's');
    },

    commentMode: function () {
        return false;
    },

    writePermission: function () {
        var cid = Session.get('activeCollection');
        return writePermission(this, cid, Meteor.user());
    }
});


Template.quick_post.events = {
    'click .profile-go': function (e) {

        e.preventDefault();
        Router.go('profile', {_id: this.creatorUID});
    },

    'click .remove-post': function (e) {

        e.preventDefault();
        Meteor.call('removePost', this._id, this.placeId);
    }
};