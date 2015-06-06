customLabelForCollection = function (place) {
    var post_count = place.post_count || 0;

    var l = '';
    if(place.collectionId &&
        MCollections.findOne(place.collectionId)) {

        var c = MCollections.findOne(place.collectionId);
        if(c && c.place_template_list) {
            // this is the template off of the collection
            l = Handlebars.compile(c.place_template_list)(place);
        } else {
            l = Handlebars.compile(defaultPlaceTemplateList)(place);
        }

    } else {
        l = Handlebars.compile(defaultPlaceTemplateList)(place);
    }

    return l + post_count.toString() + (post_count !== 1 ? ' posts': ' post');
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
        Meteor.subscribe('places', undefined, poly, {createDate: -1},
            25, undefined);
    },

    getAll: function (cid) {

        DefaultMapDriver.subscription(
            MPlaces.find()
        );

    },

    locationChanged: function () {

        var poly = Map.getBoundsAsPolygon();
        Meteor.subscribe('places', undefined, poly, {createDate: -1},
            50, undefined);

        this.getAll();
    },

    activatePlace: function (key) {
        Session.set('dont_set_collection_location', true);
        var layer = Map.keysToLayers[key];
        var cid = layer.cid || Session.get('active_collection');
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