imagePicker = function (callback, param) {
    filepicker.setKey('AK659iitRNyjQKFZQdx80z');
    filepicker.pick(
        {
            mimetypes: ['image/*'],
            container: 'modal',
            //maxSize: 1024*1024,
            services:['BOX', 'COMPUTER', 'DROPBOX', 'FACEBOOK', 'GOOGLE_DRIVE',
                'FLICKR', 'INSTAGRAM', 'IMAGE_SEARCH', 'URL', 'PICASA']
        },
        function(Blob){
            var url = Blob.url + "/convert?rotate=exif";
            callback(url, param);
        },
        function(FPError){
            console.log(FPError.toString());
        }
    );
};


initFroala = function (f) {

    $('#editable').editable({
        key: '9iqxeujfvhgwD3jef==',
        inlineMode: false,
        multiLine: true,
        initOnClick: false,
        theme: 'gray',
        placeholder: '',
        imageUpload: false,
        imageUploadURL: '/doesnotexist',
        mediaManager: false,

        buttons: [
            'bold',
            'italic',
            'sep',
            'insertUnorderedList',
            'sep',
            'createLink',
            'insertVideo',
            'sep',
            //'imagePicker',
            'sep',
            'html'
        ],

        customButtons: {

            // Insert HTML button with image button.
            imagePicker: {
                title: 'Pick image using filepicker.io',
                icon: {
                    type: 'font',

                    // Font Awesome icon class fa fa-*.
                    value: 'fa fa-image'
                },
                callback: function () {
                    // Insert HTML.
                    var cb = function (url, param) {                  
                        var html = '<img alt=\"Image Not Found\" src=\"' + url + '\" width=\"300\">';
                        param.insertHTML(html);
                        param.saveUndoStep();
                    }
                    imagePicker(cb, this);
                },
                refresh: function () {
                }
            }
        }
    });

    $('#editable').on('editable.beforeUploadPastedImage', function (e, editor) {
        return false;
    });

    $('#editable').on('editable.contentChanged', function (e, editor) {
        if(!f)
            return;
        f(editor.getHTML());
    });
};
