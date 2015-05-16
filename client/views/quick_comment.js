Template.quick_comment.helpers({
    writePermission: function () {
        var cid = Session.get('active_collection');
        return writePermission(this, cid, Meteor.user());
    }
});


Template.quick_comment.events = {
    'click .remove-comment': function (e) {

        e.preventDefault();
        Meteor.call('removeComment', this._id, this.postId);
    }
}