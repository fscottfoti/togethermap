Template.permissionsLink.helpers({

    permissionType: function () {
        return this.params.type;
    },

    alreadyHasPermissions : function () {
        var type = {
            "readers": "reader",
            "place_writers": "placeWriter",
            "post_writers": "postWriter",
            "owners": "owner"
        }[this.params.type];
        return this.permissions && this.permissions[type];
    }
});


Template.permissionsLink.events = ({
    
    'click .collection-go': function() {
        Router.go('collection',
            {_id: this.params._id});
    },

    'click .accept-invite': function() {

        var type = this.params.type;
        var key = this.params.key;
        var cid = this.params._id;

        var that = this;

        Meteor.call('acceptPermission', cid, type, key, function (error) {
            if(error) {
                growl.error("Accept of permission failed.  Invalid key?");
            } else {
                growl.success("Collection permission accepted, forwarding to collection.");
                Meteor.call("addFollow", cid, that.collection.name);
                Router.go('collection',
                    {_id: cid});
            }
        });
    }
});