Template.search.rendered = function () {

    Session.set('zoomLevel', Map.zoom());

    if(Session.get('queryString')) {
        $('#srch').val(Session.get('queryString'));
        // trigger update
        Session.set('includedRows', Session.get('includedRows'));
    }
};


Template.search.helpers({
    expertMode: function () {
        return Session.get('expertMode');
    },
    searchLoading: function () {
        return Session.get('searchState') == 'loading';
    },
    latestQuery: function () {
        return Session.get('latestCompletedQuery');
    },
    searchCompleted: function () {
        return Session.get('searchState') == 'resultsAvailable';
    },
    totalRows: function () {
        return Session.get('totalRowCount');
    },
    includedRows: function () {
        return Session.get('mapVisiblePlaces');
    },
    loadedRows: function () {
        return MPlaces.find().count();
    },
    zoomIn: function () {
        return Session.get('zoomLevel') < minFactualZoomLevel;
    },
    searchResults: function () {
        return SearchConnector.places();
    }
});


var last_search = undefined;


var search = function (val) {

    if(val == undefined)
        val = Session.get('queryString') || '';

    if(Session.get('searchState') == 'loading') {
        return;
    }

    if(val != Session.get('queryString') ||
        last_search != isFactual) {

        Session.set('queryString', val);
        // new search, clear the old search
        SearchConnector.init();
        Session.set('searchState', undefined);
    }

    Session.set('queryString', val);

    SearchConnector.getAll();
};

var searchThrottled = _.throttle(search, 500);


Template.search.events({

    'keyup input[name=srch]': function(event) {

        searchThrottled(event.target.value);
    },


    'click input[name=searchToggle]': function () {
        searchThrottled();
    }

});