var jqueryInit = function (id) {
    initFroala(function (html) {
        Meteor.call('updateCollection', id, {$set:{'description': html}});
    });
    Session.set('expertConfiguration', false);
};


Template.collectionEdit.rendered = function () {
    Session.set('cedit_mode', 'Icon');
    jqueryInit(this.data.collection._id);
};

Template.collectionEdit.helpers({

    collection: function () {
        var cid = Session.get('active_collection');
        return MCollections.findOne(cid);
    },

    locationDisplay: function () {
        return 'Center: ' +
               numeral(this.location.center.lat).format('0.00') + ", " +
               numeral(this.location.center.lng).format('0.00');
    },

    expertConfiguration: function () {
        return Session.get('expertConfiguration');
    },

    cedit_mode: function () {
        return Session.get('cedit_mode');
    },

    icon_mode: function () {
        return Session.get('cedit_mode') == "Icon";
    },

    icon_size_mode: function () {
        return Session.get('cedit_mode') == "Size";
    },

    icon_color_mode: function () {
        return Session.get('cedit_mode') == "Color";
    },

    drop_markers_checked: function () {
        return this.drop_markers ? "checked" : null;
    }
});


Template.collectionEdit.events = {

    'change input[name=name]': function(event) {
        Meteor.call('updateCollection', this._id, {$set:{name: event.target.value}});
    },

    'click .save-location': function() {
        var location = {
            center: Map.map.getCenter(),
            zoom: Map.map.getZoom()
        };

        Meteor.call('updateCollection',
            this._id, {$set:{location: location}});

        Meteor.call('updateCollection',
            this._id, {$set:{default_map: Map.activeBaseMap}});
    },

    'click .toggle-expert': function() {

        Session.set('expertConfiguration',
                    !Session.get('expertConfiguration'));
    },

    'click .delete-link': function(e) {

        e.preventDefault();
        var that = this;
        bootbox.confirm("Are you sure you want to delete this COLLECTION?", function(result) {
            if(result) {
                Meteor.call('removeCollection', that._id);
                Router.go('collections');
            }
        });
    },

    'click .cancel': function(e) {

        e.preventDefault();
        Router.go('collection', {_id: this._id});
    },

    'click .cedit_mode': function (e) {

        e.preventDefault();
        Session.set("cedit_mode", e.target.value);
    },

    'click .place-template-sample': function () {

        var t = $('#place-template').val();
        var p = _.sample(MPlaces.find().fetch());
        var d = Handlebars.compile(t)(p);
        if(!t)
            d = "No template";
        makeBootbox(d);
    },

    'click .place-template-json': function () {

        var p = _.sample(MPlaces.find().fetch());
        var d = "<pre>"+syntaxHighlight(p);
        makeBootbox(d);
    },

    'click .place-template-list-sample': function () {

        var t = $('#place-template-list').val();
        var p = _.sample(MPlaces.find().fetch());
        var d = Handlebars.compile(t)(p);
        if(!t)
            d = "No template";
        makeBootbox(d);
    },

    'change #icon_f': function (e) {

        var t = e.target.value;

        Meteor.call('updateCollection', this._id, {$set: {icon_f: t}});
    },

    'change #icon_size_f': function (e) {

        var t = e.target.value;

        Meteor.call('updateCollection', this._id, {$set: {icon_size_f: t}});
    },

    'change #color_f': function (e) {

        var t = e.target.value;

        Meteor.call('updateCollection', this._id, {$set: {color_f: t}});
    },

    'change #place-template': function (e) {

        var t = e.target.value;

        templates.place_template =
            Handlebars.compile(t || defaultPlaceTemplate);

        Meteor.call('updateCollection', this._id, {$set: {place_template: t}});
    },

    'change #place-template-list': function (e) {

        var t = e.target.value;

        templates.place_template_list =
            Handlebars.compile(t || defaultPlaceTemplateList);

        Meteor.call('updateCollection', this._id, {$set: {place_template_list: t}});
    },

    'change #drop-markers': function (e) {

        Meteor.call('updateCollection', this._id,
            {$set: {drop_markers: e.target.checked}});
    }
};
