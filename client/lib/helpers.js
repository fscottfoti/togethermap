var formatDate = function (date, format) {
    if(!date)
        return 'no date';
    return moment(date).format(format || 'MMM Do YYYY, h:mm a');
};


var formatNumber = function (num, format) {
    return numeral(num || 0).format(format || '0,0');
};


// these are all added to meteor handlebars and regular handlebars - 
// regular handlebars is used to dynamically provide templates on the places
// the place list, the place labels, etc


Template.registerHelper('formatDate', function(date) {
    return formatDate(date);
});


Handlebars.registerHelper('formatDate', function(date, options) {
    return formatDate(date, options.hash.format);
});


Template.registerHelper('formatNumber', function(num) {
    return formatNumber(num);
});


Handlebars.registerHelper('formatNumber', function(num, options) {
    return formatNumber(num, options.hash.format);
});


// formats json nicely
Template.registerHelper('json', function(json) {
    return JSON.stringify(json, undefined, 2);
});


// formats json nicely
Handlebars.registerHelper('json', function(json) {
    return JSON.stringify(json, undefined, 2);
});


Template.registerHelper('pluralize', function(n, thing) {
    n = n || 0;
    // fairly stupid pluralizer
    if (n === 1) {
        return '1 ' + thing;
    } else {
        return numeral(n || 0).format('0,0') + ' ' + thing + 's';
    }
});


Handlebars.registerHelper('prettyPrint', function(obj) {
    return prettyPrint(obj, {styles: {object: {th: 
        {backgroundColor: "#0277bd"}}}}).outerHTML;
});


Handlebars.registerHelper('jsonToTable', function(obj) {
    var header = ""+
    "<table class=\"bordered highlight\">"+
    "    <thead>"+
    "     <tr>"+
    "          <th>Name</th>"+
    "          <th>Value</th>"+
    "      </tr>"+
    "    </thead>, "+
    "    <tbody>"
    var rows = _.map(obj, function (v, k) {
        return ""+
        "  <tr>"+
        "    <td>"+k+"</td>"+
        "    <td>"+v+"</td>"+
        "  </tr>"
    });
    var footer = "</tbody></table>" 
    return header + rows.join("") + footer;
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



function strip(html)
{
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}


// strips html tags...
Template.registerHelper('stripContent', function(content){
    return strip(content);
});