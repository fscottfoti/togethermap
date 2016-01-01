MapGL = {

    create: function (id) {

    	mapboxgl.accessToken = Meteor.settings.public.MAPBOX_KEY;

		this.map = new mapboxgl.Map({
		    container: id,
		    style: 'mapbox://styles/mapbox/satellite-v8',
		    center: [-122.4167, 37.7833],
		    zoom: 14
		});

		this.map.on('style.load', function () {
			DefaultMapGLDriver.init();
		});
    }
}