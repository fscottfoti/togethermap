DefaultMapGLDriver = {

    init: function (id, options) {

        var cid = Session.get('activeCollection');

        if(!cid) return;

        if(!MapGL.loaded) return;   

        if(cid == "collections" || cid == "gallery")
            return;

        console.log("Loading: ", cid);

        var c = MCollections.findOne(cid);

        if(c.location) {
            MapGL.map.flyTo({
                center: c.location.center,
                zoom: c.location.zoom
            });
        }

        var dt = c.default_theme;
        if(!dt && _.keys(c.themes).length >= 1) {
            dt = _.keys(c.themes)[0];
        }
 
        if(c.enable_gl && dt) {
            var f = c.themes[dt].config_obj;
            Map.resetStyle(f);
            return;
        }

        function setStyle() {

            DefaultMapGLDriver.reset();

            DefaultMapGLDriver.defaultSource(cid, c.minzoom);

            DefaultMapGLDriver.defaultStyle(cid);

            DefaultMapGLDriver.addHoverLayer(cid);

            if(Session.get("activePlace")) {
                MapGL.highlightPlace(Session.get("activePlace"));
            }
        }

        if(c.default_map) {
            MapGL.switchBaseLayer(c.default_map, setStyle);
        } else {
            setStyle();
        }
    },

    defaultSource: function (cid, minzoom) {

        MapGL.map.addSource('togethermap', {
            minzoom: minzoom,
            type: 'vector',
            tiles: ["http://urbanforecast:1984/mvt/"+cid+"/{z}/{x}/{y}"]
        });
    },

    manualStyles: function (cid, config) {

        var styles = config.manual_styles;
        var circle = config["type"] == "circle";

        for(i = 0 ; i < styles.length ; i++) {

            style = styles[i];

            var paint_properties;

            if(circle) {

                paint_properties = {
                    "circle-color": style["circle-color"] || "#01579b",
                    "circle-opacity": 0.8,
                    "circle-radius": style["circle-radius"] || 5
                };

            } else {

                paint_properties = {
                    "fill-color": style["fill-color"] || "#01579b",
                    "fill-opacity": 0.8,
                    "fill-outline-color": config["fill-outline-color"] || "#ffffff"
                };
            }

            var l = {
                "id": "manual" + i,
                "type": circle ? "circle" : "fill",
                "source": "togethermap",
                "source-layer": cid,
                "interactive": true,
                "paint": paint_properties,
                "filter": style.filter
            };

            if(config["fill-outline-color"] == "none") delete l["paint"]["fill-outline-color"];

            MapGL.map.addLayer(l);

            MapGL.layers.push("manual" + i);
        }

    },

    dataDrivenStyle: function (cid, config) {

        var attr = config.attr;
        var breaks = config.breaks;
        var scheme = config.scheme;

        for (var p = -1; p < breaks.length; p++) {

            var filters;
            if(p == -1) {

                if(config.low_cutoff !== undefined) {

                    filters = [ 'all',
                        ['>', attr, config.low_cutoff],
                        ['<', attr, breaks[0]]
                    ];

                } else {

                    filters = ['<', attr, breaks[0]];
                }

            } else if (p == breaks.length - 1) {

                if(config.high_cutoff !== undefined) {

                    filters = [ 'all',
                        ['<', attr, config.high_cutoff],
                        ['>=', attr, breaks[p]]
                    ];

                } else {

                    filters = ['>=', attr, breaks[p]]
                }

            } else {

                filters = [ 'all',
                    ['>=', attr, breaks[p]],
                    ['<', attr, breaks[p+1]]
                ]
            }

            var color = colorbrewer[scheme][breaks.length+1][p+1];

            var l = {
                "id": "polygons" + p,
                "type": "fill",
                "source": "togethermap",
                "source-layer": cid,
                "interactive": true,
                "paint": {
                    "fill-color": color,
                    "fill-opacity": 0.8,
                    "fill-outline-color": (config["fill-outline-color"] == "none") ? undefined : (config["fill-outline-color"] || "#ffffff")
                },
                "filter": filters
            };

            if(config["fill-outline-color"] == "none") delete l["paint"]["fill-outline-color"];

            MapGL.map.addLayer(l);

            MapGL.layers.push("polygons" + p);
        }
    },

    defaultStyle: function (cid) {
        MapGL.map.addLayer({
            "id": "points",
            "type": "symbol",
            "source": "togethermap",
            "source-layer": cid,
            "interactive": true,
            "layout": {
                "icon-image": "{icon}-24",
                "text-field": "{name}",
                "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                "text-offset": [0, 0.6],
                "text-anchor": "top"
            },
            "paint": {
                "text-size": 12
            },
            "filter": ["==", "$type", "Point"]
        });

        MapGL.map.addLayer({
            "id": "polygons",
            "type": "fill",
            "source": "togethermap",
            "source-layer": cid,
            "interactive": true,
            "paint": {
                "fill-color": "#01579b",
                "fill-opacity": 0.8,
                "fill-outline-color": "#ffffff"
            },
            "filter": ["==", "$type", "Polygon"]
        });
    },

    addHoverLayer: function (cid, hover_color, outline_color) {
        MapGL.map.addLayer({
            "id": "hover",
            "type": "fill",
            "source": "togethermap",
            "source-layer": cid,
            "paint": {
                "fill-color": hover_color || "#e65100",
                "fill-opacity": 0.8,
                "fill-outline-color": outline_color || "#ffffff"
            },
            "filter": ["==", "_id", "N/A"]
        });
    },

    reset: function (skipSource) {

        if(!skipSource) {
            if(MapGL.map.getSource("togethermap")) {
                MapGL.map.removeSource("togethermap");
            }
        }

        if(MapGL.map.getLayer("points"))
            MapGL.map.removeLayer("points");

        if(MapGL.map.getLayer("polygons"))
            MapGL.map.removeLayer("polygons");

        if(MapGL.map.getLayer("hover"))
            MapGL.map.removeLayer("hover");

        _.each(MapGL.layers, function (layer) {

            if(MapGL.map.getLayer(layer)) {
                MapGL.map.removeLayer(layer);            
            }
        });

        MapGL.layers = [];
    },

    getAll: function (cid) {
        // get all the places
    },

    locationChanged: function () {
        // the location has changed - update the subscription?
    },

    activatePlace: function (key) {
        // the user clicked on a place
    },

    createPlace: function (place) {
        // make a new place - might not work for all geo types
    },

    contextMenuAdd: function (e) {
        // add a place via the right click menu
    },

    doubleClick: function (latlng) {
        // what to do on double click
    },

    editPlace: function (key, f) {
        // edit a place
    },

    deletePlace: function (key) {
        // delete a place
    }
};
