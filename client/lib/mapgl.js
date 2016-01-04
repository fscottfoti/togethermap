Map = MapGL = {

	baseMaps: ["basic", "bright", "streets", "light", "dark", "emerald", "satellite", "satellite-hybrid", "empty"],

    create: function (id) {

    	mapboxgl.accessToken = Meteor.settings.public.MAPBOX_KEY;

    	var cid = Session.get('activeCollection');
        var c = MCollections.findOne(cid);

        var baseName = (c && _.contains(this.baseMaps, c.default_map)) ? c.default_map : "streets";

		this.map = new mapboxgl.Map({
		    container: id,
		    style: 'mapbox://styles/mapbox/'+baseName+'-v8',
		    center: c ? c.location.center : [-122.4167, 37.7833],
		    zoom: c ? c.location.zoom : 14
		});

		this.map.on('style.load', function () {
			
			MapGL.loaded = true;
			DefaultMapGLDriver.init();
		});

		//this.map.addControl(new mapboxgl.Geocoder());

		MapGL.map.on('click', function (e) {
            MapGL.map.featuresAt(e.point, {radius: 10}, function (err, features) {

            	if(!MapGL.loaded) return;

                if (err) throw err;

                 Session.set('placeClicked', false);

                if (features.length) {

                    var n = Router.current().route.getName();
                    if(n == "collections" || n == "gallery")
                        return;

                    var cid = Session.get("activeCollection");

                    Session.set('placeClicked', true);

                    Router.go("place", {
                        _cid: cid, 
                        _id: features[0].properties._id
                    });

                } else {

                	var cid = Session.get("activeCollection");

                	Router.go("collection", {_id: cid});
                }
            });
        });

        MapGL.map.on('mousemove', function (e) {
            MapGL.map.featuresAt(e.point, {radius: 10}, function (err, features) {

            	if(!MapGL.loaded) return;

                if (err) throw err;

                if(Session.get('placeClicked')) return;

                MapGL.map.getCanvas().style.cursor = features.length ? 'pointer' : '';

                var n = Router.current().route.getName();
                if(n == "collections" || n == "gallery")
                    return;

                var cid = Session.get("activeCollection");

                if(features.length == 0) {

                    Session.set("activeFeature", undefined);
                    //Map.unHighlightPlace();

                } else {

                	var _id = features[0].properties._id;

                    Session.set("activeFeature", features[0]);
                    //Map.highlightPlace(_id);
                }
            });
        });
    },

    highlightPlace: function (_id) {
    	if(MapGL.loaded)
	    	MapGL.map.setFilter('hover', ['in', '_id', _id]);
    },

    unHighlightPlace: function () {
    	if(MapGL.loaded)
	    	MapGL.map.setFilter('hover', ['in', '_id', "N/A"]);
    },

    placeIsVisible: function () {
    	return true;
    },

    goToPlace: function () {

    },

    removeDrawControl: function () {

    },

    sidebar: {
    	show: function () {

    	}
    },

    removeMobileControls: function () {

    },

    addDesktopControls: function () {

    },

    resetStyle: function(obj) {

    	try {
    		obj = JSON.parse(obj);
    	} catch (e) {
    		growl.error("Config object is invalid JSON.");
    		return;
    	}
    	var cid = Session.get('activeCollection');

    	DefaultMapGLDriver.reset(true);
    	DefaultMapGLDriver.dataDrivenStyle(cid, obj);
    	DefaultMapGLDriver.addHoverLayer(cid);
    },

    switchBaseLayer: function (baseName) {
    	if(_.contains(this.baseMaps, baseName)) {
    		this.map.setStyle('mapbox://styles/mapbox/'+baseName+'-v8');
    	}
    }
}
