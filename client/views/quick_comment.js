Template.quick_comment.helpers({
    writePermission: function () {
        return writePermission(this);
    }
});


Template.quick_comment.events = {
    'click .remove-comment': function (e) {

        e.preventDefault();
        Meteor.call('removeComment', this._id, this.postId);
    }
}