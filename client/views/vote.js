Template.vote.helpers({

    upVoted: function () {
        var obj = type2CollectionMap[this.type].findOne(this._id);
        return obj && obj.upvoters && _.contains(obj.upvoters, Meteor.userId());
    },

    downVoted: function () {
        var obj = type2CollectionMap[this.type].findOne(this._id);
        return obj && obj.downvoters && _.contains(obj.downvoters, Meteor.userId());
    },

    notVoted: function () {
        var obj = type2CollectionMap[this.type].findOne(this._id);
        var down = obj && obj.downvoters && _.contains(obj.downvoters, Meteor.userId());
        var up = obj && obj.upvoters && _.contains(obj.upvoters, Meteor.userId());
        return !down && !up;
    }
});

Template.vote.events = {
    'click .up-vote': function(e) {

        e.preventDefault();
        Meteor.call('vote', this.type, this._id, 1);
    },

    'click .down-vote': function(e) {

        e.preventDefault();
        Meteor.call('vote', this.type, this._id, -1);
    },

    'click .un-vote': function(e) {

        e.preventDefault();
        Meteor.call('vote', this.type, this._id, 0);
    }
};
