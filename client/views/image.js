Template.image.events({

    'click .lightbox-img': function (e) {

        e.preventDefault();
        var size = e.altKey ? 'large' : null;
        var src = $(e.target).attr('src');
        var t = '<div><img src="' + src + '" style="width: 100%"></div>';
        makeBootbox(t, size);
    },

    'click .link-img': function (e) {

        e.preventDefault();

        if(this.collectionId && this.placeId) {
	        return Router.go('place', {
	            _id: this.placeId,
	            _cid: this.collectionId
	        });
		}

        if(this.collectionId && this.postId) {
            return Router.go('post', {
                _id: this.postId,
                _cid: this.collectionId
            });
        }

        if(this.collectionId) {
            return Router.go('collection', {_id: this.collectionId});
        }
    },
});