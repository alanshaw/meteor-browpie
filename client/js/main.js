// The time periods that our pie charts will show
var periods = ['hour', 'day', 'month', 'year'];

function getBoundaries() {
	return periods.map(function(period) {
		return moment().subtract(1, period);
	});
}

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

Meteor.startup(function() {
	
	UserAgents.insert({str: navigator.userAgent, created: moment().toDate()});
	
	var boundaries = getBoundaries();
	
	Meteor.subscribe('agents', boundaries[boundaries.length - 1].toDate());
	
	// Do some d3 when the UserAgents collection changes.
	Deps.autorun(debounceRenderPies);
	
	// Do some d3 when some time has elapsed
	Meteor.setInterval(debounceRenderPies, 30000);
});

var debounceRenderPies = (function() {
	var scheduled = false;
	return function() {
		console.log('User agents count', UserAgents.find({}).fetch().length);
		if (!scheduled) {
			scheduled = true;
			Meteor.setTimeout(function() {
				scheduled = false;
				renderPies();
			}, 500);
		}
	};
})();

function renderPies() {
	
	console.log("renderPies @ " + (new Date));
	
	getBoundaries().forEach(function(boundary, i) {
		
		var agents = UserAgents.findByCreatedGreaterThan(boundary.toDate());
		
		if(!agents.count()) {
			return;
		}
		
		var data = pieData(agents);
		
		var pieDim = Math.min(document.getElementById(periods[i]).clientWidth, 500),
			radius = pieDim / 2;
		
		var arc = d3.svg.arc()
			.outerRadius(radius - 10)
			.innerRadius(0);
		
		var pie = d3.layout.pie()
			.sort(null)
			.value(function(d) { return d.count; });
		
		var svg = d3.select('#'+ periods[i] + ' svg > g');
		
		if(svg.empty()) {
			svg = d3.select('#' + periods[i]).append("svg")
				.attr("width", pieDim)
				.attr("height", pieDim)
				.append("g")
				.attr("transform", "translate(" + radius + "," + radius + ")");
		}
		
		var slice = svg.selectAll(".arc").data(pie(data), function(d) { return d.data.name; });
		
		var sliceEnter = slice.enter()
			.append("g")
			.attr("class", "arc");
		
		sliceEnter.append("path")
			.style("fill", function(d) { return d.data.colour; })
			.style('stroke', '#fff')
			.style('stroke-width', 0.02 * pieDim)
			.style('stroke-linejoin', 'bevel');
		
		var imageDim = 0.14 * pieDim;
		
		sliceEnter.append('image')
			.attr('xlink:href', function(d) { return d.data.image; })
			.attr('preserveAspectRatio', 'none')
			.attr('width', imageDim)
			.attr('height', imageDim);
		
		var sliceUpdate = slice.transition();
		
		sliceUpdate.select('path')
			.attr("d", arc);
		
		sliceUpdate.select("image")
			.attr("transform", function(d) {
				var centroid = arc.centroid(d);
				return "translate(" + (centroid[0] - (imageDim / 2)) + ',' + (centroid[1] - (imageDim / 2)) + ")";
			});
		
		slice.exit().remove();
	});
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
		return {
			name: groupName,
			count: agentMap[groupName],
			colour: groupColour(groupName),
			image: '/img/browser-logos/' + groupImage(groupName) + '.png'
		};
	});
}

// Converts a user agent string into an agent group
function groupAgent(agent) {
	
	if(agent.indexOf('Chrome') != -1) {
		return AgentGroup.Chrome;
	} else if(agent.indexOf('Firefox') != -1) {
		return AgentGroup.Firefox;
	} else if(agent.indexOf('Opera') != -1) {
		return AgentGroup.Opera;
	} else if(agent.indexOf('Safari') != -1 && agent.indexOf('Mobile') != -1) {
		return AgentGroup.MobileSafari;
	} else if(agent.indexOf('Safari') != -1) {
		return AgentGroup.Safari;
	// Group the UIWebView browsers in apps as Mobile Safari
	} else if(agent.indexOf('iPhone') != -1 || agent.indexOf('iPad') != -1) {
		return AgentGroup.MobileSafari;
	} else if(agent.indexOf('IE Mobile') != -1) {
		return AgentGroup.IEMobile;
	} else if(agent.indexOf('IE') != -1 || agent.indexOf('Trident') != -1) {
		return AgentGroup.IE;
	}
	return AgentGroup.Other;
}

// Converts a group name into a colour
function groupColour(group) {
	switch(group) {
		case AgentGroup.IEMobile: return '#194371';
		case AgentGroup.IE: return '#194371';
		case AgentGroup.Opera: return '#CC0F16';
		case AgentGroup.Chrome: return '#4db849';
		case AgentGroup.MobileSafari: return '#3b98d5';
		case AgentGroup.Safari: return '#3b98d5';
		case AgentGroup.Firefox: return '#dd7210';
		default: return '#000'; 
	}
}

// Converts a group name into an image name
function groupImage(group) {
	switch(group) {
		case AgentGroup.IEMobile: return 'ie10';
		case AgentGroup.IE: return 'ie8-700';
		case AgentGroup.Opera: return 'opera';
		case AgentGroup.Chrome: return 'chrome';
		case AgentGroup.MobileSafari: return 'mobile-safari';
		case AgentGroup.Safari: return 'safari';
		case AgentGroup.Firefox: return 'firefox';
		default: return 'other'; 
	}
}

