Template.postEdit.rendered = function () {
    var that = this;
    textEditorInit(this.data.post.description, function (html) {
        var id = that.data.post._id;
        Meteor.call('updatePost', id, {$set:{'description': html}});
    });
};


Template.postEdit.events({

    'change input[name=name]': function(event) {
        Meteor.call('updatePost', this._id,
            {$set:{'title': event.target.value}});
    },

    'click .delete-link': function(e) {

        e.preventDefault();
        var that = this;
        bootbox.confirm("Are you sure you want to delete this POST?", function(result) {
            if(result) {
                var pid = that.placeId; // save it in case reactivity is fast
                Meteor.call('removePost', that._id, pid);
                Router.go('place', {
                    _cid: Session.get('active_collection'),
                    _id: pid
                });
            }
        });
    },

    'click .pick-image': function (e) {
        var cb = function (url, param) {
            Meteor.call('updatePost', param, {$set: {'image_url': url}});
        };
        imagePicker(cb, this._id);
    },

    'click .remove-image': function (e) {
        Meteor.call('updatePost', this._id, {$unset: {'image_url': ''}});
    },

    'click .cancel': function(e) {

        e.preventDefault();
        Router.go('post', {
            _cid: Session.get('active_collection'),
            _id: this._id
        });
    }
});