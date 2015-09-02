Template.collectionEdit.rendered = function () {
    Session.set('cedit_mode', 'Icon');
    Session.set('expertConfiguration', false);
    var that = this;
    textEditorInit(this.data.collection.description, function (html) {
        var id = that.data.collection._id;
        Meteor.call('updateCollection', id, {$set:{'description': html}});
    });
    Session.set('expertConfiguration', false);
};


Template.collectionEdit.helpers({

    collection: function () {
        var cid = Session.get('active_collection');
        return MCollections.findOne(cid);
    },

    base_maps: function () {
        return _.map(['aerial', 'streets', 'grey', 'dark', 'atlas', 'outline', 'watercolor'],
            function (v) { return {name: v} });
    },

    basemapSelected: function() {
        return this.name === (Template.parentData(1).default_map || 'medium')
            ? 'selected' : '';
    },

    locationDisplay: function () {
        return 'Center: ' +
               numeral(this.location.center.lat).format('0.00') + "," +
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
    },

    disable_geoindex_checked: function () {
        return this.disable_geoindex ? "checked" : null;
    },

    enable_clustering_checked: function () {
        return this.enable_clustering ? "checked" : null;
    },

    isFlickr: function () {
        return this.useConnectorTemplates == "flickr";
    }
});


var getSamplePlace = function () {
    var cid = Session.get('active_collection');
    return _.sample(MPlaces.find({collectionId: cid}).fetch());
};


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

        /*Meteor.call('updateCollection',
            this._id, {$set:{default_map: Map.activeBaseMap}});*/

        growl.success('Default view set.')
    },

    "change #basemap": function (evt) {

        var v = $(evt.target).val();

        Map.switchBaseLayer(v);

        Meteor.call('updateCollection',
            this._id, {$set:{default_map: v}});

    },

    'click .toggle-expert': function() {

        Session.set('expertConfiguration',
                    !Session.get('expertConfiguration'));
    },

    'click .permissions-link': function (e) {

        e.preventDefault();
        Router.go('permissions', {_id: this._id});
    },

    'click .delete-link': function(e) {

        e.preventDefault();
        var that = this;
        MaterializeModal.confirm({
            title: "Confirm Delete",
            message: "Are you sure you want to delete this COLLECTION?", 
            callback: function(result) {
            if(result) {
                Meteor.call('removeCollection', that._id);
                Router.go('collections');
            }
        }});
    },

    'click .cancel': function(e) {

        e.preventDefault();
        Router.go('collection', {_id: this._id});
    },

    'click .pick-image': function (e) {
        var cb = function (url, param) {
            Meteor.call('updateCollection', param, {$set: {'image_url': url}});
        };
        imagePicker(cb, this._id);
    },

    'click .remove-image': function (e) {
        Meteor.call('updateCollection', this._id, {$unset: {'image_url': ''}});
    },

    'click .cedit_mode': function (e) {

        e.preventDefault();
        Session.set("cedit_mode", e.target.value);
    },

    'click .place-template-sample': function () {

        var t = $('#place-template').val();
        var p = getSamplePlace();
        var d = Handlebars.compile(t)(p);
        if(!t)
            d = "No template";
        makeBootbox(d);
    },

    'click .place-template-json': function () {

        var p = getSamplePlace();
        var d = "<pre>"+syntaxHighlight(p);
        makeBootbox(d);
    },

    'click .place-template-list-sample': function () {

        var t = $('#place-template-list').val();
        var p = getSamplePlace();
        var d = Handlebars.compile(t)(p);
        if(!t)
            d = "No template";
        makeBootbox(d);
    },

    'click .place-template-label-sample': function () {

        var t = $('#place-template-label').val();
        var p = getSamplePlace();
        var d = Handlebars.compile(t)(p);
        if(!t)
            d = "No template";
        makeBootbox(d);
    },

    'click .place-autoform-sample': function () {

        var t = $('#place-autoform').val();
        Session.set('quick_form', t);
        makeBootbox(renderTmp(Template.quick_form));
    },

    'change #flickr_link': function (e) {

        var t = e.target.value;

        Meteor.call('updateCollection', this._id, {$set: {flickr_link: t}});
    },

    'click .flickr-refresh': function(e) {

        e.preventDefault();

        var url = this.sourceUrl;
        FlickrConnector.fetch(url, undefined, function (places) {
            to_add = _.filter(places, function (p) {
                return !Map.keysToLayers[p._id];
            })
            var cid = Session.get('active_collection');
            Meteor.call('insertPlaces', to_add, cid, function(error, result) {
                if(result == 1)
                    growl.success('Added '+result+' new place');
                else
                    growl.success('Added '+result+' new places');
            }); 
        });
    },

    'click .export-go': function (e) {

        e.preventDefault();

        var cid = Session.get('active_collection');

        var method = e.altKey ? 'exportCollectionAsJson' : 'exportCollectionAsCsv';

        Meteor.call(method, cid, function (err, data) {
            if(err) {
                growl.warning(data);
            } else {
                var blob = base64toBlob(data);
                var name = MCollections.findOne(cid).name;
                saveAs(blob, name+'.zip');
            }
        });
    },

    'change #transit_name': function (e) {

        var t = e.target.value;

        Meteor.call('updateCollection', this._id, {$set: {transit_name: t}});
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

    'change #place-template-label': function (e) {

        var t = e.target.value;

        templates.place_template_label =
            Handlebars.compile(t || defaultPlaceTemplateLabel);

        Meteor.call('updateCollection', this._id, {$set: {place_template_label: t}});
    },

    'change #place-autoform': function (e) {

        var t = e.target.value;

        Meteor.call('updateCollection', this._id, {$set: {place_autoform: t}});
    },

    'change #drop-markers': function (e) {

        Meteor.call('updateCollection', this._id,
            {$set: {drop_markers: e.target.checked}});
    },

    'change #disable-geoindex': function (e) {

        Meteor.call('updateCollection', this._id,
            {$set: {disable_geoindex: e.target.checked}});
    },

    'change #enable-clustering': function (e) {

        Meteor.call('updateCollection', this._id,
            {$set: {enable_clustering: e.target.checked}});
    }
};


Template.quick_form.helpers({

    quick_form: function () {
        var qf = Session.get('quick_form');
        if(!qf) {
            console.log('no quick form spec');
            return;
        }
        var obj = eval('(' + qf + ')');
        if(!obj) {
            console.log('quick form object conversion failed');
            return;
        }
        return new SimpleSchema(obj);
    },

    placeDoc: function () {
        var pid = Session.get('active_place');
        var p = MPlaces.findOne(pid);
        if(!p) {
            return;
        }
        // this weirdness helps autoform to work
        p.properties._id = p._id;
        return p.properties;
    }
});

