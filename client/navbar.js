Template.nav.rendered = function () {
    $('.toggle-menu').jPushMenu({closeOnClickLink: false});
    $('.dropdown-toggle').dropdown();
};


Template.nav.events = {

    'click .map-sidebar-toggle': function (e) {

        e.preventDefault();
        if(!Map.sidebarOpened) {
            // don't do anything unless we've opened the sidebar before
            return;
        }
        Map.sidebar.toggle();
        if(Map.sidebar.isVisible()) {
            history.back();
        }
    }
};


Template.navItems.helpers({

    my_collections: function () {
        return MCollections.find(userIdExpression());
    },

    no_collections: function () {
        return MCollections.find(userIdExpression()).count() == 0;
    },

    followed: function () {
        return MFollowed.find();
    },

    none_followed: function () {
        return MFollowed.find().count() == 0;
    },

    active_collection: function () {
        var cid = Session.get('active_collection');
        if(!cid)
            return;
        var c = MCollections.findOne(cid);
        if(!c)
            return;
        return c.name;
    }
});

infoHidden = {};

var closeDropdowns = function () {
    $('.dropdown.open .dropdown-toggle').dropdown('toggle');
    $('.toggle-menu:visible').click();
};

var renderTmp = function (template, data) {
    var node = document.createElement("div");
    document.body.appendChild(node);
    UI.renderWithData(template, data, node);
    return node;
};

Template.navItems.events = {

    'click .settings-go': function (e) {

        e.preventDefault();
        makeBootbox(renderTmp(Template.settings));
        closeDropdowns();
    },

    'click .collection-go': function (e) {

        e.preventDefault();
        Router.go('collection', {_id: this._id});
        closeDropdowns();
    },

    'click .collections-go': function (e) {

        e.preventDefault();
        Router.go('collections');
        closeDropdowns();
    },

    'click .search-go': function (e) {

        e.preventDefault();
        Router.go('search');
        closeDropdowns();
    },

    'click .followed-go': function (e) {

        e.preventDefault();
        Router.go('collection', {_id: this.cid});
        closeDropdowns();
    },

    'click .active-collection': function (e) {

        e.preventDefault();
        var cid = Session.get('active_collection');
        Router.go('collection', {_id: cid});
    },

    'click .newCollection': function(e) {
        
        var obj = {'name': 'NEW COLLECTION'};
        
        Meteor.call("createCollection", obj, function(err, key) {
            if (err)
                console.log(err);
        
            Router.go('collection', {_id: key});
            closeDropdowns();
        });
    }
};