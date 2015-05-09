Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'loading',
    waitOn: function() { return Meteor.subscribe('collections'); }
});


Tracker.autorun(function () {
    Meteor.subscribe("userData");
    Meteor.subscribe("followed");
});


Router.map(function () {


    this.route('home', {
        path: '/',
        onAfterAction: function () {
            switchCollection();
            openSidebar();
        }
    });


    this.route('collections', {
        data: function () {
            return {
                collections: MCollections.find(
                    { name: { $ne: 'NEW COLLECTION' } },
                    { sort: { place_count: -1 }}
                )
            }
        },
        onAfterAction: function () {
            switchCollection();
            openSidebar();
        }
    });


    this.route('collection', {
        path: '/collection/:_id',
        data: function () {
            return {
                collection: MCollections.findOne(this.params._id)
            }
        },
        onAfterAction: function () {
            switchCollection(this.params._id);
            openSidebar();
        }
    });


    this.route('collection_edit', {
        path: '/collection_edit/:_id',
        data: function () {
            return {
                collection: MCollections.findOne(this.params._id)
            }
        },
        onAfterAction: function () {
            switchCollection(this.params._id);
            openSidebar();
        }
    });


    this.route('profile', {
        path: '/profile/:_id',
        onAfterAction: function () {
        }
    });


    this.route('place', {
        path: '/place/:_cid/:_id',
        subscriptions: function() {
            return [
                Meteor.subscribe('place', this.params._id),
                Meteor.subscribe('posts', this.params._id,
                    this.params._cid)
            ]
        },
        data: function () {
            return {
                place: MPlaces.findOne(this.params._id),
                posts: MPosts.find({placeId: this.params._id,
                    collectionId: this.params._cid})
            }
        },
        onAfterAction: function () {
            Session.set('active_place', this.params._id);
            switchCollection(this.params._cid);
            openSidebar();
        }
    });


    this.route('place_edit', {
        path: '/place_edit/:_cid/:_id',
        subscriptions: function() {
            return Meteor.subscribe('place', this.params._id);
        },
        data: function () {
            return MPlaces.findOne(this.params._id);
        },
        onAfterAction: function () {
            Session.set('active_place', this.params._id);
            switchCollection(this.params._cid);
            openSidebar();
        }
    });


    this.route('post', {
        path: '/post/:_cid/:_id',
        subscriptions: function() {
            return [
                Meteor.subscribe('post', this.params._id),
                Meteor.subscribe('comments', this.params._id)
            ]
        },
        data: function () {
            return {
                post: MPosts.findOne(this.params._id),
                comments: MComments.find({postId: this.params._id})
            }
        },
        onAfterAction: function () {
            switchCollection(this.params._cid);
            openSidebar();
        }
    });


    this.route('post_edit', {
        path: '/post_edit/:_cid/:_id',
        subscriptions: function() {
            return [
                Meteor.subscribe('post', this.params._id)
            ]
        },
        data: function () {
            return MPosts.findOne(this.params._id)
        },
        onAfterAction: function () {
            switchCollection(this.params._cid);
            openSidebar();
        }
    });


    this.route('search', {
        path: '/search',
        subscriptions: function() {
            return [
            ]
        },
        data: function () {
            return {
            }
        },
        onAfterAction: function () {
            switchCollection();
            openSidebar();
        }
    });


    // this is a non-route route.  Because iron router doesn't open the
    // sidebar when you go back to the route a second time, I'm going to
    // try going to this route (the map route) when closing the sidebar so
    // you can go back to any route that matters (i.e. it will open the
    // sidebar when you do something twice
    this.route('map', {
        path: '/map/:_id',
        data: function () {
            return {
                collection: MCollections.findOne(this.params._id)
            }
        },
        onAfterAction: function () {
            switchCollection(this.params._id);
            closeSidebar();
        }
    });
});


var currentCollection;
templates = {};


openSidebar = function () {
    if(Map.map) {
        Map.sidebar.show();
    }
};


closeSidebar = function () {
    if(Map.map) {
        Map.sidebar.hide();
    }
};


switchCollection = function (cid) {

    if(!Meteor.userId()) {
        // if logged out
        Map.removeDrawControl();
    }

    Session.set('active_collection', cid);

    if(!Map.map) {
        return;
    }

    if(!cid) {
        if(currentCollection) {
            Map.newShapes();
            Map.removeDrawControl();
            currentCollection = undefined;
        }

        if(!Map.activeBaseMap) {
            Map.switchBaseLayer(Map.defaultBaseMap);
        }
        return;
    }

    var c = MCollections.findOne(cid);

    if(!c) {
        if(!Map.activeBaseMap) {
            Map.switchBaseLayer(Map.defaultBaseMap);
        }
        return;

    }

    if(cid != currentCollection) {

        currentCollection = cid;

        Map.newShapes();
        if(!mobileFormFactor && Meteor.userId()) {
            Map.addDrawControl();
        }

        MapDriver.init(cid, c);

        templates.place_template = Handlebars.compile(
            c.default_place_template || defaultPlaceTemplate);

        templates.place_template_list = Handlebars.compile(
            c.default_place_template_list || defaultPlaceTemplateList);

    }
    Meteor.subscribe("places", cid);
    MapDriver.wholeCollectionQuery(cid);
};