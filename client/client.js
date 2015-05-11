Meteor.startup(function(){
});


var formatDate = function (date) {
    if(!date)
        return 'no date';
    return moment(date).format('MMM Do, h:mm a');
};

var formatnumber = function (num) {
    return numeral(num || 0).format('0,0');
};

Template.registerHelper('formatDate', function(date) {
    return formatDate(date);
});

Handlebars.registerHelper('formatDate', function(date) {
    return formatDate(date);
});


Template.registerHelper('formatNumber', function(num) {
    return formatnumber(num);
});

Handlebars.registerHelper('formatNumber', function(num) {
    return formatnumber(num);
});


Template.registerHelper('json', function(json) {
    return JSON.stringify(json, undefined, 2);
});

Handlebars.registerHelper('json', function(json) {
    return JSON.stringify(json, undefined, 2);
});

Template.registerHelper('defaultValue', function(v, def) {
    console.log(v, def);
    return  v || def;
});


syntaxHighlight = function (json) {
    if (typeof json != 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
};