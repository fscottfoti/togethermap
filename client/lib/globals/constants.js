DEFAULT_CENTER = [37.7792, -122.3191];
DEFAULT_ZOOM = 11;
DEFAULT_BASEMAP = 'streets';
MAPBOX_TOKEN =  'pk.eyJ1IjoiZnNjb3R0Zm90aSIsImEiOiJLVHVqNHlNIn0.'+
                'T0Ca4SWbbTc1p2jogYLQyA';

growl = toastr; // easier than search and replace and is more common

randomColor = function () {
    return '#' + [
            (~~(Math.random() * 16)).toString(16),
            (~~(Math.random() * 16)).toString(16),
            (~~(Math.random() * 16)).toString(16)
        ].join('');
};


Accounts.ui.config({
    requestPermissions: {},
    extraSignupFields: [{
        fieldName: 'displayName',
        fieldLabel: 'Name',
        inputType: 'text',
        visible: true,
        validate: function(value, errorFunction) {
            if (!value) {
                errorFunction("Please write your name");
                return false;
            } else {
                return true;
            }
        }
    }]
});


// this or's the meteor userid with the google id since historically
// things were owned by the google id - this allows users to get their
// data back from the old version of the site.

googleId = function () {
    if(!Meteor.user() || !Meteor.user().services || 
       !Meteor.user().services.google)
        return undefined;
    return 'google:'+Meteor.user().services.google.id;
};


userIdExpression = function () {
    if(!Meteor.user() || !Meteor.user().services)
        return;
    return {$or: [
        {creatorUID: Meteor.userId()},
        {creatorUID: googleId()}
    ]};
};


var admins = ['ceTir2NKMN87Gq7wj'];

var isAdmin = function () {
    return _.indexOf(admins, Meteor.userId()) != -1
};


var isMine = function (c) {
    return c.creatorUID == Meteor.userId() ||
        c.creatorUID == googleId()
};


writePermission = function(o) {
    return isMine(o) || isAdmin();
};


defaultPlaceTemplate =
    '<h2>'+
    '    {{#if properties.name}}' +
    '        {{ properties.name }}' +
    '    {{else}}' +
    '        No Name Given' +
    '    {{/if}}' +
    '</h2>';

defaultPlaceTemplateList =
    '<h4>'+
    '    {{#if properties.name}}' +
    '        {{ properties.name }}' +
    '    {{else}}' +
    '        No Name Given' +
    '    {{/if}}' +
    '</h4>';