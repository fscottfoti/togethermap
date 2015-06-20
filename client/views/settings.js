toggleDoubleClickAdd = function () {
    Session.set('doubleclickadd', !Session.get('doubleclickadd'));

    if( Session.get('doubleclickadd') ) {
        Map.enableDoubleClickAdd();
    } else {
        Map.enableDoubleClickZoom();
    }
};

Template.settings.helpers({
    doubleClickAdd: function () {
        return !!Session.get('doubleclickadd');
    }
});

Template.settings.events = {
    'click .toggle-double-click': function () {

        toggleDoubleClickAdd();
    }
};
