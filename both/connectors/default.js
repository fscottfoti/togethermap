DefaultMapDriver = {

    init: function (id, options) {
        if(!options) {
            return;
        }

        Map.mapDriver = DefaultMapDriver;

        if(options.drop_markers !== undefined &&
            Session.get('dont_set_collection_location') != true) {
            Map.drop_markers = options.drop_markers;
        } else {
            Map.drop_markers = false;
        }

        if(options.enable_clustering !== undefined) {
            Map.enable_clustering = options.enable_clustering;
        } else {
            Map.enable_clustering = false;
        }

        ['icon', 'color', 'icon_size'].forEach(function (f) {
            if (options[f+'_f'] !== undefined) {
                DefaultMapDriver[f+'_f'] = options[f+'_f'];
            } else {
                DefaultMapDriver[f+'_f'] = false;
            }
        });

        if(options.show_popups !== undefined) {
            Map.show_popups = options.show_popups;
        } else {
            Map.show_popups = true;
        }

        if(options.dont_delete_places !== undefined) {
            Map.dont_delete_places = options.dont_delete_places;
        } else {
            Map.dont_delete_places = false;
        }

        if(options.location !== undefined) {
            // change the map view IFF we're loading
            // a user map for the first time
            if(Session.get('dont_set_collection_location') != true) {

                // so this little bit of code means we don't rezoom
                // the map when leaving routes such as profile and home
                // and in general can stop the rezoom when we need to
                Map.map.setView(options.location.center,
                    options.location.zoom);
            } else {
                Session.set('dont_set_collection_location', false);
            }
            this.manualLocation = true;
        } else {
            this.manualLocation = false;
        }

        if(options.default_map) {
            Map.switchBaseLayer(options.default_map);
        } else {
            Map.switchBaseLayer(Map.defaultBaseMap);
        }
    },

    getAll: function (cid) {
        var filter = Session.get('activeFilter');
        if(filter) {
            filter = JSON.parse(filter);
            filter.collectionId = cid;
        } else {
            filter = {collectionId: cid};
        }

        this.subscription(
            MPlaces.find(filter)
        );
    },

    locationChanged: function () {
        // I *think* the right thing to do here is to set it back
        // to the default limit
        Session.set('activeLimit', DEFAULT_PLACE_LIMIT);
        this.subscribe();
    },

    subscribe: function () {
        if(Session.get('autoLoading') == false)
            return;

        var cid = Session.get('activeCollection');
        var sort = Session.get('activeSort');
        var limit = Session.get('activeLimit');
        var filter = Session.get('activeFilter');

        if(limit === 0) {
            // mongo says that a limit of zero records
            // is eqivalent to setting no limit, but we
            // don't want that
            return;
        }
        var poly = Map.getBoundsAsPolygon();

        near = {
            center: [Map.center().lng, Map.center().lat],
            maxDistance: Map.getMapRadiusKM()*1000
        }

        console.log(filter, near, cid, sort, limit);

        Meteor.subscribe("places", cid, poly, 
            sort, limit, undefined, undefined, filter, near, {
            onReady: function() {
                var cnt = Map.countVisiblePlaces();
                Session.set('map_visible_places', cnt);
            }
        });
        this.getAll(cid);
    },

    maybeSetLocation: function () {
        // the purpose of this method is to set the map view after all the initial
        // places are loaded IFF there is not a location set on the map - and make
        // sure the map is zoomed to the right location
        if(!this.manualLocation) {
            var b = Map.shapeLayerGroup.getBounds();
            if(!b)
                return;
            // if no manual location, do auto location
            Map.map.fitBounds(b);
            this.manualLocation = true;
        }
    },

    subscription: function (sub) {
        sub.observe({
            added: function(ss) {
                //console.log('adding', ss);
                Map.addShape(ss, ss._id);
            },
            changed: function(ss) {
                //console.log('replacing', ss._id);
                Map.removePlace(ss._id);
                // false is for don't bounce on a replace
                Map.addShape(ss, ss._id, false);
            },
            removed: function(ss) {
                //console.log('removing', ss._id);
                Map.removePlace(ss._id);
            }
        });
    },
    
    activatePlace: function (key) {
        var layer = Map.keysToLayers[key];
        var cid = layer.cid || Session.get('activeCollection');
        Router.go('place', {_id: key, _cid: cid});
    },
    
    createPlace: function (place) {
        var cid = Session.get('activeCollection');
        Meteor.call('insertPlace', place, cid, function(error, result){
            var key = result;
            Router.go("place_edit", {_id: key, _cid: cid})
        });
    },

    doubleClick: function (latlng) {
        if (!Meteor.userId()) { // must be logged in
            growl.warning('Must be logged in to add a place.');
            return;
        }
        var cid = Session.get('activeCollection');
        if (!cid) { // must be logged in
            growl.warning('Must be viewing a collection to add a place.');
            return;
        }
        if (!writePermission(undefined, cid, Meteor.user(), "place")) {
            growl.warning('User does not have permission to add places to this collection.');
            return;
        }

        var point = {
            "type": "Feature",
            "bbox": {
                "type": "Point",
                "coordinates": [latlng.lng, latlng.lat]
            },
            "geometry": {
            "type": "Point",
                "coordinates": [latlng.lng, latlng.lat]
            },
            "properties": {
                color: randomColor(),
                name: 'New Place'
            }
        };

        this.createPlace(point);
    },
    
    editPlace: function (key, f) {
        // just update the geometry

        var geojson = f.toGeoJSON();
        var bbox = Map.shapeAsBbox(f);
        Meteor.call('updatePlace', key, {$set: {
            geometry: geojson.geometry,
            bbox: bbox}
        });
    },
    
    deletePlace: function (key) {
        var cid = Session.get('activeCollection');
        Meteor.call('removePlace', key, cid);
    },

    markerThemeFunc: function (fname, place) {
        var theme = Session.get('activeTheme');

        var c = MCollections.findOne(Session.get('activeCollection'));

        if(!theme && c.enable_multi_theme && 
            c.default_theme) {
            theme = c.default_theme;
        }

        var f;
        if(theme && c.themes && c.themes[theme] &&
            c.themes[theme][fname+'_f']) {
            f = c.themes[theme][fname+'_f']
        } else if(c[fname+'_f']) {
            f = c[fname+'_f']
        }

        if(f) return new Function('p', f)(place.properties);
    }
};