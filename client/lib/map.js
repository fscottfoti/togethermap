// The actual map manipulation happens here - e.g. Leaflet code goes here

// generally this module shouldn't know that it's in a meteor app,
// but in a few cases I cheat and use the Session object because it's
// so convenient to keep global state

Map = {

    create: function (id) {

        L.mapbox.accessToken = Meteor.settings.public.MAPBOX_KEY;
        L.mapbox.config.FORCE_HTTPS = true;

        this.baseMaps = {
            'grey': L.tileLayer.provider('CartoDB.Positron'),
            'dark': L.tileLayer.provider('CartoDB.DarkMatter'),
            'atlas': L.tileLayer.provider('OpenMapSurfer.Roads'),
            'outline': L.tileLayer.provider('Acetate.basemap'),
            'watercolor': L.tileLayer.provider('Stamen.Watercolor')
        };

        if(L.mapbox.accessToken) {
            this.baseMaps.aerial = L.mapbox.tileLayer('fscottfoti.kaeo1aml');
            this.baseMaps.streets = L.mapbox.tileLayer('fscottfoti.jfp0o21k');
        }

        this.defaultBaseMap = DEFAULT_BASEMAP;
        this.activeBaseMap = undefined;

        var mobile = window.innerWidth < 768;

        if(!mobile) {

            this.map = L.mapbox.map(id, null, {
                attributionControl: false,
                zoomControl: false,
                contextmenu: true,
                contextmenuWidth: 140,
                contextmenuItems: [{
                text: 'Add marker',
                callback: Map.contextMenuAdd
            }]});

        } else {

            this.map = L.mapbox.map(id, null, {
                attributionControl: false,
                zoomControl: false,    
            });

        }

        /* geocoder always gets added */
        if(L.mapbox.accessToken) {
            var geocoder = L.mapbox.geocoderControl('mapbox.places-v1');
            geocoder.on('select', function (feature) {
                Map.markPosition(feature);
            });
            geocoder.on('autoselect', function (feature) {
                Map.markPosition(feature);
            });
            this.geocoder = geocoder;
        }

        this.zoomControl = L.control.zoom();

        this.locateControl = L.control.locate();

        this.sidebar = L.control.sidebar('sidebar', {
            position: 'right',
            autoPan: false
        });

        this.map.addControl(this.sidebar);

        this.sidebar.on('hide', function () {
            var cid = Session.get('activeCollection');
            if(!cid)
                cid = 'empty';
            Router.go('map', {'_id': cid});
            Session.set('sidebarOpen', false);
            if(!mobileFormFactor) {
                Map.sideBarActive = true;
            }
        });

        this.sidebar.on('show', function () {
            // this is a bit odd - we need to know, when we close the sidebar,
            // that it has ever been opened (presumably to a valid state).
            // Otherwise calling history.back() would go to a different website
            Map.sidebarOpened = true;
            Session.set('sidebarOpen', true);
            if(Map.sideBarActive) {
                Map.sideBarActive = false;
            }
        });

        this.mobileLocateButton = L.control.locate();

        this.mobileAddMarkerButton = L.easyButton('fa-map-marker', function() {
            Map.tempMarker = L.marker(Map.center()).addTo(Map.map);
            Map.map.removeControl(Map.mobileAddMarkerButton);
            Map.map.addControl(Map.mobileSaveMarkerButton);
            Map.map.addControl(Map.mobileCancelMarkerButton);
        });

        this.mobileCancelMarkerButton = L.easyButton('fa-remove', function() {
            Map.map.removeLayer(Map.tempMarker);
            Map.tempMarker = undefined;
            Map.map.removeControl(Map.mobileSaveMarkerButton);
            Map.map.removeControl(Map.mobileCancelMarkerButton);
            Map.map.addControl(Map.mobileAddMarkerButton);
        });

        this.map.on('drag', function () {
            if(!Map.tempMarker)
                return;
            Map.tempMarker.setLatLng(Map.center());
        });

        this.map.on('zoomend', function () {
            if(!Map.tempMarker)
                return;
            Map.tempMarker.setLatLng(Map.center());
        });

        this.mobileSaveMarkerButton = L.easyButton('fa-save', function() {
            Map.map.removeLayer(Map.tempMarker);
            Map.tempMarker = undefined;
            Map.mapDriver.doubleClick(Map.center());
            Map.map.removeControl(Map.mobileSaveMarkerButton);
            Map.map.removeControl(Map.mobileCancelMarkerButton);
            Map.map.addControl(Map.mobileAddMarkerButton);
        });

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

        this.panToThrottled = _.throttle(Map.panTo, 500, {trailing: false});
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
                this.writeShapeLayerGroup = (new L.MarkerClusterGroup()).addTo(Map.map);
                this.readShapeLayerGroup = (new L.MarkerClusterGroup()).addTo(Map.map);
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


    placeIsVisible: function (place) {
        var l = this.keysToLayers[place._id];
        return l && this.layerIsVisible(l);
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

            if(shape.originalOffset == undefined) // only set it once
                shape.originalOffset = shape.options.zIndexOffset;

            shape.setZIndexOffset(20);

            this.bouncing[key] = true;
            shape.bounce(duration || 4);
            var that = this;
            setTimeout(function() {
                that.bouncing[key] = false;
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


    // get offset of the off center "center" since there's a toolbar
    // open on the right hand side of the screen - it's the center of
    // the visible part of the map
    offset: function () {
        var w = $(window).width();
        var sidebar_w = 440 - 20;
        var intended_x = (w - sidebar_w) / 2;
        var actual_x = w / 2;
        var off = w < 768 ? 0 : intended_x - actual_x;

        if(!Map.sidebar.isVisible())
            off = 0;

        return off;
    },


    latLngOffCenter: function () {
        var off = this.offset();

        var centerPoint = Map.map.getSize().divideBy(2);
        targetPoint = centerPoint.add([off, 0]);
        return Map.map.containerPointToLatLng(targetPoint);
    },


    panTo: function (latlng) {

        var off = this.offset();

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

        if((name == 'streets' || name == 'aerial') && 
            !L.mapbox.accessToken) {
            // these layers require mapbox key which might or
            // might not be set by the user - sub a free layer
            // if it's not available
            name = 'grey';
        }

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

        this.drawControlAdded = true;

        if(mobileFormFactor) {
            this.drawControlType = 'mobile';
            Map.map.addControl(Map.mobileAddMarkerButton);
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
        this.drawControlType = 'desktop';

        this.map.addControl(this.drawControl);
    },


    removeDrawControl: function () {

        if(this.drawControlAdded === false) {
            return;
        }

        this.drawControlAdded = false;

        if(this.drawControlType == 'mobile') {
            Map.map.removeControl(Map.mobileAddMarkerButton);
            return;
        }

        this.map.removeControl(this.drawControl);
    },


    goToMyLoc: function () {

        // this is a function that can be used with an easy button
        // to go to user's location on web and MOBILE both

        var loc = Geolocation.latLng();

        if(!loc) {
            _.delay(Map.goToMyLoc, 200);
            return;
        }

        Map.map.setView(loc, 17);
    },


    addMobileControls: function () {
        Map.hasMobileControls = true;
        Map.map.addControl(Map.mobileLocateButton);
    },


    removeMobileControls: function () {
        if(Map.hasMobileControls) {
            Map.map.removeControl(Map.mobileLocateButton);
        }
        Map.hasMobileControls = false;
    },


    addDesktopControls: function () {
        if(this.desktopControls === true) {
            return;
        }
        this.map.addControl(this.zoomControl);
        if(this.geocoder) this.map.addControl(this.geocoder);
        this.map.addControl(this.locateControl);

        this.desktopControls = true;
    },


    removeDesktopControls: function () {
        if(this.desktopControls != true) {
            return;
        }
        this.map.removeControl(this.zoomControl);
        if(this.geocoder) fthis.map.removeControl(this.geocoder);
        this.map.removeControl(this.locateControl);

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
            if(!Map.mapDriver.shapeThemeFunc)
                return;
            var val = Map.mapDriver.shapeThemeFunc(f, place);
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

        var i = icon;
        if(Map.highlitPlace) {
            if(Map.highlitPlace == place._id) {
                i = highlight_icon;
            } else {
                i = icon;
            }
        }

        var marker = L.marker(coords, {
            draggable: false,
            bounceOnAdd: bounce,
            icon: i,
            riseOnHover: true
        });

        L.setOptions(marker, {riseOnHover: true});

        marker.highlight_icon = highlight_icon;
        marker.normal_icon = icon;

        marker.on('mouseover', function () {
            Map.activeMarker = place._id;
            if(Session.get('disableHover')) return;
            Map.highlightPlace(place._id);
        });
        marker.on('mouseout', function () {
            Map.activeMarker = undefined;
            if(Session.get('disableHover')) return;
            Map.unHighlightPlace(place._id);
        });
        return marker;
    },


    highlightPlace: function (id) {

        Map.highlitPlace = id;

        var layer = this.keysToLayers[id];

        if(!layer)
            return;
        
        if(layer.normal_icon) {
            layer.setIcon(layer.highlight_icon);
        } else {
            // not marker
            layer.setStyle({fillOpacity: 1.0, opacity: 0.9});
        }
    },


    unHighlightPlace: function (id) {
        var layer = this.keysToLayers[id];
        if(!layer)
            return;
        if(layer.normal_icon) {
            layer.setIcon(layer.normal_icon);
            if(layer.originalOffset != undefined)
                layer.setZIndexOffset(layer.originalOffset);
        } else {
            layer.setStyle({fillOpacity: 0.6, opacity: 0.75});
        }
        Map.highlitPlace = undefined;
    },


    normalOtherPlaces: function (id) {
        _.each(this.keysToLayers, function (layer) {
            if(layer.key == id)
                return;
            if(layer.normal_icon) {
                layer.setIcon(layer.normal_icon);
                if(layer.originalOffset != undefined)
                    layer.setZIndexOffset(layer.originalOffset);
            } else {
                layer.setStyle({fillOpacity: 0.6, opacity: 0.75});
            }
        });
    },
    

    goToPlace: function (place, bounce, noZoom) {
        var center = Map.jsonGetCenter(place);

        if (this.lastPlace == place._id && !noZoom) {

            // for the second click, zoom in instead
            Map.zoomToFeature(place._id);

        } else {

            if(Map.activeMarker) {
                Map.keysToLayers[Map.activeMarker].hideLabel();
            }
            Map.panToThrottled(center);
        }
        this.lastPlace = place._id;

        if(bounce != false) {
            Map.bounceMarker(place._id);
        }
    },


    // used to switch themes for collections with multiple
    // themes
    resetStyle: function (color_f) { 
        color_f = new Function('p', color_f);
        _.each(this.keysToLayers, function (layer) {
            var p = MPlaces.findOne({_id: layer.key});
            var c = color_f(p.properties);
            if(c[0] != "#") c = "#"+c;
            layer.setStyle({fillColor: c});
        });
    },


    // add the shape to the map
    addShape: function(place, key, bounce_override) {

        // this one is baffling to me, but sometimes the collection marker
        // gets added as a place in the set of places.  totally confusticating.
        if(place === undefined || key == Session.get('activeCollection')) {
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

            // assign color if there's a color function

            if(Map.mapDriver.shapeThemeFunc) {
                var val = Map.mapDriver.shapeThemeFunc('color', place);
                if(val) {
                    place.properties.color = val;
                }
            }

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
                    fillOpacity: 0.6,
                    opacity: 0.75
                },
                onEachFeature: function (feature, layer) {
                    layer.on('mouseover', function () {
                        if(Session.get('disableHover')) return;
                        Map.highlightPlace(place._id);
                    });
                    layer.on('mouseout', function () {
                        if(Session.get('disableHover')) return;
                        Map.unHighlightPlace(place._id);
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

            var comment_count = place.comment_count || 0;

            var l = '';
            if(templates.placeTemplateLabel) {
                l = templates.placeTemplateLabel(place);
            } else {
                l = Handlebars.compile(defaultPlaceTemplateLabel)(place);
            }

            label = l +
                comment_count.toString() +
                (comment_count !== 1 ? ' comments': ' comment');
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

        if(place._id == Session.get('activePlace')) {
            Map.highlightPlace(place._id);
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
