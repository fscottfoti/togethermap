Template.permissionsLink.helpers({
    permissionType: function () {
        return this.params.type;
    }
});


Template.permissionsLink.events = ({
    'click .accept-invite': function() {

        var type = this.params.type;
        var key = this.params.key;
        var cid = this.params._id;

        Meteor.call('acceptPermission', cid, type, key, function (error) {
            if(error) {
                growl.error("Accept of permission failed.  Invalid key?");
            } else {
                growl.success("Collection permission accepted.");
            }
        });
    }
});