CollectionsConnector = {

    init: function (id, options) {
        Map.show_popups = true;
        Map.drop_markers = false;
        Map.enable_clustering = true;
        Map.dont_delete_places = true;
        Map.map.setView([15, 40], 2);
        ['icon', 'color', 'icon_size'].forEach(function (f) {
            Map[f+'_f'] = false;
        });
        Map.switchBaseLayer(Map.defaultBaseMap);
        Map.mapDriver = this;
        Map.newShapes();
    },

    getAll: function (cid) {
        this.subscription(
            MCollections.find()
        );
    },

    locationChanged: function () {
    },

    customLabel: function (place) {
        var place_count = place.properties.place_count || 0;

        return (place.properties.name || 'No Name Given') +
            '<br>' + place_count.toString() +
            (place_count !== 1 ? ' places': ' place');
    },

    objToGeojson: function (obj) {
        if(!obj.location || !obj.location.center) {
            // this just means the collection doesn't have a location yet
            // which is ok and should be ignored
            return;
        }
        var latlng = obj.location.center;
        console.log();
        return {
            "type": "Feature",
            "bbox": {
                "type": "Point",
                "coordinates": [latlng.lng, latlng.lat]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [latlng.lng, latlng.lat]
            },
            "properties": {
                color: pseudoRandomColor(stringAsInt(obj._id)),
                name: obj.name,
                place_count: obj.place_count
            }
        };
    },

    subscription: function (sub) {
        var that = this;
        sub.observe({
            added: function(ss) {
                //console.log('adding', ss);
                var gj = that.objToGeojson(ss);
                Map.addShape(gj, ss._id);
            },
            changed: function(ss) {
                //console.log('replacing', ss._id);
                var gj = that.objToGeojson(ss);
                Map.removePlace(ss._id);
                // false is for don't bounce on a replace
                Map.addShape(gj, ss._id, false);
            },
            removed: function(ss) {
                //console.log('removing', ss._id);
                Map.removePlace(ss._id);
            }
        });
    },

    activatePlace: function (key) {
        Router.go('collection', {_id: key});
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