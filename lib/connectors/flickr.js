var flickrToGeojson = function (obj) {
    var lat = obj.lat;
    var lng = obj.lng;
    return {
        _id: obj.key,
        creator: "Flickr, Inc.",
        type: "Feature",
        collectionId: Session.get('active_collection'),
        bbox: {
            type: "Point",
            coordinates: [lng, lat]
        },
        geometry: {
            type: "Point",
            coordinates: [lng, lat]
        },
        properties: {
            caption: obj.caption,
            name: obj.name,
            thumbnail: obj.thumbnail,
            url: obj.url,
            height: obj.height,
            width: obj.width,
            color: pseudoRandomColor(stringAsInt(obj.key))
        }
    };
};

FlickrConnector = {

    place_template: '<div style="padding-top:10px; padding-bottom: 10px;">' +
    '<h2>{{properties.name}}</h2>' +
    '<img src="{{properties.url}}" style="width: 100%;"></div>',

    place_template_list: '<div style="padding-top:10px; padding-bottom: 10px;">' +
    '<img src="{{properties.url}}" style="width: 100%;"></div>',

    place_template_label: '<div style="padding-top: 5px;">' +
    '<img src="{{properties.url}}" style="width: 100px;"></div>',

    parseConfig: function(url) {
        if(!url)
            return;
        var a = $('<a>', { href:url } )[0];
        var l = a.pathname.substring(1).split('/');
        this.config = {
            user: l[1],
            photoset: l[3]
        };
    },

    init: function (url) {

        FlickrConnector.places = [];

        var placeCallback = function (gj) {
            FlickrConnector.places.push(gj);
            Map.addShape(gj, gj._id);
        };

        var finishedCallback = function () {
            DefaultMapDriver.maybeSetLocation();
            Session.set('results_ready', true);
        };

        this.fetch(url, placeCallback, finishedCallback);
    },

    fetch: function (url, placeCallback, finishedCallback) {

        this.parseConfig(url);

        function jsonFlickrApi (data) {

            var places = [];

            data = data.photoset.photo;

            for (var i = 0; i < data.length; i++) {

                var photo = data[i];
                var height = photo.height_m;
                var width = photo.width_m;

                if(height > width) {
                    height = height * .6;
                    width = width * .6;
                } else {
                    height = height * .8;
                    width = width * .8;
                }

                if (photo.latitude) {

                    var obj = {
                        key: photo.id,
                        lat: photo.latitude,
                        lng: photo.longitude,
                        url: photo.url_m,
                        height: height,
                        width: width,
                        caption: photo.title,
                        thumbnail: photo.url_t
                    };

                    var gj = flickrToGeojson(obj);

                    if (placeCallback)
                        placeCallback(gj);

                    places.push(gj);
                }
            }
            if(finishedCallback)
                finishedCallback(places);
        }

        url = 'https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key=6b15ed9c00eddca7b6686293bdaad8e6&photoset_id='+this.config.photoset+'&user_id='+this.config.user+'&extras=geo,url_m,url_t,url_s&per_page=50&page=1&format=json&jsoncallback=?';

        $.getJSON(
            url,
            function (data) {
                jsonFlickrApi(data);
            });
    },

    getOne: function (key) {
        return _.findWhere(this.places, {_id: key});
    }
};
