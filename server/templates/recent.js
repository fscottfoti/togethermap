var urlBase = "http://togethermap.com";
//var urlBase = "http://localhost:3000";


OriginalHandlebars.registerHelper('ifEmpty', function(list, options) {
    if(list.length == 0) {
        return options.fn(this);
    }
});


OriginalHandlebars.registerHelper('collectionUrl', function(cid) {
    return urlBase + Router.path("collection", {_id: cid});
});


OriginalHandlebars.registerHelper('placeUrl', function(cid, pid) {
    return urlBase + Router.path("place", {
                _cid: cid,
                _id: pid
            });
});


OriginalHandlebars.registerHelper('postUrl', function(cid, pid) {
    return urlBase + Router.path("post", {
            _cid: cid,
            _id: pid
        });
});


OriginalHandlebars.registerHelper('defaultValue', function(v, def) {
    return  v || def;
});


OriginalHandlebars.registerHelper('dynamic_place', function (obj, template) {
    if(template) {
        return Handlebars.compile(template)(obj);
    } else {
        return OriginalHandlebars.compile(defaultPlaceTemplateList)(obj);
    }
});


recentPlacesData = function () {

    var dateFilter = {createDate: {$gt: new Date(Date.now() - 24*60*60*1000)}};
    return {
        collection: undefined,
        header: "Recent Activity for All Collections",
        recent_places: MPlaces.find(dateFilter, {sort: {createDate: -1}, limit: RECENT_LIMIT}).fetch(),
        recent_posts: MPosts.find(dateFilter, {sort: {createDate: -1}, limit: RECENT_LIMIT}).fetch(),
        recent_comments: MComments.find(dateFilter, {sort: {createDate: -1}, limit: RECENT_LIMIT}).fetch()
    }
};


recentPlacesDataByUser = function (userId) {
    var dateFilter = {createDate: {$gt: new Date(Date.now() - 60*60*1000)}};
    var filter = limitToMyCollections(userId, dateFilter, true);

    return {
        collections: undefined,
        header: "Recent Activity for Your Collections",
        recent_places: MPlaces.find(filter, {sort: {createDate: -1}, limit: RECENT_LIMIT}).fetch(),
        recent_posts: MPosts.find(filter, {sort: {createDate: -1}, limit: RECENT_LIMIT}).fetch(),
        recent_comments: MComments.find(filter, {sort: {createDate: -1}, limit: RECENT_LIMIT}).fetch()
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