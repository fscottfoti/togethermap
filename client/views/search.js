Template.search.helpers({
    addToMap: function () {
        Map.addShape(this, this._id);
    }
});