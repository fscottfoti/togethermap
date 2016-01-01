DefaultMapGLDriver = {

    init: function (id, options) {

        var cid = Session.get('activeCollection');

        MapGL.map.addSource('togethermap', {
            type: 'vector',
            tiles: ["http://localhost:3000/mvt/"+cid+"/{z}/{x}/{y}"]
        });

        MapGL.map.addLayer({
            "id": "test",
            "type": "circle",
            "source": "togethermap",
            "source-layer": cid,
            "paint": {
                "circle-radius": 10,
                "circle-color": "#ffffff"
            }
        });
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