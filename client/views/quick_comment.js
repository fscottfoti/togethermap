Template.quick_comment.helpers({
    
    writePermission: function () {
        var cid = Session.get('activeCollection');
        return writePermission(this, cid, Meteor.user());
    }
});


Template.quick_comment.events = {

    'click .remove-comment': function (e) {

        e.preventDefault();
        Meteor.call('removeComment', this._id, this.placeId);
    },

    'click .profile-go': function (e) {

        e.preventDefault();
        Router.go('profile', {_id: this.creatorUID});
    }
};