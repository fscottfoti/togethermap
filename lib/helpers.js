Handlebars.registerHelper('defaultValue', function(v, def) {
    return  v || def;
});


RegExp.escape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};


tile2long = function(x,z) {
    return (x/Math.pow(2,z)*360-180);
}
tile2lat = function(y,z) {
    var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
    return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}


type2CollectionMap = {
    "place": MPlaces,
    "post": MPosts,
    "comment": MComments,
    "collection": MCollections
};


defaultPlaceTemplate =
    '<h2>'+
    '    {{#if properties.link_url}}'+
    '        <a href="{{properties.link_url}}" target="_blank">{{defaultValue properties.name "No Name Given" }}</a>'+
    '    {{else}}'+
    '        {{defaultValue properties.name "No Name Given" }}'+
    '    {{/if}}'+
    '    <i class="fa fa-location-arrow pan-map tooltipped"'+ 
    '       data-tooltip="Center"'+
    '       style="cursor:pointer;"></i>'+
    '</h2>';


defaultPlaceTemplateList =
    '<h4>'+
    '<span class="go-to-place" style="padding-right: 10px; cursor: pointer;">'+
    '{{ defaultValue properties.name "No Name Given" }}'+
    '<span>'+
    '</h4>';


defaultPlaceTemplateLabel =
    '<h4>'+
    '<span class="go-to-place" style="cursor: pointer;">'+
    '{{ defaultValue properties.name "No Name Given" }}'+
    '<span>'+
    '</h4>'+
    '{{#if properties.image_url}}'+
    '<div style="padding-bottom: 10px;">' +
    '<img src="{{properties.image_url}}" style="width: 100px;"></div>'+
    '{{/if}}';


// used to export to csv
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
