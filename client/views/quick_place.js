Template.quick_place.rendered = function () {
    $('[data-toggle="tooltip"]').tooltip()
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
    }
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
    },

    'click .go-to-place': function (e) {

        e.preventDefault();
        Router.go('place', {
            _id: this._id,
            _cid: this.collectionId
        });
    },
};