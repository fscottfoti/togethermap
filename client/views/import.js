Template.import.rendered = function () {

    $(document).on('change', '.btn-file :file', function() {
        var input = $(this);
        var file = input.get(0).files[0];
        Session.set('spinning', true);
        bootbox.hideAll();
        handleFile(file);
    });
};
