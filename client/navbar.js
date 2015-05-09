Template.navItems.helpers({

    my_collections: function () {
        return MCollections.find(userIdExpression());
    },

    no_collections: function () {
        return MCollections.find(userIdExpression()).count() == 0;
    },

    followed: function () {
        return MFollowed.find();
    },

    none_followed: function () {
        return MFollowed.find().count() == 0;
    },

    active_collection: function () {
        var cid = Session.get('active_collection');
        if(!cid)
            return;
        var c = MCollections.findOne(cid);
        if(!c)
            return;
        return c.name;
    }
});

infoHidden = {};

Template.navItems.events = {

    'click .active-collection': function (e) {

        e.preventDefault();
        var cid = Session.get('active_collection');
        Router.go('collection', {_id: cid});
    },

    'click .newCollection': function(e) {
        
        var obj = {'name': 'NEW COLLECTION'};
        
        Meteor.call("createCollection", obj, function(err, key) {
            if (err)
                console.log(err);
        
            Router.go('collection', {_id: key});
        });
    }
};