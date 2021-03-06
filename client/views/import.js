Template.import.rendered = function () {

    $(document).on('change', '.btn-file :file', function() {
        Session.set('spinning', true);
        $.fancybox.close();
        var input = $(this);
        var file = input.get(0).files[0];
        handleFile(file);
    });
};

Template.import.events({
    'click .import-flickr': function(e) {

        e.preventDefault();
        var url = $('#flickr-link').val();
        Session.set('spinning', true);
        FlickrConnector.fetch(url, undefined, function (places) {
            $.fancybox.close();
            loadShapes({
                features: places
            }, {
                useConnectorTemplates: 'flickr',
                sourceUrl: url,
                disable_geoindex: true
            });
        });
    }
});
