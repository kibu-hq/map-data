// Set up dimensions and margins
const width = 960;
const height = 500;

// Create SVG
const svg = d3.select("#map")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("width", "100%")
    .style("height", "auto");

// Create projection
const projection = d3.geoAlbersUsa()
    .scale(1000)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Tooltip
const tooltip = d3.select("#tooltip");

// State name mapping
const stateNames = {
    "01": "Alabama", "02": "Alaska", "04": "Arizona", "05": "Arkansas", "06": "California",
    "08": "Colorado", "09": "Connecticut", "10": "Delaware", "11": "District of Columbia",
    "12": "Florida", "13": "Georgia", "15": "Hawaii", "16": "Idaho", "17": "Illinois",
    "18": "Indiana", "19": "Iowa", "20": "Kansas", "21": "Kentucky", "22": "Louisiana",
    "23": "Maine", "24": "Maryland", "25": "Massachusetts", "26": "Michigan", "27": "Minnesota",
    "28": "Mississippi", "29": "Missouri", "30": "Montana", "31": "Nebraska", "32": "Nevada",
    "33": "New Hampshire", "34": "New Jersey", "35": "New Mexico", "36": "New York",
    "37": "North Carolina", "38": "North Dakota", "39": "Ohio", "40": "Oklahoma",
    "41": "Oregon", "42": "Pennsylvania", "44": "Rhode Island", "45": "South Carolina",
    "46": "South Dakota", "47": "Tennessee", "48": "Texas", "49": "Utah", "50": "Vermont",
    "51": "Virginia", "53": "Washington", "54": "West Virginia", "55": "Wisconsin", "56": "Wyoming"
};

// State abbreviation to name mapping
const stateAbbrevToName = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
    "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "DC": "District of Columbia",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois",
    "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana",
    "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota",
    "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
    "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming"
};

// Customer data storage
let customerData = [];
let stateCounts = {};

// Add customer pins to the map using actual lat/lng coordinates
function addCustomerPins() {
    // Filter customers that have valid lat/lng coordinates
    const validCustomers = customerData.filter(d => 
        d.lat !== null && 
        d.lng !== null && 
        d.lat !== undefined && 
        d.lng !== undefined &&
        !isNaN(d.lat) && 
        !isNaN(d.lng)
    );
    
    console.log(`Adding ${validCustomers.length} customer pins with valid coordinates`);
    
    // Add customer pins using actual coordinates
    svg.selectAll(".customer-pin")
        .data(validCustomers)
        .enter().append("circle")
        .attr("class", "customer-pin")
        .attr("cx", d => {
            const projected = projection([d.lng, d.lat]);
            return projected ? projected[0] : 0;
        })
        .attr("cy", d => {
            const projected = projection([d.lng, d.lat]);
            return projected ? projected[1] : 0;
        })
        .attr("r", 4)
        .attr("fill", "#ef4444")
        .attr("stroke", "#ffffff")
        .attr("stroke-width", 1.5)
        .style("opacity", 0.8)
        .style("pointer-events", "none");
}

// Load customer data
async function loadCustomerData() {
    try {
        const response = await fetch('./map.json');
        const data = await response.json();
        
        customerData = data;
        
        // Calculate state counts
        stateCounts = customerData.reduce((counts, customer) => {
            if (customer.state) {
                counts[customer.state] = (counts[customer.state] || 0) + 1;
            }
            return counts;
        }, {});
        
        // Add customer pins to map
        addCustomerPins();
        
    } catch (error) {
        console.error('Error loading customer data:', error);
    }
}

// Load US map data
d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json").then(function(us) {
    // Draw states
    svg.append("g")
        .attr("class", "states")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "states")
        .on("mouseover", function(event, d) {
            const stateName = stateNames[d.id] || "Unknown";
            const stateAbbrev = Object.keys(stateAbbrevToName).find(key => 
                stateAbbrevToName[key] === stateName
            );
            const count = stateCounts[stateAbbrev] || 0;
            
            tooltip
                .style("opacity", 1)
                .html(`<strong>${stateName}</strong><br/>${count} customer${count !== 1 ? 's' : ''}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        })
        .on("click", function(event, d) {
            const stateName = stateNames[d.id] || "Unknown";
            const stateAbbrev = Object.keys(stateAbbrevToName).find(key => 
                stateAbbrevToName[key] === stateName
            );
            const count = stateCounts[stateAbbrev] || 0;
            
            // Highlight selected state
            d3.selectAll(".states").style("fill", "#e5e7eb");
            d3.select(this).style("fill", "#3b82f6");
            
            // Optional: Emit custom event for parent frame
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'stateSelected',
                    state: stateName,
                    stateId: d.id,
                    customerCount: count
                }, '*');
            }
        });
    
    // Draw state borders
    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr("class", "state-borders")
        .attr("d", path);
    
    // Load customer data after map is ready
    loadCustomerData();
});
