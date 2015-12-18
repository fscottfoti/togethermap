Template.recent.rendered = function () {
    $('.tooltipped').tooltip();
}


Template.recent.helpers({
    noComments: function () {
        return this.recent_comments.fetch().length == 0;
    }
});


Template.recent.events = {

    'click .collection-go': function (e) {

        e.preventDefault();
        var cid = Session.get('activeCollection');
        Router.go('collection', {
            _id: cid
        });
    },

    'click .place-go': function (e) {

        e.preventDefault();
        var cid = Session.get('activeCollection');
        Router.go('place', {
            _id: this._id,
            _cid: cid
        });
    },

    'click .post-go': function (e) {

        e.preventDefault();
        var cid = Session.get('activeCollection');
        Router.go('place', {
            _id: this.placeId,
            _cid: cid
        });
        /*Router.go('post', {
            _id: this._id,
            _cid: cid
        });*/
    },

    'click .comment-go': function (e) {

        e.preventDefault();
        var cid = Session.get('activeCollection');
        Router.go('post', {
            _id: this.postId,
            _cid: cid
        });
    }
};