Template.login.helpers({
	isLoggedIn: function () {
		console.log(Meteor.user());
		if(Meteor.user()) {
			// not sure if this is the best way to close, but had to go to source code
			$('#materializeModal').closeModal();
			MaterializeModal.remove();
			return true;
		}
		return false;
	}	
})