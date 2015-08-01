Handlebars.registerHelper('defaultValue', function(v, def) {
    return  v || def;
});


RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};


type2CollectionMap = {
    "place": MPlaces,
    "post": MPosts,
    "comment": MComments,
    "collection": MCollections
};


defaultPlaceTemplate =
    '<h2>'+
    '    {{defaultValue properties.name "No Name Given" }}'+
    '    <i class="fa fa-location-arrow pan-map" style="cursor:pointer;"></i>'+
    '</h2>';


defaultPlaceTemplateList =
    '<h4>'+
    '<span class="go-to-place" style="cursor: pointer;">'+
    '{{ defaultValue properties.name "No Name Given" }}'+
    '<span>'+
    '</h4>'+
    '{{#if properties.image_url}}'+
    '<span style="padding-bottom: 10px; cursor: pointer;" class="go-to-place">' +
    '<img src="{{properties.image_url}}" style="width: 100%;"></span>'+
    '<div style="height: 10px; background-color: inherit;">&nbsp;</div>'+
    '{{/if}}';


flattenGeojsonObject = function(ob) {
    var toReturn = {};
    
    _.each(['_id', 'collectionId', 'creator', 'createDate', 'updateDate'], function (i) {
        toReturn[i] = ob[i];
    });

    for (var i in ob.properties) {
        // get the  properties in properties
        if(i == 'location') continue;
        if(i == 'creatorUID') continue;
        if(i == 'type') continue;
        toReturn[i] = ob.properties[i];
    }

    toReturn.geom = JSON.stringify(ob.geometry);
    toReturn.latitude = '';
    toReturn.longitude = '';

    if(ob.geometry.type == "Point") {
        toReturn.latitude = ob.geometry.coordinates[1];
        toReturn.longitude = ob.geometry.coordinates[0];
    }
    
    return toReturn;
};