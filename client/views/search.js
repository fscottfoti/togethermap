Template.search.rendered = function () {

    if(Session.get('query_string')) {
        $('#srch').val(Session.get('query_string'));
        // trigger update
        Session.set('included_rows', Session.get('included_rows'));
    }
};


Template.search.helpers({
    searchLoading: function () {
        return Session.get('search_state') == 'loading';
    },
    latestQuery: function () {
        return Session.get('latest_completed_query');
    },
    searchCompleted: function () {
        return Session.get('search_state') == 'results_available';
    },
    totalRows: function () {
        return Session.get('total_row_count');
    },
    includedRows: function () {
        return Session.get('map_visible_places');
    },
    loadedRows: function () {
        return FactualConnector.places.length;
    },
    zoomIn: function () {
        return Session.get('zoom_level') < minFactualZoomLevel;
    },
    searchResults: function () {
        return SearchConnector.places();
        // this is also a way to trigger an update of the dom
        if(Session.get('included_rows') == undefined)
            return;
        return FactualConnector.places;
    }
});

var searchFactual = function (val) {

    if(Session.get('search_state') == 'loading') {
        return;
    }

    if(val != Session.get('query_string')) {

        // new search, clear the old search
        //FactualConnector.init();
        Session.set('query_string', val);
        SearchConnector.init();
        Session.set('search_state', undefined);
    }

    Session.set('query_string', val);

    SearchConnector.getAll();
    //FactualConnector.getAll();
};
var searchFactualThrottled = _.debounce(searchFactual, 200);


Template.search.events({

    'keyup input[name=srch]': function(event) {

        searchFactualThrottled(event.target.value);
    }

});



Template.factual_place.helpers({
    activePlace: function () {
        var key = Session.get('active_place');
        if(!key)
            return;
        return _.find(FactualConnector.places, function (place) {
            return place._id == this.key;
        }, {key: key});
    }
});

Template.factual_place.events = {
};