FlickrConnector = {

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

        this.parseConfig(url);

        var photoLayer = L.photo.cluster().on('click', function (evt) {
            var photo = evt.layer.photo,
                template = '<img width="{width}" height="{height}" src="{url}"/>';

            if (photo.video &&
                (!!document.createElement('video').canPlayType(
                    'video/mp4; codecs=avc1.42E01E,mp4a.40.2'))) {
                template = '<video autoplay controls poster="{url}"><source src="{video}" type="video/mp4"/></video>';
            }

            evt.layer.bindPopup(L.Util.template(template, photo), {
                className: 'leaflet-popup-photo',
                maxWidth: 530
            }).openPopup();
        });

        function jsonFlickrApi (data) {
            var photos = [];
            console.log(data);
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
                    photos.push({
                        key: photo.id,
                        lat: photo.latitude,
                        lng: photo.longitude,
                        url: photo.url_m,
                        height: height,
                        width: width,
                        caption: photo.title,
                        thumbnail: photo.url_t
                    });
                }
            }
            FlickrConnector.photos = photos;
            photoLayer.add(photos).addTo(Map.map);
            FlickrConnector.photoLayer = photoLayer;
            Map.map.fitBounds(photoLayer.getBounds());
        }

        url = 'https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key=6b15ed9c00eddca7b6686293bdaad8e6&photoset_id='+this.config.photoset+'&user_id='+this.config.user+'&extras=geo,url_m,url_t,url_s&per_page=50&page=1&format=json&jsoncallback=?';

        $.getJSON(
            url,
            function (data) {
                jsonFlickrApi(data);
            });
    },

    getAll: function () {
        return this.photos;
    },

    remove: function () {
        if(Map.map.hasLayer(this.photoLayer)) {
            Map.map.removeLayer(this.photoLayer);
        }
    }
};
