OriginalHandlebars.registerHelper('noPlaces', function () {
    return this.recent_places.length == 0;
});

OriginalHandlebars.registerHelper('noPosts', function () {
    return this.recent_places.length == 0;
});

OriginalHandlebars.registerHelper('noComments', function () {
    return this.recent_places.length == 0;
});

OriginalHandlebars.registerHelper('stripContent', function(content){
    return content;
});

recentPlacesData = function (cid) {
    return {
        collection: MCollections.findOne(cid),
        recent_places: MPlaces.find({collectionId: cid}, {sort: {createDate: -1}, limit: RECENT_LIMIT}).fetch(),
        recent_posts: MPosts.find({collectionId: cid}, {$sort: {createDate: -1}, limit: RECENT_LIMIT}).fetch(),
        recent_comments: MComments.find({collectionId: cid}, {$sort: {createDate: -1}, limit: RECENT_LIMIT}).fetch()
    }
};


// this was taken from telescope app, as was the emailWrapper template
buildTemplate = function (htmlContent) {

    var emailProperties = {
        secondaryColor: '#2c3e50',
        accentColor: '#f39c12',
        siteName: 'Yesterday\'s News from TogetherMap',
        tagline: 'Make maps of things, then talk about them.',
        siteUrl: 'http://togethermap.com',
        body: htmlContent,
        unsubscribe: '',
        footer: '',
        logoUrl: '',
        logoHeight: undefined,
        logoWidth: undefined
    };

    var emailHTML = Handlebars.templates['layout'](emailProperties);

    var inlinedHTML = juice(emailHTML);

    var doctype = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">'

    return doctype+inlinedHTML;
};