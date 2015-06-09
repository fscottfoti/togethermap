var getFactualBbox = function () {
    var poly = Map.getBoundsAsPolygon();
    var top = poly[1][1];
    var left = poly[2][0];
    var bottom = poly[0][1];
    var right = poly[0][0];
    return [[top, left], [bottom, right]];
};


factualCid = "SXEYvnWcvuEqECkfu";


minFactualZoomLevel = 13;


var factualToGeojson = function (obj) {
    var lat = obj.latitude;
    var lng = obj.longitude;
    return {
        _id: obj.factual_id,
        creator: "Factual, Inc.",
        type: "Feature",
        collectionId: factualCid,
        bbox: {
            type: "Point",
            coordinates: [lng, lat]
        },
        geometry: {
            type: "Point",
            coordinates: [lng, lat]
        },
        properties: {
            name: obj.name,
            color: pseudoRandomColor(stringAsInt(obj.factual_id)),
            website: obj.website
        }
    };
};

FactualConnector = {

    init: function () {
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
        FactualConnector.places = [];
    },

    getAll: function () {
        var bbox = getFactualBbox();
        var txt = Session.get('query_string');
        if(!txt)
            return;

        Session.set('search_state', 'loading');
        Meteor.call('factualQuery', txt, bbox, undefined, undefined, function (err, res) {
            Session.set('latest_completed_query', txt);
            if(err) {
                console.log(err);
                Session.set('search_state', 'error');
                return;
            }

            if(res.included_rows < 1) {
                Session.set('search_state', 'results_available');
                Session.set('total_row_count', 0);
                Session.set('included_rows', 0);
                Session.set('map_visible_places', 0);
                return;
            }

            res.data.forEach(function (obj) {
                var gj = factualToGeojson(obj);

                if(_.findWhere(FactualConnector.places, {_id: obj.factual_id})) {
                    // already in the list, found in subsequent geo searches
                    return;
                }

                Map.addShape(gj, obj.factual_id);
                FactualConnector.places.push(gj);
            });

            Session.set('search_state', 'results_available');
            Session.set('total_row_count', res.total_row_count);
            Session.set('included_rows', res.included_rows);
            var cnt = Map.countVisiblePlaces();
            Session.set('map_visible_places', cnt);
        });
    },

    getOne: function (key) {
        var val = _.findWhere(FactualConnector.places, {_id: key});
        if(val) {
            return val;
        }

        // this is not the prettiest code - this uses jquery deferred / promises
        // to give something to waitOn for a Meteor call
        var $dep = new $.Deferred();
        Meteor.call('factualGet', key, function (err, res) {
            if (err) {
                $dep.reject(err);
                return;
            }

            var obj = res.data[0];
            var gj = factualToGeojson(obj);
            Map.addShape(gj, obj.factual_id);
            FactualConnector.places.push(gj);
            Map.goToPlace(gj);

            $dep.resolve(gj);
        });
        return $dep.promise();
    },

    locationChanged: function () {
        Session.set('zoom_level', Map.zoom());
        if(Map.zoom() >= minFactualZoomLevel) {
            this.getAll();
        }
    },

    activatePlace: function (key) {
        Router.go('place', {_id: key, _cid: factualCid});
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