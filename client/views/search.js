Template.search.rendered = function () {

    _.delay(function () {
        $('#toggle-search').bootstrapToggle();
        Session.set('search_type', "Factual");
    }, 200);

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
            return FactualConnector.places.length;
        }
    },
    zoomIn: function () {
        return Session.get('zoom_level') < minFactualZoomLevel;
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

    'click .toggle-search': function () {

        $('#toggle-search').bootstrapToggle('toggle');

        if(Session.get('search_type') == "TogetherMap") {
            Session.set('search_type', "Factual");
        } else {
            Session.set('search_type', "TogetherMap");
        }

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