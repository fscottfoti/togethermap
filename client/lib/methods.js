DEFAULT_CENTER = [37.7792, -122.3191];
DEFAULT_ZOOM = 11;
DEFAULT_BASEMAP = 'streets';


// this is how to make a toast (although in a few places
// toast is used directly)
growl = {
    success: function (msg) {
        Materialize.toast(msg, 3000, 'green');
    },
    warning: function (msg) {
        Materialize.toast(msg, 3000, "yellow");
    },
    error: function (msg) {
        Materialize.toast(msg, 3000, "red");
    }
}


imagePicker = function (callback, param) {
    filepicker.setKey(Meteor.settings.public.FILEPICKER_KEY);
    filepicker.pick(
        {
            mimetypes: ['image/*'],
            container: 'modal',
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


// gives random colors to randomly theme places
randomColor = function () {
    return '#' + [
            (~~(Math.random() * 16)).toString(16),
            (~~(Math.random() * 16)).toString(16),
            (~~(Math.random() * 16)).toString(16)
        ].join('');
};


stringAsInt =  function (s) {
    return Math.abs(parseInt(s, 36) % 10000)
};


var gseed = 1;
function random() {
    var x = Math.sin(gseed++) * 10000;
    return x - Math.floor(x);
}


// pseudo random color can provide the same color over and over
// again if passed in an integer seed (based on the key of a place)
pseudoRandomColor = function (seed) {
    gseed = seed;
    return '#' + [
            (~~(random() * 16)).toString(16),
            (~~(random() * 16)).toString(16),
            (~~(random() * 16)).toString(16)
        ].join('');
};


makeModal = function (d, title) {
    $.fancybox( d );
};


textEditorInit = function (content, f) {

    $('#editable').materialnote({
      toolbar: [         
        ['style', ['bold', 'italic', 'fontsize']],
        ['para', ['ul', 'ol', 'paragraph', 'codeview']]
      ],
      onChange: function(contents, $editable) {
        if(!f)
            return;
        f(contents);        
      }
    });
    $('#editable').code(content);
};


// this is used for file export
base64toBlob = function(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);

        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        var byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    var blob = new Blob(byteArrays, {type: contentType});
    return blob;
};
