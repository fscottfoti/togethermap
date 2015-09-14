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


function readerLoadCsv(e) {
    if (this.readyState !== 2 || this.error) {
        return;
    }
    csv2geojson.csv2geojson(e.target.result, function(err, data) {
        if(err.message) {
            console.log(err, data);
            growl.error("Error parsing csv: " + err.message);
            Session.set('spinning', false);
            return
        }
        loadShapes(data);
    });
}


// data should be geojson format by this point
loadShapes = function (data, collection) {
    if(data.features.length > 5000 && !isAdmin(Meteor.userId())) {
        growl.error('Import currently limited to 2500 shapes.  This file is '+
        +data.features.length+
        ' shapes.  If you need more shapes contact TogetherMap and we will hook you up.')
        return;
    }

    var invalid = 0;
    var keep_features = [];
    for(var i = 0 ; i < data.features.length ; i++) {

        var f = data.features[i];
        f.properties.color = randomColor();

        var l = L.geoJson(f).getLayers()[0];

        f.bbox = Map.shapeAsBbox(l);

        if(f.bbox.type == "Point") {
            var a = f.bbox.coordinates,
                lon = a[0];
                lat = a[1];
                if(lat < -90 || lat > 90 || lon < -180 || lon > 180) {
                    invalid += 1;
                    continue;
                }
        }

        keep_features.push(data.features[i]);
    }

    data.features = keep_features;

    if(invalid) {
        growl.warning(invalid + " invalid geometries, attempting to continue.");
    }

    if(data.features.length == 0) {
        growl.error("No valid features, stopping.");
        Session.set('spinning', false);
        return;
    }

    console.log("Loading " + data.features.length + " features");

    var shps = L.geoJson(data);
    Map.map.fitBounds(shps.getBounds());

    var location = {
        center: Map.map.getCenter(),
        zoom: Map.map.getZoom()
    };

    var col = _.extend({
        'name': data.fileName || fileName || 'NEW COLLECTION',
        'location': location,
        'place_count': data.features.length
    }, collection);

    Meteor.call('createCollectionWithPlaces',
        col,
        data.features, function(err, key) {
        if (err)
            console.log(err);

        Session.set('spinning', false);
        Router.go('collection', {_id: key});
    });
};


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


function handleCsvFile(file) {
    var reader = new FileReader();
    reader.onload = readerLoadCsv;
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
    if (file.name.slice(-3) === 'csv') {
        return handleCsvFile(file);
    }
    growl.error('Only zipped shapefiles, geojson, and csv are supported right now');
};
