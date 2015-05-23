Template.profile.helpers({
    visible_places_count: function () {
        return Session.get('map_visible_places') || 0;
    },
    places_loaded_count: function () {
        return MPlaces.find({creatorUID: this.userId}).count();
    },
    exceeds_place_limit: function () {
        return (Session.get('map_visible_places') || 0) >= PLACE_LIMIT;
    }
});
