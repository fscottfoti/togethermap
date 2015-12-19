var jqueryInit = function () {
    textEditorInit('', function (html) {
        Session.set('currentHtml', html);
    });
}


Template.place.rendered = function () {
    Session.set('currentHtml', '');
    jqueryInit();
    $('.tooltipped').tooltip();
};


Template.place.helpers({

    writePermission: function () {
        var cid = Session.get('activeCollection');
        return writePermission(this, cid, Meteor.user());
    },

    dateField: function () {
        return this.createDate || this.properties.createDate;
    },

    dynamicPlace: function () {

        Meteor.defer(function() {
            $('.tooltipped').tooltip();
        });
        
        // compiled when we change the collection for performance
        if(templates.placeTemplateList) {
            return templates.placeTemplate(this);
        } else {
            return Handlebars.compile(defaultPlaceTemplate)(this);
        }
    },

    creator: function () {
        return this.creator || this.properties.creator;
    },

    newTopic: function () {
        return Session.get('newTopic');
    },

    enableThumbsVoting: function () {
        return MCollections.findOne(this.collectionId).enable_thumbs_voting;
    },

    noNav: function () {
        return Session.get('noNav');
    },

    noComments: function () {
        // doesn't count if place isn't loaded
        return this.comments.count() == 0 && this.place;
    },

    expertMode: function () {
        return Session.get('expertMode');
    },

    postPermission: function () {
        var cid = Session.get("activeCollection");
        return writePermission(undefined, cid, Meteor.user(), "post");
    },

    collectionName: function () {
        return MCollections.findOne(this.collectionId).name;
    },

    isThisCollection: function () {
        return this.collectionId == Session.get('activeCollection');
    },

    autoFormExists: function () {
        var cid = Session.get('activeCollection');
        var c = MCollections.findOne(cid);

        if(c  && c.place_autoform) {
            Session.set('quick_form', c.place_autoform);
            return true;
        }
        return false;
    }
});


Template.place.events = {

    'click .open-qf': function (evt) {
        var html = renderTmp(Template.quick_form);
        //$(html).find('select').addClass('browser-default');
        $.fancybox( html );
    },

    'click .login': function (e) {

        e.preventDefault();
        $.fancybox( renderTmp(Template.login) );
    },

    'click .pan-map': function () {

        Map.goToPlace(this);

        if(mobileFormFactor) {
            Map.sidebar.toggle();
        }
    },

    'click .collection-go': function (e) {

        e.preventDefault();
        Router.go('collection', {
            _id: this.collectionId
        });
    },

    'click .place-go': function (e) {

        e.preventDefault();
        Router.go('place', {
            _id: this._id,
            _cid: this.collectionId
        });
    },

    'click .lightbox-image': function (e) {

        e.preventDefault();
        var size = e.altKey ? 'large' : null;
        var src = $(e.target).attr('src');
        var link = $(e.target).attr('link');
        var t = '<div><a href="'+link+'"><img src="' + src + '" style="width: 100%"></a></div>';
        makeModal(t, size);      
    },

    'click .edit-link': function (e) {

        e.preventDefault();
        Router.go('place_edit', {
            _cid: Session.get('activeCollection'),
            _id: this._id
        });
    },

    'click .new-topic': function (e) {

        e.preventDefault();
        Session.set('newTopic', true);
        $('.tooltipped').tooltip('remove');
        Meteor.defer(function() {
            jqueryInit();
            $('.tooltipped').tooltip();
        });

    },

    'click .pick-image': function (e) {
        var cb = function (url, param) {
            console.log(url);
            Session.set('post_image_url', url);
        };
        imagePicker(cb, this);
    },

    'click .remove-image': function (e) {
        Session.set('post_image_url', undefined);
    },

    'click .add-topic': function (e) {

        $('.tooltipped').tooltip('remove');
        
        e.preventDefault();

        var pid = Session.get('active_place');
        var cid = Session.get('activeCollection');
        var title = $( "#title" ).val();

        if(!title || title.trim().length == 0) {
            growl.warning("Need to enter a comment.");
            return;
        }

        Meteor.call('insertComment', {
            text: title
        }, pid, cid);

        Session.set('newTopic', false);

        Meteor.defer(function() {
            $('.tooltipped').tooltip();
        });
    },

    'click .cancel': function (e) {

        $('.tooltipped').tooltip('remove');
        e.preventDefault();
        Session.set('newTopic', false);
        Meteor.defer(function() {
            $('.tooltipped').tooltip();
        });

    }
};