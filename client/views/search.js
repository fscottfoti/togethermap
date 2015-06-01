Template.search.rendered = function () {
};


Template.search.helpers({
    searchLoading: function () {
        return Session.get('search_state') == 'loading';
    },
    searchCompleted: function () {
        return Session.get('search_state') == 'results_available';
    },
    totalRows: function () {
        return Session.get('total_row_count');
    },
    includedRows: function () {
        return Session.get('included_rows');
    },
    searchResults: function () {
        // this is also a way to trigger an update of the dom
        if(Session.get('included_rows') == undefined)
            return;
        return FactualConnector.places;
    }
});

var searchFactual = function () {
    FactualConnector.init();
    FactualConnector.places = [];
    Session.set('search_state', undefined);
    FactualConnector.getAll();
};
var searchFactualThrottled = _.debounce(searchFactual, 200);


Template.search.events({
    'keyup input[name=srch]': function(event) {
        Session.set('factual_query', event.target.value);
        searchFactualThrottled();
    }
});

/*

allow clicking on and linking to place

use custom place template for quick_place

successive pages

add feature to not remove place if it appears in the next search

 */