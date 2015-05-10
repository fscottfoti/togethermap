Template.collectionEdit.rendered = function () {
    Session.set('cedit_mode', 'Icon');
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
        MCollections.update(this._id, {$set:{name: event.target.value}});
    },

    'click .save-location': function() {
        var location = {
            center: Map.map.getCenter(),
            zoom: Map.map.getZoom()
        };

        MCollections.update(this._id, {$set:{location: location}});

        MCollections.update(this._id, {$set:{default_map: Map.activeBaseMap}});
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
                MCollections.remove(that._id);
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

    'change #place-template': function (e) {

        MCollections.update(this._id,
            {$set: {place_template: e.target.value}});
    },

    'change #place-template-list': function (e) {

        MCollections.update(this._id,
            {$set: {place_template_list: e.target.value}});
    },

    'change #drop-markers': function (e) {

        MCollections.update(this._id,
            {$set: {drop_markers: e.target.checked}});
    }
};
