// Map driver drives the map with a few connection - e.g. connects the data with
// the map.  Framework specific code goes here.

/* global L, Map, MapDriver */

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
        this.subscription(
            MPlaces.find({collectionId: cid})
        );
    },

    locationChanged: function () {
        var cid = Session.get('active_collection');
        var poly = Map.getBoundsAsPolygon();
        Meteor.subscribe("places", cid, poly, {
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
        var cid = layer.cid || Session.get('active_collection');
        Router.go('place', {_id: key, _cid: cid});
    },
    
    createPlace: function (place) {
        var cid = Session.get('active_collection');
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
        var cid = Session.get('active_collection');
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
        var cid = Session.get('active_collection');
        Meteor.call('removePlace', key, cid);
    },

    markerThemeFunc: function (f, place) {
        if(this[f+'_f']) {
            return new Function('p', this[f+'_f'])(place.properties);
        }
    }
};


// The actual map manipulation happens here - e.g. Leaflet code goes here

Map = {

    create: function (id) {

        L.mapbox.accessToken = MAPBOX_TOKEN;
        L.mapbox.config.FORCE_HTTPS = true;

        this.baseMaps = {
            'aerial': L.mapbox.tileLayer('fscottfoti.kaeo1aml'),
            'streets': L.mapbox.tileLayer('fscottfoti.jfp0o21k'),
            'grey': L.tileLayer.provider('CartoDB.Positron'),
            'dark': L.tileLayer.provider('CartoDB.DarkMatter'),
            'atlas': L.tileLayer.provider('OpenMapSurfer.Roads'),
            'outline': L.tileLayer.provider('Acetate.basemap'),
            'watercolor': L.tileLayer.provider('Stamen.Watercolor')
        };

        this.defaultBaseMap = DEFAULT_BASEMAP;
        this.activeBaseMap = undefined;

        this.map = L.mapbox.map(id, null, {
            attributionControl: false,
            zoomControl: false,
            contextmenu: true,
            contextmenuWidth: 140,
            contextmenuItems: [{
            text: 'Add marker',
            callback: Map.contextMenuAdd
        }]});

        /* geocoder always gets added */
        var geocoder = L.mapbox.geocoderControl('mapbox.places-v1');
        geocoder.on('select', function (feature) {
            Map.markPosition(feature);
        });
        geocoder.on('autoselect', function (feature) {
            Map.markPosition(feature);
        });
        this.geocoder = geocoder;

        this.zoomControl = L.control.zoom();

        this.locateControl = L.control.locate();
        this.locateControl.addTo(this.map);

        // layer control selection
        this.layerControl = L.control.layers(this.baseMaps);
        this.layerControl.addTo(this.map);

        // this is social media sharing
        /*this.shareControl = new MyShareControl();
        this.shareControl.link_f = function () {
            return {
                url: location.href,
                name: 'Check out TogetherMap',
                image: window.location.origin + '/img/map-pin.jpg'
            };
        };*/

        this.sidebar = L.control.sidebar('sidebar', {
            position: 'right',
            //closeButton: false,
            autoPan: false
        });
        this.map.addControl(this.sidebar);
        this.sidebar.on('hide', function () {
            var cid = Session.get('active_collection');
            if(!cid)
                cid = 'empty';
            Router.go('map', {'_id': cid});
            Map.sideBarActive = true;
            Map.sideBarButton.addTo(Map.map);
        });
        this.sidebar.on('show', function () {
            // this is a bit odd - we need to know, when we close the sidebar,
            // that it has ever been opened (presumably to a valid state).
            // Otherwise calling history.back() would go to a different website
            Map.sidebarOpened = true;
            if(Map.sideBarActive) {
                Map.sideBarActive = false;
                Map.sideBarButton.removeFrom(Map.map);
            }
        });

        this.sideBarButton = L.easyButton('fa-home', function(){
            Map.sidebar.toggle();
            if(Map.sidebar.isVisible()) {
                history.back();
            }
        });

        //L.mapbox.infoControl().addTo(this.map);

        if (!this.map.restoreView()) {
            this.map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        }

        this.initDrawing();

        this.map.on('moveend', function() {
            Map.mapDriver.locationChanged();
        });

        this.map.on('zoomend', function() {
            Map.mapDriver.locationChanged();
        });

        var that = this;
        this.map.on('baselayerchange', function(e) {
            that.activeBaseMap = e.name;
        });

        // maps ids to layers
        this.keysToLayers = {};
        // two shape layers, one for editing and the other for viewing
        this.shapeLayerGroup.new();
        this.enable_clustering = false;
        this.mapDriver = DefaultMapDriver;
    },

    contextMenuAdd: function (e) {
        Map.mapDriver.doubleClick(e.latlng);
    },

    enableDoubleClickAdd: function () {
        this.map.doubleClickZoom.disable();
        this.map.on("dblclick", function(e) {
            Map.mapDriver.doubleClick(e.latlng);
        });
    },

    enableDoubleClickZoom: function () {
        this.map.off("dblclick");
        this.map.doubleClickZoom.enable();
    },

    // do something for all of the draw events
    initDrawing: function () {
        // this is the method that actually adds the marker
        this.map.on('draw:created', function(e) {
            Map.mapDriver.createPlace(Map.newShape(e.layer));
        });

        this.map.on('draw:edited', function (e) {
            e.layers.eachLayer(function (layer) {
                Map.mapDriver.editPlace(layer.key, layer);
            });
        });

        this.map.on('draw:deleted', function (e) {
            e.layers.eachLayer(function (layer) {
                Map.mapDriver.deletePlace(layer.key);
            });
        });

        function offClick() {
            Map.shapeLayerGroup.eachLayer(function (layer) {
                layer.off('click');
                layer.unbindLabel();
            });
        }

        function onClick() {
            Map.shapeLayerGroup.eachLayer(function (layer) {
                layer.on('click', function () {
                    Map.mapDriver.activatePlace(layer.key);
                });

                if(layer.highlight_icon) {
                    layer.bindLabel(layer.labelStr, {direction: 'auto'});
                }
            });
        }

        this.map.on('draw:editstart', function () {
            if(Map.shapeLayerGroup.has_multipolygon) {
                growl.warning('Cannot edit multipolygons at this time');
            }
            offClick();
        });

        this.map.on('draw:editstop', function () { onClick(); });

        this.map.on('draw:deletestart', function () {
            if(Map.shapeLayerGroup.has_multipolygon) {
                growl.warning('Cannot delete multipolygons at this time');
            }
            offClick();
        });

        this.map.on('draw:deletestop', function () { onClick(); });
    },


    multiPolygon: function (layer) {
        return layer && layer.feature &&
            layer.feature.geometry.type === 'MultiPolygon';
    },


    // this is an object where takes the original shape layer group
    // and turns it into two layer groups, one that is writable and one
    // that is not.  this is so the editable control only edits the places
    // that are under the control of the specific user that is logged in
    // it's a lot of hoops to jump through to be sure, but an important
    // feature
    shapeLayerGroup: {
        getBounds: function () {
            var b1 = this.readShapeLayerGroup.getBounds();
            var b2 = this.writeShapeLayerGroup.getBounds();

            // if there aren't places added to one of the layers,
            // return the other one
            if(!b1._southWest && !b2._southWest) {
                return undefined;
            }
            if(!b1._southWest)
                return b2;
            if(!b2._southWest)
                return b1;

            // the bounds is always the larger of the bounds of the readable
            // and writeable shapes
            var s = Math.min(b2.getSouth(), b1.getSouth());
            var w = Math.min(b2.getWest(), b1.getWest());
            var n = Math.max(b2.getNorth(), b1.getNorth());
            var e = Math.max(b2.getEast(), b1.getEast());

            return [
                [s, w],
                [n, e]
            ];
        },
        new: function (param) {
            this.hide();

            if(param == 'cluster' || Map.enable_clustering) {
                this.writeShapeLayerGroup = (new L.MarkerClusterGroup({disableClusteringAtZoom: 15})).addTo(Map.map);
                this.readShapeLayerGroup = (new L.MarkerClusterGroup({disableClusteringAtZoom: 15})).addTo(Map.map);
            } else {
                this.writeShapeLayerGroup = L.featureGroup().addTo(Map.map);
                this.readShapeLayerGroup = L.featureGroup().addTo(Map.map);
            }
            this.has_multipolygon = false;
            if(Map.drawControlAdded) {
                Map.removeDrawControl();
                Map.addDrawControl();
            }
        },
        hide: function () {
            if(this.writeShapeLayerGroup) {
                Map.map.removeLayer(this.writeShapeLayerGroup);
            }
            if(this.readShapeLayerGroup) {
                Map.map.removeLayer(this.readShapeLayerGroup);
            }
        },
        show: function () {
            this.writeShapeLayerGroup.addTo(Map.map);
            this.readShapeLayerGroup.addTo(Map.map);
        },
        add: function (layer) {
            if(Map.multiPolygon(layer)) {
                this.has_multipolygon = true;
            }
            if(layer.writeable && !Map.multiPolygon(layer)) {
                layer.addTo(this.writeShapeLayerGroup);
            } else {
                layer.addTo(this.readShapeLayerGroup);
            }
        },
        remove: function (layer) {
            if(layer.writeable && !Map.multiPolygon(layer)) {
                this.writeShapeLayerGroup.removeLayer(layer);
            } else {
                // I suppose this technically shouldn't ever happen
                this.readShapeLayerGroup.removeLayer(layer);
            }
        },
        eachLayer: function (f) {
            this.writeShapeLayerGroup.eachLayer(f);
            this.readShapeLayerGroup.eachLayer(f);
        }
    },


    countVisiblePlaces: function () {
        var keys = Object.keys(this.keysToLayers);
        for(var i = 0, cnt = 0 ; i < keys.length ; i++) {
            var l = this.keysToLayers[keys[i]];
            if(this.layerIsVisible(l))
                cnt += 1;
        }
        return cnt;
    },


    layerIsVisible: function (l) {
        var bounds = this.getBounds();
        if(l._latlng) { // is point
            if (bounds.contains(l.getLatLng())) {
                return true;
            }
        } else {
            return bounds.intersects(l.getBounds());
        }
        return false;
    },

    /* mark a position, like for a geocoder, with a marker and a bounce */
    markPosition: function (feature) {
        var center = feature.feature.center;
        Map.panTo([center[1], center[0]]);
        Map.zoomTo(17);
        _.delay(function () {
            Map.panTo([center[1], center[0]]);
        }, 300);
        var icon = L.mapbox.marker.icon({
            'marker-color': '00F'
        });
        var marker = L.marker([center[1], center[0]], {icon: icon})
            .setBouncingOptions({
                bounceHeight: 20
            })
            .on('click', function() {
                Map.map.removeLayer(this);
            }).addTo(this.map);
        marker.bounce(4);
    },


    /* bounce any marker to show where it is */
    bouncing: {},
    bounceMarker: function (key, duration) {
        if(this.bouncing[key])
            return;
        var shape = Map.keysToLayers[key];

        if(shape.hasOwnProperty('_icon')) {

            var originalOffset = shape.options.zIndexOffset;
            shape.setZIndexOffset(10000);

            this.bouncing[key] = true;
            shape.bounce(duration || 4);
            var that = this;
            setTimeout(function() {
                that.bouncing[key] = false;
                shape.setZIndexOffset(originalOffset);
            }, duration * 1000 || 4000);
        }
    },

    jsonGetCenter: function (place) {
        return L.geoJson(place).getBounds().getCenter();
    },

    center: function () {
        return this.map.getCenter();
    },


    zoom: function () {
        return this.map.getZoom();
    },


    panTo: function (latlng) {
        var w = $(window).width();
        var sidebar_w = 440 - 20;
        var intended_x = (w - sidebar_w) / 2;
        var actual_x = w / 2;
        var off = w < 768 ? 0 : intended_x - actual_x;
        if(!Map.sidebar.isVisible())
            off = 0;
        Map.map.panToOffset(latlng, [off, 0]);
    },


    zoomTo: function (zoom) {
        this.map.setZoom(zoom);
    },


    zoomToBounds: function () {
        var b = Map.shapeLayerGroup.getBounds();
        if(!b)
            return;
        // if no manual location, do auto location
        Map.map.fitBounds(b);
    },


    zoomToFeature: function (key) {
        var layer = this.keysToLayers[key];

        if(layer._latlng) {
            // it's a marker
            var c = layer._latlng;

            // this works surprisingly well - we're trying to center the marker in
            // the space to the left of the sidebar, which is not the true center of
            // the map, so we put the marker back in the center, then zoom in, then pan
            // the map back so that the marker is centered in the space not taken
            // by the sidebar - a bit convoluted but suprisingly effective
            this.map.panTo(c);
            this.zoomTo(17);
            _.delay(function () {
                Map.panTo(c);
            }, 300);
        } else {
            console.log(layer.getBounds());
            this.map.fitBounds(layer.getBounds());
        }
    },


    getBounds: function () {
        return this.map.getBounds();
    },


    getBoundsAsPolygon: function () {
        var b = this.map.getBounds();
        var ne = b._northEast;
        var sw = b._southWest;


        if(sw.lng < -180 || sw.lng > 180)
            sw.lng = -180;
        if(ne.lng < -180 || ne.lng > 180)
            ne.lng = 180;
        if(sw.lat < -90 || sw.lat > 90)
            sw.lat = -90;
        if(ne.lat < -90 || ne.lat > 90)
            ne.lat = 90;

        var width = ne.lng - sw.lng;
        var height = ne.lat - sw.lat;

        // mongo doesn't do well with queryies that are larger then half a hemisphere
        // lame!!  http://docs.mongodb.org/manual/reference/operator/query/geoIntersects/
        // only real workaround is not use geoindex if you're basically searching
        // the whole world anyway, which seems ok

        if(width >= 120 || height >= 60) {
            return;
        }

        return [
            [ne.lng, sw.lat], [ne.lng, ne.lat], [sw.lng, ne.lat],
            [sw.lng, sw.lat], [ne.lng, sw.lat]
        ];
    },


    shapeAsBbox: function (l) {
        var gj = l.toGeoJSON();
        
        if(gj.geometry.type == "Point") {
            return gj.geometry;
        }
        var b = l.getBounds();
        var ne = b._northEast;
        var sw = b._southWest;

        return {
            type: "Polygon",
            coordinates: [[
            [sw.lng, sw.lat], [sw.lng, ne.lat], [ne.lng, ne.lat],
            [ne.lng, sw.lat], [sw.lng, sw.lat]
        ]]};
    },


    switchBaseLayer: function (name) {

        if(this.activeBaseMap == name)
            return;

        if(this.activeBaseMap)
            this.map.removeLayer(
                this.baseMaps[this.activeBaseMap]);

        this.map.addLayer(this.baseMaps[name]);
        this.activeBaseMap = name;
    },


    getMapRadiusKM: function() {
        var mapBoundNorthEast = this.map.getBounds().getNorthEast();
        var mapDistance = mapBoundNorthEast.distanceTo(this.map.getCenter());
        return mapDistance/1000;
    },


    mapCriteria: function () {
        var c = this.map.getCenter();
        return {
            center: [c.lat, c.lng],
            radius: this.getMapRadiusKM()
        };
    },


    drawControlAdded: false,
    addDrawControl: function () {
        if(this.drawControlAdded === true) {
            return;
        }

        // add the draw control too for adding markers and shapes
        this.drawControl = new L.Control.Draw({
            position: 'bottomleft',
            draw: {
                circle: false,
                rectangle: false
            },
            edit: {
                featureGroup: this.shapeLayerGroup.writeShapeLayerGroup
            }
        });

        this.map.addControl(this.drawControl);
        this.drawControlAdded = true;
    },


    removeDrawControl: function () {
        if(this.drawControlAdded === false) {
            return;
        }
        this.map.removeControl(this.drawControl);
        this.drawControlAdded = false;
    },


    addDesktopControls: function () {
        if(this.desktopControls === true) {
            return;
        }
        this.map.removeControl(this.locateControl);
        this.map.addControl(this.zoomControl);
        //this.map.addControl(this.shareControl);
        this.map.addControl(this.geocoder);
        this.map.addControl(this.locateControl);


        this.desktopControls = true;
    },


    removeDesktopControls: function () {
        if(this.desktopControls != true) {
            return;
        }
        this.map.removeControl(this.zoomControl);
        //this.map.removeControl(this.shareControl);
        this.map.removeControl(this.geocoder);
        this.desktopControls = false;
    },


    /* hide shape layer */
    hideShapes: function () {
        this.shapeLayerGroup.hide();
    },


    /* show shape layer */
    showShapes: function () {
        this.shapeLayerGroup.show();
    },


    /* show markers */
    newShapes: function (param) {
        this.keysToLayers = {};
        this.shapeLayerGroup.new(param);
    },


    hidePlace: function(key) {
        var layer = Map.keysToLayers[key];
        if(!layer) {
            return;
        }
        return this.shapeLayerGroup.remove(layer);
    },


    removePlace: function(key) {
        var layer = Map.keysToLayers[key];
        if(!layer) {
            return;
        }
        delete Map.keysToLayers[key];
        return this.shapeLayerGroup.remove(layer);
    },


    showPlace: function(key) {
        var layer = Map.keysToLayers[key];
        if(!layer) {
            return;
        }
        return this.shapeLayerGroup.add(layer);
    },


    // simple function to create a new shape
    // (adds the user info to it, but leaves a placeholder name)
    newShape: function (f) {
        var shape = f.toGeoJSON();
        var props = {
            color: randomColor(),
            name: 'New Place'
        };
        shape.properties = props;
        shape.bbox = Map.shapeAsBbox(f);
        return shape;
    },


    // make a marker (to add to the map)
    makeMarker: function(place, bounce_override) {
        // have to reverse coordinates
        var coords = place.geometry.coordinates;
        coords = [coords[1], coords[0]];

        ['icon', 'color', 'icon_size'].forEach(function (f) {
            if(!Map.mapDriver.markerThemeFunc)
                return;
            var val = Map.mapDriver.markerThemeFunc(f, place);
            if(val) {
                place.properties[f] = val;
            }
        });

        var icon;
        var highlight_icon;
        var highlight_color = tinycolor(place.properties.color || '00F');
        highlight_color = highlight_color.darken(20).toString();

        if(place.properties.custom_icon !== undefined) {

            icon = highlight_icon = place.properties.custom_icon;

        } else if(place.properties.icon !== undefined &&
                  place.properties.icon !== '') {

            icon = L.MakiMarkers.icon({
                icon: place.properties.icon,
                color: place.properties.color || '00F',
                size: place.properties.icon_size
            });

            highlight_icon = L.MakiMarkers.icon({
                icon: place.properties.icon,
                color: highlight_color,
                size: place.properties.icon_size
            });

        } else {

            icon = L.mapbox.marker.icon({
                'marker-color': place.properties.color || '00F'
            });
            highlight_icon = L.mapbox.marker.icon({
                'marker-color': highlight_color
            });

        }

        var bounce = bounce_override != undefined ? bounce_override:
            (this.drop_markers || false);

        var marker = L.marker(coords, {
            draggable: false,
            bounceOnAdd: bounce,
            icon: icon
        });

        L.setOptions(marker, {riseOnHover: true});

        marker.highlight_icon = highlight_icon;
        marker.normal_icon = icon;

        marker.on('mouseover', function () {
            marker.setIcon(highlight_icon);
        });
        marker.on('mouseout', function () {
            marker.setIcon(icon);
        });
        return marker;
    },

    highlightPlace: function (id) {
        var layer = this.keysToLayers[id];
        if(!layer)
            return;
        if(layer && layer.highlight_icon) {
            layer.setIcon(layer.highlight_icon);
            layer.original_offset = layer.options.zIndexOffset;
            layer.setZIndexOffset(10000);
        } else {
            // not marker
            layer.setStyle({fillOpacity: 0.65, opacity: 0.8});
        }
    },

    unHighlightPlace: function (id) {
        var layer = this.keysToLayers[id];
        if(!layer)
            return;
        if(layer.normal_icon) {
            layer.setIcon(layer.normal_icon);
            layer.setZIndexOffset(layer.original_offset);
        } else {
            layer.setStyle({fillOpacity: 0.2, opacity: 0.45});
        }
    },


    goToPlace: function (place, bounce, noZoom) {
        var center = Map.jsonGetCenter(place);

        if (this.lastPlace == place._id && !noZoom) {

            // for the second click, zoom in instead
            Map.zoomToFeature(place._id);

        } else {

            Map.panTo(center);
        }
        this.lastPlace = place._id;

        if(bounce != false) {
            Map.bounceMarker(place._id);
        }
    },


    // add the shape to the map
    addShape: function(place, key, bounce_override) {

        if(place === undefined) {
            return;
        }

        if(key in this.keysToLayers) {
            return;
        }

        // this is a bit of weirdness - sometimes things come as single
        // element geometry collections and don't get rendered correctly
        // as markers - solve this by taking the geometry out of the
        // collection and making is a regular typed geometry instead
        if(place.geometry.type === 'GeometryCollection' &&
            place.geometry.geometries.length === 1) {
            place.geometry = place.geometry.geometries[0];
        }

        var shape;
        if (place.geometry.type === 'Point') {
            shape = this.makeMarker(place, bounce_override);
        } else {

            if(place.properties.color && place.properties.color[0] !== '#') {
                // color picker doesn't always append the pound
                place.properties.color = '#' + place.properties.color;
            }

            var default_weight = place.geometry.type === 'LineString' ? 9 : 1;
            var default_color = place.geometry.type === 'LineString' ?
                place.properties.color : '#555';

            shape = L.geoJson(place, {
                style: {
                    color: default_color || '#00D',
                    fillColor: place.properties.color || '#00F',
                    weight: place.properties.weight || default_weight,
                    fillOpacity: 0.2,
                    opacity: 0.45
                },
                onEachFeature: function (feature, layer) {
                    layer.on('mouseover', function () {
                        layer.setStyle({fillOpacity: 0.65, opacity: 0.8});
                    });
                    layer.on('mouseout', function () {
                        layer.setStyle({fillOpacity: 0.2, opacity: 0.45});
                    });
                }
            });
        }
        shape.key = key;
        shape.cid = place.collectionId;

        var label;

        if(this.mapDriver.customLabel) {

            label = this.mapDriver.customLabel(place);

        } else {

            var post_count = place.post_count || 0;

            var l = '';
            if(templates.place_template_label) {
                l = templates.place_template_label(place);
            } else {
                l = Handlebars.compile(defaultPlaceTemplateList)(place);
            }

            label = l +
                post_count.toString() +
                (post_count !== 1 ? ' posts': ' post');
        }
        if(!mobileFormFactor) {
            shape.bindLabel(label, {direction: 'auto'});
            shape.labelStr = label;
        }

        shape.on('click', function () {
            Map.mapDriver.activatePlace(this.key);
        });

        shape.writeable = writePermission(place,
            place.collectionId, Meteor.user(), "place");

        if (place.geometry.type === 'Point') {

            this.shapeLayerGroup.add(shape);
            this.keysToLayers[key] = shape;

        } else {

            // whatever this is, is magic to me -
            // you can read about the magic yourself ;)
            // https://github.com/Leaflet/Leaflet.draw/issues/187
            var layer = shape.getLayers()[0];

            // gonna need this
            layer.key = shape.key;
            layer.writeable = shape.writeable;
            layer.cid = place.collectionId;

            this.shapeLayerGroup.add(layer);
            this.keysToLayers[key] = layer;
        }

        return shape;
    },


    addMarker: function(marker, key) {
        this.shapeLayerGroup.add(marker);
        marker.on('click', function () {
            Map.mapDriver.activatePlace(key);
        });
    },


    removeMarker: function(marker) {
        this.shapeLayerGroup.remove(marker);
    }
};