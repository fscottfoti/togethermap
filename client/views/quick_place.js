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
    }
});

Template.quick_place.events = {

    "mouseenter .quick-place": function (e) {
        Map.bounceMarker(this._id, 1);
        //Map.highlightPlace(this._id);
    },

    "mouseleave .quick-place": function (e) {
        //Map.unHighlightPlace(this._id);
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