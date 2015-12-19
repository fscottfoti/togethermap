Template.collection.rendered = function () {
    $('.dropdown-button').dropdown();
    $('.tooltipped').tooltip();
};


var isOwnerF = function (data) {
    return data.permission.owner || data.collection.creatorUID == Meteor.userId();
};


Template.collection.helpers({

    isOwner: function () {
        var cid = Session.get('activeCollection');
        return writePermission(this, cid, Meteor.user(), "collection");
    },

    isPlaceWriter: function () {
        var cid = Session.get('activeCollection');
        return writePermission(undefined, cid, Meteor.user(), "place");
    },

    isPostWriter: function () {
        var cid = Session.get('activeCollection');
        return writePermission(undefined, cid, Meteor.user(), "post");
    },

    isReader: function () {
        var cid = Session.get('activeCollection');
        return readPermission(Meteor.user(), cid);
    },

    places: function () {
        if(Session.get('activeConnector')) {
            if(!Session.get('results_ready'))
                return;
            var conn = connectors[Session.get('activeConnector')];
            // if special connector to places for this collection
            return conn.places;
        }

        var cid = Session.get('activeCollection');
        var sort = Session.get('activeSort') || {createDate: -1};
        return MPlaces.find({collectionId: cid}, {sort: sort, limit: 20});
    },

    visiblePlacesCount: function () {
        return Session.get('mapVisiblePlaces') || 0;
    },

    placesLoadedCount: function () {
        var cid = Session.get('activeCollection');
        return MPlaces.find({collectionId: cid}).count();
    },

    write_permission: function () {
        var cid = Session.get('activeCollection');
        return writePermission(this, cid, Meteor.user(), "collection");
    },

    followable: function () {
        return Meteor.user() && !isMine(this, Meteor.user()) &&
            !MFollowed.findOne({cid: this._id});
    },

    followed: function () {
        return MFollowed.findOne({cid: this._id});
    },

    sortTypes: function () {
        var a = ['Recent', 'Name', 'Image', 'User', 'Fdbck'];
        if(this.enable_thumbs_voting) a.push('Votes')
        return a;
    },

    placeList: function () {
        var c = this.collection;
        return c.disable_place_list == undefined ||
            c.disable_place_list == false ||
            Session.get('placeList');
    },

    filters: function () {
        if(!this.filters) return [];
        var a = _.keys(this.filters);
        a.unshift('None');
        return a;
    },

    filterSelected: function() {
        var filter = Session.get('activeFilterName');
        return this.toString() == filter
            ? 'selected' : '';
    },

    themeNames: function () {
        return _.keys(this.themes);
    },

    themeSelected: function() {
        var theme = Session.get('activeTheme') ||
            Template.parentData(1).default_theme;
        return this.toString() == theme
            ? 'selected' : '';
    },

    autoLoadEnabled: function () {
        return Session.get('autoLoading') ? "checked" : null;
    },
});

var closed = true;

Template.collection.events = {

    "change #activeFilter": function (evt) {

        var v = $(evt.target).val();

        Session.set('activeFilterName', v);
        
        v = this.filters[v];

        Map.newShapes();

        Session.set('activeFilter', v);

        Map.mapDriver.subscribe();
    },

    "click .load_more": function (evt) {
        Session.set('activeLimit', (Session.get('activeLimit') || 0) + 100);
        Map.mapDriver.subscribe();
    },

    "change #theme_name_picker": function (evt) {

        var v = $(evt.target).val();

        var f = this.themes[v].color_f;

        Map.resetStyle(f);

        Session.set('activeTheme', v);
    },

    'click .sortings': function () {
        // I really shouldn't have to do this - there's some sort of bad
        // interaction with bootstrap and the leaflet container
        if(closed) {
            $('.dropdown-toggle').dropdown('toggle');
        } else {
            $('.dropdown.open .dropdown-toggle').dropdown('toggle');
        }
        closed = !closed;
    },

    'click .sort-by': function (e) {

        e.preventDefault();
        var type = $(e.target).attr('id');

        if(Map.mapDriver.subscribe) {

            var sort;

            if(type == "Recent")
                sort = {createDate: -1};
            if(type == "Votes")
                sort = {'votes': -1};
            if(type == "Name")
                sort = {'properties.name': +1};
            if(type == "Image")
                sort = {'properties.image_url': -1};
            if(type == "User")
                sort = {'creator': +1};
            if(type == "Fdbck")
                sort = {'comment_count': -1};

            Session.set('activeSort', sort);
            Session.set('activeSortType', type);
            Map.mapDriver.subscribe();
        }
        $('.dropdown.open .dropdown-toggle').dropdown('toggle');
        closed = true;
    },

    'click .edit-link': function (e) {

        e.preventDefault();
        Router.go('collection_edit', {_id: this._id});
    },

    'click .recent-go': function (e) {

        e.preventDefault();
        Router.go('recent', {_id: this._id});
    },

    'click .profile-go': function (e) {

        e.preventDefault();
        Router.go('profile', {_id: this.creatorUID});
    },

    'click .follow': function (e) {

        $('.tooltipped').tooltip('remove');

        e.preventDefault();
        // don't want to follow it twice, so we do an upsert
        Meteor.call('addFollow', this._id, this.name);
        growl.success("Collection followed");

        Meteor.defer(function() {
            $('.tooltipped').tooltip();
        });
    },

    'click .unfollow': function (e) {

        $('.tooltipped').tooltip('remove');

        e.preventDefault();
        var obj = MFollowed.findOne({cid: this._id});
        Meteor.call('removeFollow', obj._id);
        growl.success("Collection unfollowed");

        Meteor.defer(function() {
            $('.tooltipped').tooltip();
        });
    },


    'click .pan-collection': function () {
        if(this.location) {
            Map.map.setView(this.location.center,
                this.location.zoom);
        } else {
            Map.zoomToBounds();
        }
        if(mobileFormFactor) {
            Map.sidebar.toggle();
        }
    },

    'click .show-list': function (e) {
        e.preventDefault();
        Session.set('placeList', true);
    },

    'change #enable-auto-load': function (e) {
        Session.set('autoLoading', !Session.get('autoLoading'));
    },
};
