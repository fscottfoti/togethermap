customLabelForCollection = function (place) {
    var l = '';
    if(place.collectionId &&
        MCollections.findOne(place.collectionId)) {

        var c = MCollections.findOne(place.collectionId);
        if(c && c.placeTemplateList) {
            // this is the template off of the collection
            l = Handlebars.compile(c.placeTemplateList)(place);
        } else {
            l = Handlebars.compile(defaultPlaceTemplateList)(place);
        }

    } else {
        l = Handlebars.compile(defaultPlaceTemplateList)(place);
    }

    return l;
};


markerThemeFuncForCollection = function (f, place) {
    if(!place.collectionId)
        return;
    var c = MCollections.findOne(place.collectionId);
    if(!c)
        return;
    if(c[f+'_f']) {
        return new Function('p', c[f+'_f'])(place.properties);
    }
};


SearchConnector = {

    init: function (id, options) {
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

        // subscribe to the places for this user

        var poly = Map.getBoundsAsPolygon();
        var userId = Session.get('active_user');
        var query = Session.get('query_string');


        Meteor.subscribe('places', undefined, poly, {createDate: -1},
            25, undefined, query, {
                onReady: function () {
                    Session.set('search_state', 'results_available');
                    Session.set('latest_completed_query', query);
                    var cnt = Map.countVisiblePlaces();
                    Session.set('map_visible_places', cnt);
                }
            });
    },


    searchFilter: function () {
        var filter = {};
        var query = Session.get('query_string');
        if (query) {
            filter['properties.name'] = {
                $regex: RegExp.escape(query),
                $options: 'i'
            }
        }
        return filter;
    },


    places: function () {
        return MPlaces.find(this.searchFilter());
    },


    getAll: function (cid) {
        DefaultMapDriver.subscription(
            MPlaces.find(this.searchFilter())
        );
    },


    locationChanged: function () {

        var poly = Map.getBoundsAsPolygon();
        var query = Session.get('query_string');

        Meteor.subscribe('places', undefined, poly, {createDate: -1},
            25, undefined, query, {
                onReady: function () {
                    Session.set('search_state', 'results_available');
                    Session.set('latest_completed_query', query);
                    var cnt = Map.countVisiblePlaces();
                    Session.set('map_visible_places', cnt);
                }
            });

        this.getAll();
    },


    activatePlace: function (key) {
        Session.set('dont_set_collection_location', true);
        var layer = Map.keysToLayers[key];
        var cid = layer.cid || Session.get('activeCollection');
        Router.go('place', {_id: key, _cid: cid});
    },


    markerThemeFunc: function (f, place) {
        return markerThemeFuncForCollection(f, place);
    },


    customLabel: function (place) {
        return customLabelForCollection(place);
    },


    createPlace: function (place) {
    },


    contextMenuAdd: function (e) {
    },


    doubleClick: function (latlng) {
    },


    editPlace: function (key, f) {
    },
    

    deletePlace: function (key) {
    }
};