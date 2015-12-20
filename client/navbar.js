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
    }
});

infoHidden = {};

Template.navItems.events = {
    'click .newCollection': function(e) {
        
        var obj = {'name': 'NEW COLLECTION'};
        
        Meteor.call("createCollection", obj, function(err, key) {
            if (err)
                console.log(err);
        
            Router.go('collection', {_id: key});
        });
        
    }
};