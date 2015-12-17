Template.layout.helpers({
    spinning: function () {
        return Session.get('spinning') || false;
    },
    noNav: function () {
        return Session.get('noNav');
    }
});


Template.permission_denied.helpers({
    followed: function () {
        var followed= MFollowed.find().fetch();
        return _.find(followed, function (f) {
            return f.cid == Session.get('activeCollection');
        });
    }
});


Template.permission_denied.events({

    'click .unfollow': function (e) {

        e.preventDefault();
        var cid = Session.get('activeCollection');
        var obj = MFollowed.findOne({cid: cid});
        Meteor.call('removeFollow', obj._id);
    }
});