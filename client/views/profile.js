Template.profile.rendered = function () {

    Session.set('placesByUser', 0);
    var uid = Session.get('active_user');
    Meteor.call('countPlacesByUser', uid, function (err, count) {
        Session.set('placesByUser', count);
    });
};


Template.profile.helpers({
    visible_places_count: function () {
        return Session.get('map_visible_places') || 0;
    },
    places_loaded_count: function () {
        return MPlaces.find({creatorUID: this.userId}).count();
    },
    exceeds_place_limit: function () {
        return (Session.get('map_visible_places') || 0) >= PLACE_LIMIT;
    },
    userPlaceCount: function () {
        return Session.get('placesByUser');
    }
});
