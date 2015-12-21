CollectionsConnector = {
    // this is the connector that turns actual collections
    // into places - in other words, it's the map of maps


    init: function (id, options) {
        Map.show_popups = true;
        Map.drop_markers = false;
        Map.enable_clustering = true;
        Map.dont_delete_places = true;
        //Map.map.setView([15, 40], 2);
        ['icon', 'color', 'icon_size'].forEach(function (f) {
            Map[f+'_f'] = false;
        });
        Map.switchBaseLayer(Map.defaultBaseMap);
        Map.mapDriver = this;
        Map.newShapes('cluster');
    },


    getAll: function (cid) {
        // find the current collections
        this.subscription(
            MCollections.find(this.filter || {})
        );
        _.delay(function () {
            // wait for collections to load, then adjust the map
            // location and zoom
            var b = Map.shapeLayerGroup.getBounds();
            if(b) Map.map.fitBounds(b);
        }, 500);
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
        // turn the collection object into geojson since
        // the map knows how to load geojson already

        if(!obj.location || !obj.location.center) {
            // this just means the collection doesn't have a location yet
            // which is ok and should be ignored
            return;
        }

        var latlng = obj.location.center;

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


    // get the placess
    subscription: function (sub) {
        var that = this;
        sub.observe({
            added: function(ss) {
                var gj = that.objToGeojson(ss);
                Map.addShape(gj, ss._id);
            },
            changed: function(ss) {
                var gj = that.objToGeojson(ss);
                Map.removePlace(ss._id);
                // false is for don't bounce on a replace
                Map.addShape(gj, ss._id, false);
            },
            removed: function(ss) {
                Map.removePlace(ss._id);
            }
        });
    },


    // on click, go the collection
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