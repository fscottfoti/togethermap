var getFactualBbox = function () {
    var poly = Map.getBoundsAsPolygon();
    var top = poly[1][1];
    var left = poly[2][0];
    var bottom = poly[0][1];
    var right = poly[0][0];
    return [[top, left], [bottom, right]];
};


var factualToGeojson = function (obj) {
    var lat = obj.latitude;
    var lng = obj.longitude;
    var ret = {
        "_id": obj.factual_id,
        "type": "Feature",
        "bbox": {
            "type": "Point",
            "coordinates": [lng, lat]
        },
        "geometry": {
            "type": "Point",
            "coordinates": [lng, lat]
        }
    };
    ret.properties = obj;
    ret.properties.color = pseudoRandomColor(stringAsInt(obj.factual_id));
    return ret;
};

FactualConnector = {

    init: function () {
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
    },

    getAll: function () {
        var bbox = getFactualBbox();
        var txt = Session.get('factual_query');
        if(!txt)
            return;
        Session.set('search_state', 'loading');
        Meteor.call('factualQuery', txt, bbox, undefined, undefined, function (err, res) {
            if(err) {
                console.log(err);
                return;
            }

            if(res.included_rows < 1)
                return;
            console.log(res);

            var places = [];

            res.data.forEach(function (obj) {
                var gj = factualToGeojson(obj);
                Map.addShape(gj, obj.factual_id);
                places.push(gj);
            });

            FactualConnector.places = places;
            Session.set('search_state', 'results_available');
            Session.set('total_row_count', res.total_row_count);
            Session.set('included_rows', res.included_rows);
        });
    },

    locationChanged: function () {
        this.getAll();
    },

    activatePlace: function (key) {
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