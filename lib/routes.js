Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'loading',
    waitOn: function() {
        return [
            Meteor.subscribe('collections'),
            Meteor.subscribe('collectionsUser')
        ]
    }
});


var verifyPermissions = function (that, cid) {
    if(connectors[cid]) {
        that.next();
        return;
    }

    if(cid == "empty" || readPermission(Meteor.user(), cid)) {
        that.next()
    } else {
        that.render('permission_denied');
    }
};

var waitOn = function (cid) {
    return [
        Meteor.subscribe("collection", cid, {
            onReady: function (c) {
                if (!c && !Map.activeBaseMap) {
                    Map.switchBaseLayer(Map.defaultBaseMap);
                }
            }
        }),
        Meteor.subscribe("permissionsForCid", cid)
    ]
};


Router.map(function () {


    /*this.route('email', {
        where: 'server',
        path: '/email/:_id',
        action: function() {
            var data = recentPlacesDataByUser(this.params._id);
            var html = Handlebars.templates['recent'](data);
            html = buildTemplate(html);
            this.response.writeHead(200, {'Content-Type': 'text/html'});
            this.response.write(html);
            this.response.end();

            //Meteor.call(
            //    "sendEmail",
            //    "Fletcher <fletcher@togethermap.com>",
            //    "TogetherMap <info@togethermap.com>",
            //    "Yesterday's News from TogetherMap2",
            //    html
            //);
        }
    });*/


    this.route('home', {
        path: '/',
        onAfterAction: function () {
            switchCollection();
            closeSidebar();
        }
    });


    this.route('landing', {
        path: '/landing',
        onAfterAction: function () {
            openSidebar();  
        }
    });


    this.route('login', {
        path: '/login',
        onAfterAction: function () {
            openSidebar();  
        }
    });


    this.route('settings', {
        path: '/settings',
        onAfterAction: function () {
            openSidebar();  
        }
    });


    this.route('import', {
        path: '/import',
        onAfterAction: function () {
            openSidebar();  
        }
    });


    this.route('collections', {
        data: function () {
            return {
                collections: MCollections.find(
                    { name: { $ne: 'NEW COLLECTION' } },
                    { sort: { createDate: -1}}
                )
            }
        },
        onAfterAction: function () {
            switchCollection('collections');
            openSidebar();
        }
    });


    this.route('collection', {
        path: '/collection/:_id',
        waitOn: function () {
            Session.set('noNav', Session.get('noNav') || this.params.query.noNav);
            return waitOn(this.params._id);
        },
        data: function () {
            return {
                collection: MCollections.findOne(this.params._id),
                permission: MPermissions.findOne(this.params._id)
            }
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._id);
        },
        onAfterAction: function () {
            Map.normalOtherPlaces();
            switchCollection(this.params._id);
            openSidebar();
        }
    });


    this.route('recent', {
        path: '/recent/:_id',
        waitOn: function () {
            return waitOn(this.params._id);
        },
        subscriptions: function () {
            return [
                Meteor.subscribe('posts', undefined, this.params._id),
                Meteor.subscribe('places', this.params._id, undefined, {createDate: -1}, RECENT_LIMIT),
                Meteor.subscribe('comments', undefined, this.params._id)
            ]
        },
        data: function () {
            return {
                collection: MCollections.findOne(this.params._id),
                recent_places: MPlaces.find({collectionId: this.params._id}, {sort: {createDate: -1}, limit: RECENT_LIMIT}),
                recent_posts: MPosts.find({collectionId: this.params._id}, {$sort: {createDate: -1}, limit: RECENT_LIMIT}),
                recent_comments: MComments.find({collectionId: this.params._id}, {$sort: {createDate: -1}, limit: RECENT_LIMIT})
            }
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._id);
        },
        onAfterAction: function () {
            switchCollection(this.params._id);
            openSidebar();
        }
    });


    this.route('permissions', {
        path: '/permissions/:_id',
        waitOn: function () {
            return [
                Meteor.subscribe('fullCollection', this.params._id)
            ]
        },
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


    this.route('permissions_link', {
        path: '/permissions_link/:_id/:type/:key',
        waitOn: function () {
            return [
                Meteor.subscribe('collectionViaKey',
                    this.params._id, this.params.key),
                Meteor.subscribe("permissionsForCid", this.params._id)
            ]
        },
        data: function () {
            return {
                params: this.params,
                collection: MCollections.findOne(this.params._id),
                permissions: MPermissions.findOne(this.params._id)
            }
        },
        onAfterAction: function () {
            if(this.data().collection &&
                this.data().collection.read_loginreq != true &&
                this.params.type == "readers") {
                // if it's not login required, by definition we want to just
                // give access to the collection - no funny business
                Router.go("collection",
                    {_id: this.params._id});
            }
            switchCollection();
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
        waitOn: function () {
            return waitOn(this.params._id);
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._id);
        },
        onAfterAction: function () {
            switchCollection(this.params._id);
            openSidebar();
        }
    });


    this.route('profile', {
        path: '/profile/:_id',
        subscriptions: function () {
            return [
                Meteor.subscribe('userData', this.params._id)]
        },
        data: function () {
            return {
                userId: this.params._id,
                profile: Meteor.users.findOne(this.params._id),
                places: MPlaces.find({creatorUID: this.params._id})
            }
        },
        onAfterAction: function () {
            Session.set('active_user', this.params._id);
            switchCollection('profile');
            openSidebar();
        },
        onStop: function () {
            Session.set('active_user', undefined);
        }
    });


    this.route('place', {
        path: '/place/:_cid/:_id',
        subscriptions: function () {
            return [
                Meteor.subscribe('allCollectionsForPlace', this.params._id),
                Meteor.subscribe('posts', this.params._id, this.params._cid)
            ]
        },
        data: function () {
            if(this.ready()) {

                Map.highlightPlace(this.params._id);

                var id = this.params._id;
                var cid = this.params._cid;

                var p = connectors[cid] ?
                    connectors[cid].getOne(id) :
                    MPlaces.findOne(id);

                if(Session.get('active_connector') && Session.get('results_ready')) {
                     p = connectors[Session.get('active_connector')].getOne(this.params._id);
                }

                if(!p) {
                    // place has been deleted
                    return;
                }

                Map.goToPlace(p, true, true);

                var pid = p.parent_id || p._id;

                return {
                    place: p,
                    posts: MPosts.find({placeId: id}, {sort: {createDate: +1}}),
                    allPlaceInstances: MPlaces.find({$or: [{_id: pid}, {parent_id: pid}]})
                }
            }
        },
        waitOn: function () {
            var id = this.params._id;
            var cid = this.params._cid;
            var a = waitOn(cid);

            // wait on the place too so I can use it in the filter above
            // this is made more than a little convoluted because when we go
            // off site to get a place (e.g. Factual) we make a Meteor.call which
            // requires this ReactivePromise thing to wait on it

            var promise = connectors[cid] ?
                ReactivePromise.when("myTask", connectors[cid].getOne(id)) :
                Meteor.subscribe('place', this.params._id, this.params._cid);


            a.push(promise);
            return a;
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._cid);
        },
        onAfterAction: function () {
            Session.set('active_place', this.params._id);
            Session.set('disableHover', true);
            switchCollection(this.params._cid);
            openSidebar();
        },
        unload: function () {
            Session.set('disableHover', false);
        }
    });


    this.route('place_edit', {
        path: '/place_edit/:_cid/:_id',
        subscriptions: function() {
            return Meteor.subscribe('place', this.params._id, this.params._cid);
        },
        data: function () {
            if(this.ready()) {
                Map.goToPlace(MPlaces.findOne(this.params._id), true, true);
                Map.highlightPlace(this.params._id);
            }
            return {
                place: MPlaces.findOne(this.params._id)
            }
        },
        waitOn: function () {
            return waitOn(this.params._cid);
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._cid);
        },
        onAfterAction: function () {
            Session.set('active_place', this.params._id);
            Session.set('disableHover', true);
            switchCollection(this.params._cid);
            openSidebar();
        },
        unload: function () {
            Session.set('disableHover', false);
        }
    });


    this.route('post', {
        path: '/post/:_cid/:_id',
        subscriptions: function() {
            return [
                Meteor.subscribe('post', this.params._id, this.params._cid),
                Meteor.subscribe('comments', this.params._id, this.params._cid)
            ]
        },
        data: function () {
            if(this.ready()) {
                Map.highlightPlace(MPosts.findOne(this.params._id).placeId);
            }
            return {
                post: MPosts.findOne(this.params._id),
                comments: MComments.find({postId: this.params._id}, {sort: {createDate: +1}})
            }
        },
        waitOn: function () {
            return waitOn(this.params._cid);
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._cid);
        },
        onAfterAction: function () {
            Session.set('disableHover', true);
            switchCollection(this.params._cid);
            openSidebar();
        },
        unload: function () {
            Session.set('disableHover', false);
        }
    });


    this.route('post_edit', {
        path: '/post_edit/:_cid/:_id',
        subscriptions: function() {
            return [
                Meteor.subscribe('post', this.params._id, this.params._cid)
            ]
        },
        data: function () {     
            if(this.ready())
                Map.highlightPlace(MPosts.findOne(this.params._id).placeId);
            return {
                post: MPosts.findOne(this.params._id)
            }
        },
        waitOn: function () {
            return waitOn(this.params._cid);
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._cid);
        },
        onAfterAction: function () {
            Session.set('disableHover', true);
            switchCollection(this.params._cid);
            openSidebar();
        },
        unload: function () {
            Session.set('disableHover', false);
        }
    });


    this.route('search', {
        path: '/search',
        onAfterAction: function () {
            Session.set('query_string', undefined);
            Session.set('query_valid', true);
            switchCollection(factualCid);
            openSidebar();
        },
        onStop: function () {
            Session.set('query_valid', false);
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
        waitOn: function () {
            Session.set('noNav', Session.get('noNav') || this.params.query.noNav);
            return waitOn(this.params._id);
        },
        onBeforeAction: function () {
            verifyPermissions(this, this.params._id);
        },
        onAfterAction: function () {
            if(this.params._id == "empty")
                Map.switchBaseLayer(Map.defaultBaseMap);
            switchCollection(this.params._id);
            closeSidebar();
        }
    });
});


