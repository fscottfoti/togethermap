mobileFormFactor = false;

resizeMap = function() {
    var h = $(window).height(), offsetTop = 55; // Calculate the top offset
    if (Session.get('noNav')) {
        offsetTop = 0;
        $('body').css('margin-top', "0px");
    } else {
        $('body').css('margin-top', "55px");
    }
    $('#map_canvas').css('height', (h - offsetTop));
};

Template.map.rendered = function () {

    if(!Map.map) {

        $(window).resize(resizeMap).resize();

        Map.create('map_canvas');
        switchCollection(Session.get('active_collection'));

        // this one switches back and forth on the pan so you can
        // just go up and down on a mobile formatted screen

        $(window).bind('resize', function () {
            var deviceWidth = window.innerWidth;
            if(deviceWidth < 768) {
                mobileFormFactor = true;
                Map.removeDrawControl();
                Map.removeDesktopControls();
                Map.addMobileControls();
            } else {
                mobileFormFactor = false;
                Map.addDesktopControls();
                Map.removeMobileControls();
            }
        }).trigger('resize');
    }
};