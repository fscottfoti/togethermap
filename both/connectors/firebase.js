TransitConnector = {
    buses: {},
    animated: {},
    maxNumberBuses: 500,


    newBus: function (bus, firebaseId) {

        var busLatLng = [bus.lat, bus.lon];
        var tag = bus.routeTag.toString()[0].toUpperCase() +
            bus.routeTag.toString().slice(1);

        var vtype = bus.vtype || 'bus';

        var color = bus.vtype === 'train' ? 'F73F2F' : '7094FF';

        var url = 'https://chart.googleapis.com/chart?chst=d_bubble_icon_text_small&chld=' + vtype + '|bbT|' + tag + '|' + color + '|eee';

        var icon = L.icon({
            iconUrl: url,
            iconAnchor: [20, 15]
        });

        var marker = L.marker(busLatLng, {
            draggable: false,
            bounceOnAdd: false,
            icon: icon
        });

        marker.id = firebaseId;

        this.buses[firebaseId] = marker;

        Map.addMarker(marker, firebaseId);
    },


    feq: function (f1, f2) {
        return (Math.abs(f1 - f2) < 0.000001);
    },


    animatedMoveTo: function (toLat, toLng, busMarker) {
        var fromLat, fromLng, frames, percent, curLat, curLng, move;
        fromLat = busMarker._latlng.lat;
        fromLng = busMarker._latlng.lng;
        if (this.feq(fromLat, toLat) && this.feq(fromLng, toLng)) {
            return;
        }
        frames = [];
        for (percent = 0; percent < 1; percent += 0.005) {
            curLat = fromLat + percent * (toLat - fromLat);
            curLng = fromLng + percent * (toLng - fromLng);
            frames.push([curLat, curLng]);
        }
        move = function (marker, latlngs, index, wait) {
            marker.setLatLng(latlngs[index]);
            if (index !== latlngs.length - 1) {
                setTimeout(function () {
                    move(marker, latlngs, index + 1, wait);
                }, wait);
            } else {
                delete TransitConnector.animated[marker.id];
            }
        };
        if(busMarker.id in TransitConnector.animated) {
            // already animated, don't animate again or
            // we'll interleave key frames!
            return;
        }
        TransitConnector.animated[busMarker.id] = true;
        move(busMarker, frames, 0, 25);
    },


    stop: function () {
        // TODO
    },


    start: function (system) {

        var name = system;

        ref = new Firebase('https://publicdata-transit.firebaseio.com/');

        this.f = ref.child(name + '/vehicles').limitToLast(this.maxNumberBuses);

        this.f.once('value', function (s) {
            s.forEach(function (b) {
                TransitConnector.newBus(b.val(), b.key());
            });
        });

        this.f.on('child_changed', function (s) {
            var busMarker = TransitConnector.buses[s.key()];
            if (typeof busMarker === 'undefined') {
                TransitConnector.newBus(s.val(), s.key());
            } else {
                TransitConnector.animatedMoveTo(s.val().lat, s.val().lon, busMarker);
            }
        });

        this.f.on('child_removed', function (s) {
            var busMarker = TransitConnector.buses[s.key()];
            if (typeof busMarker !== 'undefined') {
                Map.removeMarker(busMarker);
                delete TransitConnector.buses[s.key()];
            }
        });
    },


    getAll: function () {
        // not implemented yet, so has no place list
    },


    locationChanged: function () {
        // no index used - load all places
    },


    activatePlace: function () {
        growl.warn('Place clicking has not been implemented yet');
    },
    

    init: function (system_name) {
        Map.removeDrawControl();
        Map.show_popups = true;
        Map.drop_markers = false;
        Map.enable_clustering = false;
        Map.dont_delete_places = true;
        ['icon', 'color', 'icon_size'].forEach(function (f) {
            Map[f+'_f'] = false;
        });
        Map.switchBaseLayer(Map.defaultBaseMap);
        Map.mapDriver = this;
        Map.newShapes();
        this.start(system_name)
    }
};