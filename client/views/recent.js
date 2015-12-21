Template.recent.rendered = function () {
    $('.tooltipped').tooltip();
}


Template.recent.helpers({
    
    noComments: function () {
        console.log(this.recent_comments.fetch());
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

    'click .comment-go': function (e) {

        e.preventDefault();
        var cid = Session.get('activeCollection');
        Router.go('place', {
            _id: this.placeId,
            _cid: cid
        });
    }
};