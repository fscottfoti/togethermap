var jqueryInit = function (id) {
    initFroala(function (html) {
        MPosts.update(id, {$set:{'description': html}});
    });
};


Template.postEdit.rendered = function () {
    jqueryInit(this.data._id);
};


Template.postEdit.events({

    'change input[name=name]': function(event) {
        MPosts.update(this._id, {$set:{'title': event.target.value}});
    },

    'click .delete-link': function(e) {

        e.preventDefault();
        var that = this;
        bootbox.confirm("Are you sure?", function(result) {
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

    'click .cancel': function(e) {

        e.preventDefault();
        Router.go('post', {
            _cid: Session.get('active_collection'),
            _id: this._id
        });
    }
});