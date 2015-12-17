Template.quick_place.rendered = function () {
    // this really slows down rendering!
    $('.tooltipped').tooltip();
};

Template.quick_place.helpers({
    dynamic_place: function () {
        if(templates.placeTemplateList) {
            return templates.placeTemplateList(this);
        } else {
            return Handlebars.compile(defaultPlaceTemplateList)(this);
        }
    },

    link_url: function () {
        var url = Router.routes.place.path({
            _id: this._id,
            _cid: this.collectionId
        });
        return url;
    },

    creator: function () {
        return this.creator || 'No Creator';
    },

    anySort: function () {
        var s = Session.get('activeSortType');
        return s !== undefined && s !== 'Name' && s !== 'Image';
    },

    recentSort: function () { return Session.get('activeSortType') == "Recent"},

    voteSort: function () { return Session.get('activeSortType') == "Votes"},

    imageSort: function () { return Session.get('activeSortType') == "Image"},

    creatorSort: function () { return Session.get('activeSortType') == "User"},

    postSort: function () { return Session.get('activeSortType') == "Comments"}
});

Template.quick_place.events = {

    "mouseenter .quick-place": function (e) {
        Map.bounceMarker(this._id, 1);
        Map.highlightPlace(this._id);
        if(Session.get('panOnMouseOver'))
            Map.goToPlace(this, false, true);
    },

    "mouseleave .quick-place": function (e) {
        Map.unHighlightPlace(this._id);
    },

    'click .pan-map': function () {

        Map.goToPlace(this);
        
        if(mobileFormFactor) {
            Map.sidebar.toggle();
        }
    },

    'click .go-to-place': function (e) {

        e.preventDefault();
        Router.go('place', {
            _id: this._id,
            _cid: this.collectionId
        });
    },
};