Meteor.startup(function() {
	Meteor.publish('agents', UserAgents.findByCreatedGreaterThan);
});