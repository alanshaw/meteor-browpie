var now = moment();

// The time periods that our pie charts will show
var pies = [
	now.subtract(1, 'hour'),
	now.subtract(1, 'day'),
	now.subtract(1, 'month'),
	now.subtract(1, 'year')
];

// Agent groupings
var AgentGroup = {
	IEMobile: 'IE Mobile',
	IE: 'IE',
	OperaMini: 'Opera Mini',
	Opera: 'Opera',
	Chrome: 'Chrome',
	MobileSafari: 'Mobile Safari',
	Safari: 'Safari',
	Firefox: 'Firefox',
	Other: 'Other'
};

// Converts a user agent string into an agent group
function groupAgent(agent) {
	
	if(agent.indexOf('Chrome') != -1) {
		return AgentGroup.Chrome;
	} else if(agent.indexOf('Firefox') != -1) {
		return AgentGroup.Firefox;
	} else if(agent.indexOf('Opera Mini') != -1) {
		return AgentGroup.OperaMini;
	} else if(agent.indexOf('Opera') != -1) {
		return AgentGroup.Opera;
	} else if(agent.indexOf('Mobile Safari') != -1) {
		return AgentGroup.MobileSafari;
	} else if(agent.indexOf('Safari') != -1) {
		return AgentGroup.Safari;
	} else if(agent.indexOf('IE Mobile') != -1) {
		return AgentGroup.IEMobile;
	} else if(agent.indexOf('IE') != -1) {
		return AgentGroup.IE;
	}
	return AgentGroup.Other;
}

Meteor.startup(function() {
	
	UserAgents.insert({str: navigator.userAgent, created: moment().toDate()});
	
	var pie = 0;
	var subscriptons = [];
	
	(function chunkedSubscribe() {
		
		subscriptons.push(
			Meteor.subscribe('agents', pies[pie].toDate(), function() {
				if(pie == pies.length - 1) return;
				
				console.log('Got agents after', pies[pie].toDate());
				
				pie++;
				
				chunkedSubscribe();
				
				// Remove the previous subscription
				if(subscriptons.length) {
					subscriptons.shift().stop();
				}
			})
		);
		
	})();
	
	// Do some d3 when the UserAgents collection changes.
	Deps.autorun(renderPies);
});

function renderPies() {
	
	var agents = UserAgents.findByCreatedGreaterThan(pies[0].toDate());
	var data = pieData(agents);
	
	var width = 960,
		height = 500,
		radius = Math.min(width, height) / 2;
	
	var color = d3.scale.linear()
		.domain([1, d3.max(data, function(d) {return d.count;})])
		.range(["#98abc5", "#ff8c00"]);
	
	var arc = d3.svg.arc()
		.outerRadius(radius - 10)
		.innerRadius(0);
	
	var pie = d3.layout.pie()
		.sort(null)
		.value(function(d) { return d.count; });
	
	var svg = d3.select("svg > g");
	
	if(svg.empty()) {
		svg = d3.select("body").append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
	}
	
	var slice = svg.selectAll(".arc").data(pie(data), function(d) { return d.data.name; });
	
	var sliceEnter = slice.enter()
		.append("g")
		.attr("class", "arc");
	
	sliceEnter.append("path")
		.style("fill", function(d) { return groupColour(d.data.name); });
	
	sliceEnter.append("text")
		.attr("dy", ".35em")
		.style("text-anchor", "middle")
		.text(function(d) { return d.data.name; });
	
	var sliceUpdate = slice.transition();
	
	sliceUpdate.select('path')
		.attr("d", arc);
	
	sliceUpdate.select("text")
		.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; });
}

// Convert a bunch of agents into data for a pie chart
function pieData(agents) {
	var agentMap = {};
	
	// Count the grouped agents
	agents.forEach(function(agent) {
		var group = groupAgent(agent.str);
		agentMap[group] = agentMap[group] ? agentMap[group] + 1 : 1;
	});
	
	// Convert to array
	return Object.keys(agentMap).map(function(groupName) {
		return {name: groupName, count: agentMap[groupName]};
	});
}

function groupColour(group) {
	switch(group) {
		case AgentGroup.IEMobile: return '#000';
		case AgentGroup.IE: return '#000';
		case AgentGroup.OperaMini: return '#990000';
		case AgentGroup.Opera: return '#CC0F16';
		case AgentGroup.Chrome: return '#E0EDF5';
		case AgentGroup.MobileSafari: return '#000';
		case AgentGroup.Safari: return '#000';
		case AgentGroup.Firefox: return '#DE730C';
		default: return '#000'; 
	}
	
}