AccountsTemplates.configure({
    //defaultLayout: 'emptyLayout',
    showForgotPasswordLink: true,
    overrideLoginErrors: true,
    enablePasswordChange: true,
    sendVerificationEmail: false,

    //enforceEmailVerification: true,
    //confirmPassword: true,
    //continuousValidation: false,
    //displayFormLabels: true,
    //forbidClientAccountCreation: false,
    //formValidationFeedback: true,
    //homeRoutePath: '/',
    //showAddRemoveServices: false,
    //showPlaceholders: true,

    negativeValidation: true,
    positiveValidation:true,
    negativeFeedback: false,
    positiveFeedback:false,

    // Privacy Policy and Terms of Use
    //privacyUrl: 'privacy',
    //termsUrl: 'terms-of-use',
});


AccountsTemplates.configureRoute('changePwd');
AccountsTemplates.configureRoute('enrollAccount');
AccountsTemplates.configureRoute('forgotPwd');
AccountsTemplates.configureRoute('resetPwd');
AccountsTemplates.configureRoute('signIn');
AccountsTemplates.configureRoute('signUp');
AccountsTemplates.configureRoute('verifyEmail');


var currentCollection;
templates = {};
var sidebarOpen;


openSidebar = function () {
    sidebarOpen = true;
    if(Map.map) {
        Map.sidebar.show();
    }
};


