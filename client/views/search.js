Template.search.rendered = function () {

    Session.set('zoom_level', Map.zoom());

    Session.set('search_type', "Factual");

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
    factualSearch: function () {
        return Session.get('search_type') == "Factual";
    },
    loadedRows: function () {
        if(Session.get('search_type') == "TogetherMap") {
            return MPlaces.find().count();
        } else {
            return FactualConnector.places ? FactualConnector.places.length : 0;
        }
    },
    zoomIn: function () {
        var z = Session.get('zoom_level') < minFactualZoomLevel;
        if(!z) {
            Session.set('search_type', "Factual");
        }
        return z;
    },
    searchResults: function () {
        if(Session.get('search_type') == "TogetherMap") {
            return SearchConnector.places();
        } else {
            // this is also a way to trigger an update of the dom
            if (Session.get('included_rows') == undefined)
                return;
            return FactualConnector.places;
        }
    }
});

var last_search = undefined;

var searchFactual = function (val) {

    if(val == undefined)
        val = Session.get('query_string') || '';

    var isFactual = Session.get('search_type') == "Factual";

    if(Session.get('search_state') == 'loading') {
        return;
    }

    if(val != Session.get('query_string') ||
        last_search != isFactual) {

        Session.set('query_string', val);
        // new search, clear the old search
        if(isFactual) {
            FactualConnector.init();
        } else {
            SearchConnector.init();
        }
        Session.set('search_state', undefined);
    }

    Session.set('query_string', val);

    if(isFactual) {
        FactualConnector.getAll();
    } else {
        SearchConnector.getAll();
    }

};
var searchFactualThrottled = _.throttle(searchFactual, 500);


Template.search.events({

    'keyup input[name=srch]': function(event) {

        searchFactualThrottled(event.target.value);
    },


    'click input[name=searchToggle]': function () {

        var v = $('input[name=searchToggle]:checked').val();

        Session.set('search_type', v);

        searchFactualThrottled();
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