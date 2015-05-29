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