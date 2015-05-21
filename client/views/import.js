Template.import.rendered = function () {

    $(document).on('change', '.btn-file :file', function() {
        Session.set('spinning', true);
        bootbox.hideAll();
        var input = $(this);
        var file = input.get(0).files[0];
        handleFile(file);
    });
};
