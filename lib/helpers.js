Handlebars.registerHelper('defaultValue', function(v, def) {
    return  v || def;
});


defaultPlaceTemplate =
    '<h2>'+
    '    {{defaultValue properties.name "No Name Given" }}'+
    '</h2>';

defaultPlaceTemplateList =
    '<h4>'+
    '<span class="go-to-place" style="cursor: pointer;">'+
    '{{ defaultValue properties.name "No Name Given" }}'+
    '<span>'+
    '</h4>';