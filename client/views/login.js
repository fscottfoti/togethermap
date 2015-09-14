Template.login.helpers({
	isLoggedIn: function () {
		if(Meteor.user()) {
			$.fancybox.close();
			return true;
		}
		return false;
	}	
})