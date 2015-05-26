ProfileConnector = {

    init: function (id, options) {
        Map.show_popups = true;
        Map.drop_markers = false;
        Map.enable_clustering = false;
        Map.dont_delete_places = true;
        ['icon', 'color', 'icon_size'].forEach(function (f) {
            Map[f+'_f'] = false;
        });
        Map.switchBaseLayer(Map.defaultBaseMap);
        Map.mapDriver = this;
        Map.newShapes();

        // subscribe to the places for this user

        var poly = Map.getBoundsAsPolygon();
        var userId = Session.get('active_user');
        Meteor.subscribe('places', undefined, poly, {createDate: -1},
            undefined, userId, {
                onReady: function() {
                    var cnt = Map.countVisiblePlaces();
                    Session.set('map_visible_places', cnt);
                }
            });
    },

    getAll: function (cid) {

        var userId = Session.get('active_user');
        DefaultMapDriver.subscription(
            MPlaces.find({creatorUID: userId})
        );

    },

    locationChanged: function () {

        var poly = Map.getBoundsAsPolygon();
        var userId = Session.get('active_user');
        Meteor.subscribe('places', undefined, poly, {createDate: -1},
            undefined, userId, {
            onReady: function() {
                var cnt = Map.countVisiblePlaces();
                Session.set('map_visible_places', cnt);
            }
        });

        this.getAll();
    },

    activatePlace: function (key) {
        var layer = Map.keysToLayers[key];
        var cid = layer.cid || Session.get('active_collection');
        Router.go('place', {_id: key, _cid: cid});
    },

    createPlace: function (place) {
    },

    contextMenuAdd: function (e) {
    },

    doubleClick: function (latlng) {
    },

    editPlace: function (key, f) {
    },

    deletePlace: function (key) {
    }
};