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
                template = '<img src="{url}"/></a><p>{caption}</p>';

            if (photo.video &&
                (!!document.createElement('video').canPlayType(
                    'video/mp4; codecs=avc1.42E01E,mp4a.40.2'))) {
                template = '<video autoplay controls poster="{url}"><source src="{video}" type="video/mp4"/></video>';
            }

            evt.layer.bindPopup(L.Util.template(template, photo), {
                className: 'leaflet-popup-photo',
                minWidth: 536
            }).openPopup();
        });

        function jsonFlickrApi (data) {
            var photos = [];
            data = data.photoset.photo;
            for (var i = 0; i < data.length; i++) {
                var photo = data[i];
                if (photo.latitude) {
                    photos.push({
                        key: photo.id,
                        lat: photo.latitude,
                        lng: photo.longitude,
                        url: photo.url_m,
                        caption: photo.title,
                        thumbnail: photo.url_t
                    });
                }
            }
            this.photos = photos;
            photoLayer.add(photos).addTo(Map.map);Map.map.fitBounds(photoLayer.getBounds());
        }

        var url = 'https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key=41f93e1d8d72f69b710d19ba3bfb35ea&photoset_id='+this.config.photoset+'&user_id='+this.config.user+'&extras=geo,url_m,url_t%2Curl_s&per_page=50&page=1&format=json&jsoncallback=?';

        $.getJSON(
            url,
            function (data) {
                jsonFlickrApi(data);
            });
    },

    getAll: function () {
        return this.photos;
    }
};
