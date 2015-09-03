var initColorPicker = function (domId, currentColor) {

    $(domId).spectrum({
      color: currentColor,
      showInput: false,
      className: "full-spectrum",
      showInitial: true,
      showPaletteOnly: true,
      showSelectionPalette: false,
      maxSelectionSize: 10,
      preferredFormat: "hex",
      move: function (color) {

      },
      show: function () {

      },
      beforeShow: function () {

      },
      hide: function () {

      },
      change: function() {

      },
      palette: [
          ["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)",
          "rgb(204, 204, 204)", "rgb(217, 217, 217)","rgb(255, 255, 255)"],
          ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
          "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"],
          ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)",
          "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)",
          "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)",
          "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)",
          "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)",
          "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
          "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
          "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
          "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)",
          "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
      ]
    });
};

var jqueryInit = function () {
    var place = MPlaces.findOne(Session.get('active_place'));
    initColorPicker("#shape-color", place.properties.color);
};


Template.placeEdit.rendered = function () {
    jqueryInit();
    var that = this;
    textEditorInit(this.data.place.properties.description, function (html) {
        var id = that.data.place._id
        Meteor.call('updatePlace', id, {$set:{'properties.description': html}});
    });
};


Template.placeEdit.helpers({

    isMarker: function () {
        return this.geometry.type == "Point";
    },

    isLine: function () {
        return this.geometry.type == "LineString";
    },

    icons: function () {
        var d = _.map(L.MakiMarkers.icons,
            function (v) { return {name: v} });
        d.unshift({name: ''});
        return d;
    },
    iconSelected: function() {
        return this.name === Template.parentData(1).properties.icon
            ? 'selected' : '';
    },

    icon_sizes: function () {
        return _.map(['small', 'medium', 'large'],
            function (v) { return {name: v} });
    },

    sizeSelected: function() {
        return this.name === (Template.parentData(1).properties.icon_size || 'medium')
            ? 'selected' : '';
    },

    line_widths: function () {
        return _.map([3, 6, 9, 12],
            function (v) { return {name: v} });
    },

    widthSelected: function() {
        return this.name === (Template.parentData(1).properties.weight || 9)
            ? 'selected' : '';
    },

    autoFormExists: function () {
        var cid = Session.get('active_collection');
        var c = MCollections.findOne(cid);
        if(c  && c.place_autoform) {
            Session.set('quick_form', c.place_autoform);
            return true;
        }
        return false;
    }
});


Template.placeEdit.events({

    'change input[name=name]': function(event) {
        Meteor.call('updatePlace', this._id, {$set:{'properties.name': event.target.value}});
    },

    "change #shape-color": function (evt) {

        var v = $(evt.target).val();
        Meteor.call('updatePlace', this._id, {$set: {'properties.color': v}});

    },

    "change #icons": function (evt) {

        var v = $(evt.target).val();
        Meteor.call('updatePlace', this._id, {$set: {'properties.icon': v}});

    },

    "change #icon_size": function (evt) {

        var v = $(evt.target).val();
        v = {'small': 's', 'medium': 'm', 'large': 'l'}[v];
        Meteor.call('updatePlace', this._id, {$set: {'properties.icon_size': v}});

    },

    "change #line_width": function (evt) {

        var v = $(evt.target).val();
        Meteor.call('updatePlace', this._id, {$set: {'properties.weight': v}});

    },

    'click .pick-image': function (e) {
        var cb = function (url, param) {
            Meteor.call('updatePlace', param, {$set: {'properties.image_url': url}});
        };
        imagePicker(cb, this._id);
    },

    'click .remove-image': function (e) {
        Meteor.call('updatePlace', this._id, {$unset: {'properties.image_url': ''}});
    },

    'click .delete-link': function(e) {

        e.preventDefault();
        var that = this;
        MaterializeModal.confirm({
            title: "Confirm Delete",
            message: "Are you sure you want to delete this PLACE?", 
            callback: function(result) {
            if(result) {
                Meteor.call('removePlace', that._id, that.collectionId);
                Router.go('collection', {
                    _id: Session.get('active_collection')
                });
            }
        }});
    },

    'click .cancel': function(e) {

        e.preventDefault();
        Router.go('place', {
            _cid: Session.get('active_collection'),
            _id: this._id
        });
    },

    'click .show-json': function () {

        var d = "<pre>"+syntaxHighlight(this);
        makeModal(d);
    },
});