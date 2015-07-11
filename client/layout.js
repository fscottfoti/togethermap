Template.layout.helpers({
    spinning: function () {
        return Session.get('spinning') || false;
    },
    noNav: function () {
        return Session.get('noNav');
    }
});
