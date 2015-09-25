var jqueryInit = function () {
    textEditorInit('', function (html) {
        Session.set('current_html', html);
    });
}


Template.place.rendered = function () {
    Session.set('current_html', '');
    jqueryInit();
    $('.dropdown-button').dropdown();
};


Template.place.helpers({

    writePermission: function () {
        var cid = Session.get('active_collection');
        return writePermission(this, cid, Meteor.user());
    },

    dateField: function () {
        return this.createDate || this.properties.createDate;
    },

    dynamicPlace: function () {
        // compiled when we change the collection for performance
        if(templates.place_template_list) {
            return templates.place_template(this);
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

    noNav: function () {
        return Session.get('noNav');
    },

    noPosts: function () {
        // doesn't count if place isn't loaded
        return this.posts.count() == 0 && this.place;
    },

    postPermission: function () {
        var cid = Session.get("active_collection");
        return writePermission(undefined, cid, Meteor.user(), "post");
    },

    collectionName: function () {
        return MCollections.findOne(this.collectionId).name;
    },

    isThisCollection: function () {
        return this.collectionId == Session.get('active_collection');
    },

    anyPlaceInstances: function () {
        return this.allPlaceInstances.fetch().length > 1;
    },

    post_image_url: function () {
        return Session.get('post_image_url');
    }
});


Template.place.events = {

    'click .login': function (e) {

        e.preventDefault();
        $.fancybox( renderTmp(Template.login) );
    },

    'click .open-copy': function () {
        var places = Template.parentData().allPlaceInstances.fetch();
        var i = _.map(places, function (p) {
            return p.collectionId;
        });
        Session.set('allPlaceInstances', i);

        // need to get and add the place since the copy modal doesn't
        // have access to this state
        var p = Template.parentData().place;
        p = JSON.parse(JSON.stringify(p));
        Session.set('placeToCopy', p);

        if ($('#copyForm').length) {
            // I don't know why this happens, but apparently using the fancybox
            // modal, the dom still exists from the last time you opened the 
            // modal, which means the ids on the radio buttons are duplicates
            // and you can't click on them - anyway, this is hacky fix for now
            $('#copyForm').remove();
        }

        $.fancybox( renderTmp(Template.copy) );
    },

    'click .pan-map': function () {

        Map.goToPlace(this);

        if(mobileFormFactor) {
            Map.sidebar.toggle();
        }
    },

    'click .profile-go': function (e) {

        e.preventDefault();
        Router.go('profile', {_id: this.creatorUID});
    },

    'click .read-more': function (e) {

        e.preventDefault();
        Router.go('post', {
            _id: this._id,
            _cid: this.collectionId
        });
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
            _cid: Session.get('active_collection'),
            _id: this._id
        });
    },

    'click .new-topic': function (e) {

        e.preventDefault();
        Session.set('newTopic', true);
        Meteor.defer(function() {
            jqueryInit();
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

        e.preventDefault();

        var pid = Session.get('active_place');
        var cid = Session.get('active_collection');
        var title = $( "#title" ).val();

        var html = Session.get('current_html');

        if(!title || title.trim().length == 0) {
            growl.warning("Need to enter a post title.");
            return;
        }

        if(html.length > 2000) {
            growl.error("Topic too long (maybe you pasted an image?");
            return;
        }

        Meteor.call('insertPost', {
            title: title,
            description: html,
            image_url: Session.get('post_image_url')
        }, pid, cid);

        Session.set('newTopic', false);
        Session.set('post_image_url', undefined);
        Session.set('current_html', '');
    },

    'click .cancel': function (e) {

        e.preventDefault();
        Session.set('newTopic', false);

    }
};