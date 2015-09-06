Template.copy.helpers({
	checkFirst: function () {
		return this.isFirst ? "checked" : "";
	},

	getId: function () {
		return this.cid || this._id;
	},

	myCollections: function () {
        var mine = MCollections.find(userIdExpression(Meteor.user())).fetch();
        var followed = MFollowed.find().fetch();

        // this is a big awkward but needs to be transferred somehow
	    var places = Session.get('allPlaceInstances') || [];       

        var docs = _.filter(mine.concat(followed), function (c) {
            var cid = c.cid || c._id; // can be followed or owned

            var c_obj = MCollections.findOne(cid);
            var p = MPermissions.findOne(cid);
            if(!c_obj) // this happens because you might not have read permission anymore
                return false;
            if(c_obj && c_obj.place_write_private == true && p && p.placeWriter == false && p.owner == false)
                return false;

            var i = _.indexOf(places, cid);
            // if i is defined we don't want to show the collection id again
            return i === -1;
        });
        var docs = _.sortBy(docs, function(doc) {return doc.name;});
        docs[0].isFirst = true;
        return docs;
    }
});

Template.copy.events = {

	'click .do-cancel': function (e) {
		$.fancybox.close();
	},

    'click .do-copy': function (e) {

        // the collection can come from either the set of followed collections
        // in which case we need the cid attribute, or the set of owner
        // collection in which case we need the id attribute - this expression
        // should cover it
        var cid = $('input[name=collectionId]:checked').val();
        var id = Session.get('active_place');
        var p = MPlaces.findOne(id); //Template.parentData().place;
        p = JSON.parse(JSON.stringify(p));
        p.post_count = 0;
        if(!p.parent_id) {
            // leave it if it's already on there so it points back to the original
            p.parent_id = p._id;
        }
        delete p._id;
        Meteor.call('insertPlace', p, cid, function(err, data) {
            if (err) {
                console.log(err);
                growl.success("Copy failed");
                return;
            }
            growl.success("Copy successful");

            Router.go('place', {
                _id: data,
                _cid: cid
            })
            $.fancybox.close();
        });

    },
};