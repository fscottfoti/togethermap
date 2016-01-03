DefaultMapGLDriver = {

    init: function (id, options) {

        var cid = Session.get('activeCollection');

        if(!cid) return;

        if(!MapGL.loaded) return;   

        if(cid == "collections" || cid == "gallery")
            return;

        console.log("Loading: ", cid);

        var c = MCollections.findOne(cid);

        if(c.location) {
            MapGL.map.flyTo({
                center: c.location.center,
                zoom: c.location.zoom
            });
        }

        this.reset();

        this.defaultSource(cid);

        this.defaultStyle(cid);
    },

    defaultSource: function (cid) {
        MapGL.map.addSource('togethermap', {
            type: 'vector',
            tiles: ["http://localhost:3000/mvt/"+cid+"/{z}/{x}/{y}"]
        });
    },

    defaultStyle: function (cid) {
                MapGL.map.addLayer({
            "id": "points",
            "type": "symbol",
            "source": "togethermap",
            "source-layer": cid,
            "interactive": true,
            "layout": {
                "icon-image": "{icon}-24",
                "text-field": "{name}",
                "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                "text-offset": [0, 0.6],
                "text-anchor": "top"
            },
            "paint": {
                "text-size": 12
            },
            "filter": ["==", "$type", "Point"]
        });

        MapGL.map.addLayer({
            "id": "polygons",
            "type": "fill",
            "source": "togethermap",
            "source-layer": cid,
            "interactive": true,
            "paint": {
                "fill-color": "#01579b",
                "fill-opacity": 0.8,
                "fill-outline-color": "#ffffff"
            },
            "filter": ["==", "$type", "Polygon"]
        });
    },

    reset: function () {
        if(MapGL.map.getSource("togethermap"))
            MapGL.map.removeSource("togethermap");

        if(MapGL.map.getLayer("points"))
            MapGL.map.removeLayer("points");

        if(MapGL.map.getLayer("polygons"))
            MapGL.map.removeLayer("polygons"); 
    },

    getAll: function (cid) {
        // get all the places
    },

    locationChanged: function () {
        // the location has changed - update the subscription?
    },

    activatePlace: function (key) {
        // the user clicked on a place
    },

    createPlace: function (place) {
        // make a new place - might not work for all geo types
    },

    contextMenuAdd: function (e) {
        // add a place via the right click menu
    },

    doubleClick: function (latlng) {
        // what to do on double click
    },

    editPlace: function (key, f) {
        // edit a place
    },

    deletePlace: function (key) {
        // delete a place
    }
};