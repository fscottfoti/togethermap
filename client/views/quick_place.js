Template.quick_place.rendered = function () {
};

Template.quick_place.helpers({
    dynamic_place: function () {
        if(templates.place_template_list) {
            return templates.place_template_list(this);
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

    recentSort: function () { return Session.get('active_sort_type') == "Recent"},

    voteSort: function () { return Session.get('active_sort_type') == "Votes"},

    imageSort: function () { return Session.get('active_sort_type') == "Image"},

    creatorSort: function () { return Session.get('active_sort_type') == "User"},

    postSort: function () { return Session.get('active_sort_type') == "Posts"}
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