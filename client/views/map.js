mobileFormFactor = false;

resizeMap = function() {
    var h = $(window).height(), offsetTop = 60; // Calculate the top offset
    /*if (Session.get('noNav')) {
        // this is for the feature of turning the navbar off
        offsetTop = 0;
        $('body').css('margin-top', "0px");
    } else {
        $('body').css('margin-top', "55px");
    }*/
    $('#map_canvas').css('height', (h - offsetTop));
};


Template.map.rendered = function () {

    if(!Map.map) {

        $(window).resize(resizeMap).resize();

        Map.create('map_canvas');
        switchCollection(Session.get('activeCollection'));

        // this one switches back and forth on the pan so you can
        // just go up and down on a mobile formatted screen

        $(window).bind('resize', function () {
            var deviceWidth = window.innerWidth;
            if(deviceWidth < 768) {
                if(!mobileFormFactor || mobileFormFactor === false) {
                    mobileFormFactor = true;
                    //Map.removeDrawControl();
                    Map.removeDesktopControls();
                    Map.addMobileControls();
                    var addBack = Map.drawControlAdded;
                    Map.removeDrawControl();
                    if(addBack) Map.addDrawControl();
                }
            } else {
                if(!mobileFormFactor || mobileFormFactor === true) {
                    mobileFormFactor = false;
                    Map.addDesktopControls();
                    Map.removeMobileControls();
                    var addBack = Map.drawControlAdded;
                    Map.removeDrawControl();
                    if(addBack) Map.addDrawControl();
                }
            }
        }).trigger('resize');
    }
};