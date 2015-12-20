Meteor.startup(function(){
});


Template.registerHelper('formatDate', function(date) {
    return moment(date).format('MMM Do, h:mm a');
});


Template.registerHelper('formatNumber', function(num) {
    return  numeral(num || 0).format('0,0');
});