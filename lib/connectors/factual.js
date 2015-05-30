var getFactualBbox = function () {
    var poly = Map.getBoundsAsPolygon();;
    var top = poly[1][1];
    var left = poly[2][0];
    var bottom = poly[0][1];
    var right = poly[0][0];
    return [[top, left], [bottom, right]];
};

FactualConnector = {

    init: function (id, options) {
        Map.show_popups = true;
        Map.drop_markers = true;
        Map.enable_clustering = false;
        Map.dont_delete_places = true;
        ['icon', 'color', 'icon_size'].forEach(function (f) {
            Map[f+'_f'] = false;
        });
        Map.switchBaseLayer(Map.defaultBaseMap);
        Map.mapDriver = this;
        Map.newShapes();

        var bbox = getFactualBbox();
        var txt = Session.get('factual_query');
        console.log(txt, bbox);
        Meteor.call('factualQuery', txt, bbox, undefined, 10, function (err, data) {
            if(err) {
                console.log(err);
                return;
            }
            console.log(data);
        });
    },

    getAll: function (cid) {

        DefaultMapDriver.subscription(
            MPlaces.find()
        );

    },

    locationChanged: function () {

        var poly = Map.getBoundsAsPolygon();
        Meteor.subscribe('places', undefined, poly, {createDate: -1},
            50, undefined);

        this.getAll();
    },

    activatePlace: function (key) {
        Session.set('dont_set_collection_location', true);
        var layer = Map.keysToLayers[key];
        var cid = layer.cid || Session.get('active_collection');
        Router.go('place', {_id: key, _cid: cid});
    },

    markerThemeFunc: function (f, place) {
        return markerThemeFuncForCollection(f, place);
    },

    customLabel: function (place) {
        return customLabelForCollection(place);
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