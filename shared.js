UserAgents = new Meteor.Collection('agents');

UserAgents.allow({
	insert: function() {
		return true;
	}
});

UserAgents.findByCreatedGreaterThan = function(after) {
	return UserAgents.find({created: {$gt: after}}, {sort: [['created', 'desc']]});
};