closeSidebar = function () {
    sidebarOpen = false;
    if(Map.map) {
        Map.sidebar.hide();
    }
};


connectors = {
    'home': SearchConnector,
    'profile': ProfileConnector,
    'collections': CollectionsConnector,
    'picasa': PicasaConnector,
    'flickr': FlickrConnector,
    'factual': FactualConnector
};
connectors[factualCid] = FactualConnector;

switchCollection = function (cid) {

    Session.set('active_collection', cid);

    if(!Meteor.userId()) {
        // if logged out
        Map.removeDrawControl();
    }

    if('collections') {
        // if logged out
        Map.removeDrawControl();
    }

    if(!Map.map) {
        return;
    }

    if(sidebarOpen) {
        // yes I get that this is weird, but when you refresh, we
        // open the sidebar before the map is initialized so we
        // need to store the state and open when we initialize
        openSidebar();
    }

    if(cid in connectors) {

        if(cid == currentCollection)
            return;

        Session.set('active_connector', undefined);

        currentCollection = cid;

        var conn = connectors[cid];

        // custom data connector

        templates.place_template = Handlebars.compile(defaultPlaceTemplate);
        templates.place_template_list = Handlebars.compile(defaultPlaceTemplateList);

        conn.init();
        conn.getAll();

        return;
    }

    if(!cid) {
        if(currentCollection) {
            Map.newShapes();
            Session.set('active_connector', undefined);
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
        return;
    }

    if(cid != currentCollection) {

        Session.set('active_connector', undefined);

        currentCollection = cid;

        DefaultMapDriver.init(cid, c);

        Map.newShapes();

        if(c.flickr_link) {

            // set up contomized flickr connector
            Session.set('results_ready', false);
            Session.set('active_connector', 'flickr');
            FlickrConnector.init(c.flickr_link);
            if(!c.place_template)
                c.place_template = FlickrConnector.place_template;
            if(!c.place_template_list)
                c.place_template_list = FlickrConnector.place_template_list;
            if(!c.place_template_label)
                c.place_template_label = FlickrConnector.place_template_label;

        } else if(c.transit_name) {
            TransitConnector.init(c.transit_name);
        }

        if(c.useConnectorTemplates) {
            var conn = connectors[c.useConnectorTemplates];
            if(!c.place_template)
                c.place_template = conn.place_template;
            if(!c.place_template_list)
                c.place_template_list = conn.place_template_list;
            if(!c.place_template_label)
                c.place_template_label = conn.place_template_label;
        }

        templates.place_template = Handlebars.compile(
            c.place_template || defaultPlaceTemplate);

        templates.place_template_list = Handlebars.compile(
            c.place_template_list || defaultPlaceTemplateList);

        templates.place_template_label = Handlebars.compile(
            c.place_template_label || defaultPlaceTemplateLabel);

    }

    // this needs to be outside of the if statement above so it
    // will run every time a person logs in or out
    if(writePermission(undefined, cid, Meteor.user(), 'place')) {
        Map.addDrawControl();
    } else {
        Map.removeDrawControl();
    }

    if(!c.disable_geoindex) {
        var poly = Map.getBoundsAsPolygon();
    }
    Meteor.subscribe("places", cid, poly, {
        onReady: function() {
            DefaultMapDriver.maybeSetLocation();
            var cnt = Map.countVisiblePlaces();
            Session.set('map_visible_places', cnt);
        }
    });
    DefaultMapDriver.getAll(cid);
};