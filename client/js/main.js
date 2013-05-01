Meteor.startup(function() {
	
	UserAgents.insert({str: navigator.userAgent, created: moment().toDate()});
	
	var after = moment().subtract('days', 1);
	
	Meteor.subscribe('agents', after.toDate(), function() {
		
		var agents = UserAgents.findByCreatedGreaterThan(after.toDate());
		
		agents.forEach(function(ua) {
			console.log(ua.str);
			console.log(ua.created);
		});
	});
});