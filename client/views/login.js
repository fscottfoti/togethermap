Template.login.helpers({
	isLoggedIn: function () {
		if(Meteor.user()) {
			// not sure if this is the best way to close, but had to go to source code
			//$('#materializeModal').closeModal();
			//MaterializeModal.remove();
			$.fancybox.close();
			return true;
		}
		return false;
	}	
})