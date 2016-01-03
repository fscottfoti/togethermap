MapGL = {

    create: function (id) {

    	mapboxgl.accessToken = Meteor.settings.public.MAPBOX_KEY;

    	var cid = Session.get('activeCollection');
        var c = MCollections.findOne(cid);

		this.map = new mapboxgl.Map({
		    container: id,
		    //style: 'mapbox://styles/mapbox/satellite-v8',
		    style: "mapbox://styles/mapbox/bright-v8",
		    //style: "mapbox://styles/mapbox/streets-v8",
		    //sprite: "mapbox://sprites/mapbox/streets-v8",
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
                }
            });
        });

        MapGL.map.on('mousemove', function (e) {
            MapGL.map.featuresAt(e.point, {radius: 10}, function (err, features) {

                if (err) throw err;

                if(Session.get('placeClicked')) return;

                MapGL.map.getCanvas().style.cursor = features.length ? 'pointer' : '';

                // console.log(features);

                var n = Router.current().route.getName();
                if(n == "collections" || n == "gallery")
                    return;

                var cid = Session.get("activeCollection");

                if(features.length == 0) {

                    Router.go("collection", {_id: cid});

                } else {

                    Router.go("place", {
                        _cid: cid, 
                        _id: features[0].properties._id
                    });
                }
            });
        });
    }
}