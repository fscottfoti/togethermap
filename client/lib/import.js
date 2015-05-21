function readerLoadZip() {
    if (this.readyState !== 2 || this.error) {
        return;
    }
    else {
        var zip = shp.parseZip(this.result);
        loadShapes(zip);
    }
}


function readerLoadJson(e) {
    if (this.readyState !== 2 || this.error) {
        return;
    }
    var json = JSON.parse(e.target.result);
    loadShapes(json);
}


// data should be geojson format by this point
function loadShapes(data) {
    if(data.features.length > 5000) {
        growl.error('Import currently limited to 2500 shapes.  This file is '+
        +data.features.length+
        ' shapes.  If you need more shapes contact TogetherMap and we will hook you up.')
        return;
    }

    var shps = L.geoJson(data);
    Map.map.fitBounds(shps.getBounds());

    var location = {
        center: Map.map.getCenter(),
        zoom: Map.map.getZoom()
    };

    for(var i = 0 ; i < data.features.length ; i++) {
        var f = data.features[i];
        f.properties.color = randomColor();

        var l = L.geoJson(f);
        if (f.geometry.type != "Point")
            l = l.getLayers()[0];
        f.bbox = Map.shapeAsBbox(l);
    }
    console.log("Loading " + data.features.length + " features");

    var col = {
        'name': data.fileName || fileName || 'NEW COLLECTION',
        'location': location,
        'place_count': data.features.length
    };

    Meteor.call('createCollectionWithPlaces',
        col,
        data.features, function(err, key) {
        if (err)
            console.log(err);

        Session.set('spinning', false);
        Router.go('collection', {_id: key});
    });
}


function handleZipFile(file) {
    var reader = new FileReader();
    reader.onload = readerLoadZip;
    reader.readAsArrayBuffer(file);
}

function handleJsonFile(file) {
    var reader = new FileReader();
    reader.onload = readerLoadJson;
    reader.readAsText(file);
}

var fileName = undefined;

handleFile = function(file) {

    fileName = file.name.replace(/\\/g, '/').replace(/.*\//, '').replace(/\.[^/.]+$/, "");

    if (file.name.slice(-3) === 'zip') {
        return handleZipFile(file);
    }
    if (file.name.slice(-4) === 'json') {
        return handleJsonFile(file);
    }
    growl.error('Only zipped shapefiles and geojson are supported right now');
};