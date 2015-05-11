mobileFormFactor = false;

Template.map.rendered = function () {

    if(!Map.map) {

        $(window).resize(function () {
            var h = $(window).height(), offsetTop = 55; // Calculate the top offset
            $('#map_canvas').css('height', (h - offsetTop));
            //$('#info_panel').css('height', (h - offsetTop));
        }).resize();

        Map.create('map_canvas');
        switchCollection(Session.get('active_collection'));

        // this one switches back and forth on the pan so you can
        // just go up and down on a mobile formatted screen

        $(window).bind('resize', function () {
            var deviceWidth = window.innerWidth;
            if(deviceWidth < 768) {
                mobileFormFactor = true;
                Map.removeDrawControl();
            } else {
                mobileFormFactor = false;
            }
        }).trigger('resize');
    }
};