Template.quick_post.helpers({

    postRoute: function () {
        return Router.current().lookupTemplate() == "Post";
    },

    commentCount: function () {
        var c = this.comment_count || 0;
        return c + ' Comment' + (c == 1 ? '' : 's');
    }
});