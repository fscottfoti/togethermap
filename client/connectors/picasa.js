PicasaConnector = {

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

        reqwest({
            url: 'https://picasaweb.google.com/data/feed/api/user/109798343854175714077/albumid/6150051511536904465?alt=json-in-script',
            type: 'jsonp',
            success: function (data) {
                var photos = [];
                data = data.feed.entry;
                for (var i = 0; i < data.length; i++) {
                    var photo = data[i];
                    if (photo['georss$where']) {
                        var pos = photo['georss$where']['gml$Point']['gml$pos']['$t'].split(' ');
                        photos.push({
                            key: i,
                            lat: pos[0],
                            lng: pos[1],
                            url: photo['media$group']['media$content'][0].url,
                            caption: photo['media$group']['media$description']['$t'],
                            thumbnail: photo['media$group']['media$thumbnail'][0].url,
                            video: (photo['media$group']['media$content'][1] ? photo['media$group']['media$content'][1].url : null)
                        });
                    }
                }

                photoLayer.add(photos).addTo(Map.map);
                Map.map.fitBounds(photoLayer.getBounds());
            }
        });
    }
};
