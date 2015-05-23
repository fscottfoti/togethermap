FlickrConnector = {

    init: function () {
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
            photoLayer.add(photos).addTo(Map.map);Map.map.fitBounds(photoLayer.getBounds());
        }

        $.getJSON(
            'https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key=41f93e1d8d72f69b710d19ba3bfb35ea&photoset_id=72157652877789969&user_id=133431672%40N05&extras=geo,url_m,url_t%2Curl_s&per_page=50&page=1&format=json&jsoncallback=?',
            function (data) {
                jsonFlickrApi(data);
            });
    },

    getAll: function () {

    }
};
