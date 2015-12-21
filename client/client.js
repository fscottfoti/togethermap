Meteor.startup(function() {

    if(!Meteor.settings.public.MAPBOX_TOKEN) {
        // default public token - can't use too much
        Meteor.settings.public.MAPBOX_KEY = 
            "pk.eyJ1IjoidG9nZXRoZXJtYXAiLCJhIjoiY2lpZmhiOHl5MDF1enUza3NqeWQ3dXh3bCJ9.hwKjhI_gWAg10W9YYDGegQ";
    }


    AutoForm.setDefaultTemplate('materialize');

    L.Map.prototype.panToOffset = function (latlng, offset, options) {
        var x = this.latLngToContainerPoint(latlng).x - offset[0];
        var y = this.latLngToContainerPoint(latlng).y - offset[1];
        var point = this.containerPointToLatLng([x, y]);
        return this.setView(point, this._zoom, { pan: options })
    };

    Mousetrap.bind(['command+d', 'ctrl+d'], function() {
        toggleDoubleClickAdd();
        return false;
    });

    Mousetrap.bind(['command+p', 'ctrl+p'], function() {
        togglePanOnMouseOver();
        return false;
    });

    Mousetrap.bind(['command+n', 'ctrl+n'], function() {
        toggleNavbar();
        return false;
    });
});


getFollowedCids = function () {
    var followed = MFollowed.find().fetch();
    return _.map(followed, function (c) {
        return c.cid;
    });
};


Tracker.autorun(function () {
    Meteor.subscribe("userData");
    Meteor.subscribe("followed");

    var cids = getFollowedCids();
    Meteor.subscribe("permissionsForCid", cids);
    cids.forEach(function (cid) {
        Meteor.subscribe("collection", cid);
    });
});