MapGL = {

    create: function (id) {

    	mapboxgl.accessToken = Meteor.settings.public.MAPBOX_KEY;

    	var cid = Session.get('activeCollection');
        var c = MCollections.findOne(cid);

		this.map = new mapboxgl.Map({
		    container: id,
		    //style: 'mapbox://styles/mapbox/satellite-v8',
		    style: "mapbox://styles/mapbox/light-v8",
		    center: c ? c.location.center : [-122.4167, 37.7833],
		    zoom: c ? c.location.zoom : 14
		});

		this.map.on('style.load', function () {
			
			MapGL.loaded = true;
			DefaultMapGLDriver.init();
		});
    }
}