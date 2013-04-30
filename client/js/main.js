Meteor.startup(function() {
	
	UserAgents.insert({str: navigator.userAgent, created: Date.now()});
	
	var after = moment().subtract('days', 1);
	
	Meteor.subscribe('agents', after.toDate(), function() {
		
		console.log('Got the agents');
		
		var agents = UserAgents.findByCreatedGreaterThan(after.toDate());
		
		agents.forEach(function(ua) {
			console.log(ua.str);
			console.log(ua.created);
		});
	});
});