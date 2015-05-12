Template.quick_place.helpers({
    dynamic_place: function () {
        // compiled when we change the collection for performance
        //this.link=pathFor('place', {_id: this._id, _cid: this.collectionId});
        if(templates.place_template_list) {
            return templates.place_template_list(this);
        } else {
            return Handlebars.compile(defaultPlaceTemplateList)(this);
        }
    }
});

Template.quick_place.events = {

    'click .pan-map': function () {

        var center = Map.jsonGetCenter(this);

        if (Map.center().distanceTo(center) < 50) {

            // for the second click, zoom in instead
            Map.zoomToFeature(this._id);

        } else {

            Map.panTo(center);
        }

        Map.bounceMarker(this._id);
    },

    'click .go-to-place': function (e) {

        e.preventDefault();
        Router.go('place', {
            _id: this._id,
            _cid: this.collectionId
        });
    },
};