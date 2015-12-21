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


toggleNavbar = function () {
    Session.set('noNav', !Session.get('noNav'));
    resizeMap();
};


Template.settings.helpers({
    doubleClickAdd: function () {
        return !!Session.get('doubleclickadd');
    },
    panToPlace: function () {
        return Session.get('panOnMouseOver');
    },
    navbarDisabled: function () {
        return Session.get('noNav');
    }
});


Template.settings.events = {
    'click .toggle-double-click': function () {

        toggleDoubleClickAdd();
    },
    'click .toggle-pan-to-place': function () {

        togglePanOnMouseOver();
    },
    'click .toggle-navbar': function () {

        toggleNavbar();
    }
};
