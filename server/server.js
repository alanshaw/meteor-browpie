Meteor.publish('agents', function(after) {
	return UserAgents.findByCreatedGreaterThan(after);
});