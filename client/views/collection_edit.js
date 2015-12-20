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
    }
});


Template.collectionEdit.events = {

    'change input[name=name]':function(event) {
        MCollections.update(this._id, {$set:{name: event.target.value}});
    },

    'click .save-location':function() {
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
        bootbox.confirm("Are you sure?", function(result) {
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

    'change #place_template': function (e) {

        console.log(e.target.value);
        MCollections.update(this._id, {$set: {place_template: e.target.value}});
    }
};
