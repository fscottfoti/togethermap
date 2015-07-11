toggleDoubleClickAdd = function () {
    Session.set('doubleclickadd', !Session.get('doubleclickadd'));

    if( Session.get('doubleclickadd') ) {
        Map.enableDoubleClickAdd();
    } else {
        Map.enableDoubleClickZoom();
    }
};

togglePanOnMouseOver = function () {
    Session.set('panOnMouseOver', !Session.get('panOnMouseOver'));
};

Template.settings.helpers({
    doubleClickAdd: function () {
        return !!Session.get('doubleclickadd');
    },
    panToPlace: function () {
        return Session.get('panOnMouseOver');
    }
});

Template.settings.events = {
    'click .toggle-double-click': function () {

        toggleDoubleClickAdd();
    },
    'click .toggle-pan-to-place': function () {

        togglePanOnMouseOver();
    }
};
