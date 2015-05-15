Template.permissions.rendered = function () {
    Session.set("permission_type", "owners");

    ZeroClipboard.config( { swfPath: "/ZeroClipboard.swf" } );
    var cid = this.data.collection._id;

    var makeLink = function (event, forceNew) {
        var clipboard = event.clipboardData;
        var type = Session.get("permission_type");
        var currentKey = Session.get("permission_key");

        var txt = getPermissionsLink(type, cid, currentKey, forceNew);
        clipboard.setData( "text/plain", txt);
        growl.success("Link copied to clipboard.");
    };

    new ZeroClipboard( document.getElementById("copy-link") )
        .on( "copy", function( event ) {
            makeLink(event, false);
        });

    new ZeroClipboard( document.getElementById("new-link") )
        .on( "copy", function( event ) {
            makeLink(event, true);
        });
};


Template.permissions.helpers({
    permission_type: function () {
        return Session.get("permission_type") || "Owners"
    },

    list_exists: function () {
        var p = Session.get("permission_type");
        return this[p] && this[p].length > 0;
    },

    public_ok: function () {
        return Session.get("permission_type") != 'owners';
    },

    is_public: function () {
        var p = Session.get("permission_type");
        Session.set("permission_key", this[p+"_key"]);
        return {
            "readers": isReadPublic(this),
            "place_writers": isWritePublic(this, "place"),
            "post_writers": isWritePublic(this, "post")
        }[p];
    }
});

Template.permissions.events = {

    'click .per_mode': function (e) {

        e.preventDefault();
        Session.set("permission_type", e.target.value);
    },

    'click .make-public': function () {

        var p = Session.get("permission_type");
        var attr = {
            "readers": {read_private: false},
            "place_writers": {place_write_private: false},
            "post_writers": {post_write_private: false}
        }[p];

        Meteor.call('updateCollection', this._id, {$set: attr});
    },

    'click .make-private': function () {

        var p = Session.get("permission_type");
        var attr = {
            "readers": {read_private: true},
            "place_writers": {place_write_private: true},
            "post_writers": {post_write_private: true}
        }[p];

        Meteor.call('updateCollection', this._id, {$set: attr});
    }
};