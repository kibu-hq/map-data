// Set up dimensions and margins
const width = 960;
const height = 500;

// Track original SVG dimensions for proper scaling
let originalViewBox = null;

// State emoji mapping for visual appeal
const stateEmojis = {
    "Alabama": "🏈", "Alaska": "🐻", "Arizona": "🌵", "Arkansas": "💎", "California": "🌴",
    "Colorado": "🏔️", "Connecticut": "🍂", "Delaware": "🏖️", "District of Columbia": "🏛️",
    "Florida": "🐊", "Georgia": "🍑", "Hawaii": "🌺", "Idaho": "🥔", "Illinois": "🌽",
    "Indiana": "🏁", "Iowa": "🌾", "Kansas": "🌪️", "Kentucky": "🐎", "Louisiana": "🎷",
    "Maine": "🦞", "Maryland": "🦀", "Massachusetts": "⚓", "Michigan": "🚗", "Minnesota": "❄️",
    "Mississippi": "🎵", "Missouri": "🎯", "Montana": "🦬", "Nebraska": "🌽", "Nevada": "🎰",
    "New Hampshire": "🍁", "New Jersey": "🏖️", "New Mexico": "🌶️", "New York": "🗽",
    "North Carolina": "🏀", "North Dakota": "🛢️", "Ohio": "🏭", "Oklahoma": "🛢️",
    "Oregon": "🌲", "Pennsylvania": "🔔", "Rhode Island": "⛵", "South Carolina": "🌴",
    "South Dakota": "🗿", "Tennessee": "🎸", "Texas": "🤠", "Utah": "🏜️", "Vermont": "🍁",
    "Virginia": "🏛️", "Washington": "🍎", "West Virginia": "⛰️", "Wisconsin": "🧀", "Wyoming": "🦌"
};

// Function to get customer stories for a state from actual data
function getCustomerStoriesForState(stateName) {
    const stateAbbrev = Object.keys(stateAbbrevToName).find(key => 
        stateAbbrevToName[key] === stateName
    );
    
    if (!stateAbbrev) return [];
    
    // Get customers with blog URLs for this state
    const customersWithBlogs = customerData.filter(customer => 
        customer.state === stateAbbrev && customer.blog_url
    );
    
    // Extract blog titles from URLs and create story objects
    return customersWithBlogs.map(customer => {
        const urlParts = customer.blog_url.split('/');
        const slug = urlParts[urlParts.length - 1];
        const title = slug.replace(/-/g, ' ')
            .replace(/customer stories /i, '')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        return {
            title: title,
            description: "Read about how this organization uses Kibu.",
            url: customer.blog_url
        };
    });
}

// State info panel functionality
class StateInfoPanel {
    constructor() {
        this.panel = document.getElementById('state-info-panel');
        this.closeBtn = document.getElementById('close-panel');
        this.mapContainer = document.getElementById('map');
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.closeBtn.addEventListener('click', () => this.hide());
        
        // Close panel when clicking outside
        document.addEventListener('click', (event) => {
            if (this.panel.classList.contains('visible') && 
                !this.panel.contains(event.target) && 
                !event.target.closest('.states') && 
                !event.target.closest('.callout-label')) {
                this.hide();
            }
        });

        // Close panel with Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.panel.classList.contains('visible')) {
                this.hide();
            }
        });
    }

    show(stateName, customerCount) {
        // Update panel content
        this.updateContent(stateName, customerCount);
        
        // Animate map to make room for panel
        this.mapContainer.classList.add('panel-active');
        
        // Adjust SVG viewBox to fit better in reduced space
        const svgElement = svg.node();
        if (!originalViewBox) {
            originalViewBox = svgElement.getAttribute('viewBox');
        }
        
        // Show panel with animation
        this.panel.classList.remove('hidden');
        this.panel.classList.add('visible');
    }

    hide() {
        this.panel.classList.remove('visible');
        this.panel.classList.add('hidden');
        
        // Animate map back to full size
        this.mapContainer.classList.remove('panel-active');
        
        // Restore original viewBox
        if (originalViewBox) {
            svg.node().setAttribute('viewBox', originalViewBox);
        }
        
        // Clear selected state and reset colors
        selectedStateId = null;
        updateStateColors();
    }

    updateContent(stateName, customerCount) {
        // Update state emoji and name
        const stateEmoji = this.panel.querySelector('.state-emoji');
        const stateNameEl = this.panel.querySelector('.state-name');
        const countNumber = this.panel.querySelector('.count-number');
        
        stateEmoji.textContent = stateEmojis[stateName] || '🏛️';
        stateNameEl.textContent = stateName;
        countNumber.textContent = customerCount;

        // Update customer stories
        this.updateCustomerStories(stateName);
        
        // Update blog links
        this.updateBlogLinks(stateName);
    }

    updateCustomerStories(stateName) {
        const storiesList = this.panel.querySelector('.stories-list');
        const stories = getCustomerStoriesForState(stateName);

        if (stories.length === 0) {
            storiesList.innerHTML = '<div class="empty-state">No customer stories available for this state yet.</div>';
            return;
        }

        storiesList.innerHTML = stories.map(story => `
            <a href="${story.url}" class="story-item" target="_blank" rel="noopener noreferrer">
                <h4 class="story-title">${story.title}</h4>
                <p class="story-description">${story.description}</p>
            </a>
        `).join('');
    }

    updateBlogLinks(stateName) {
        // Hide the blog links section since we're now showing real customer stories
        const resourcesSection = this.panel.querySelector('.resources-section');
        resourcesSection.style.display = 'none';
    }
}

// Initialize the state info panel
const stateInfoPanel = new StateInfoPanel();

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

// Configuration for small East Coast states that need callout labels
const smallStatesConfig = [
    { id: "25", abbrev: "MA", name: "Massachusetts", labelOffset: { x: 60, y: -45 } },
    { id: "44", abbrev: "RI", name: "Rhode Island", labelOffset: { x: 62, y: -20 } },
    { id: "09", abbrev: "CT", name: "Connecticut", labelOffset: { x: 65, y: 10 } },
    { id: "34", abbrev: "NJ", name: "New Jersey", labelOffset: { x: 75, y: 15 } },
    { id: "10", abbrev: "DE", name: "Delaware", labelOffset: { x: 55, y: 22 } },
    { id: "24", abbrev: "MD", name: "Maryland", labelOffset: { x: 65, y: 49 } },
    { id: "11", abbrev: "DC", name: "District of Columbia", labelOffset: { x: 60, y: 75 } }
];

// Configuration for tooltip and hover behavior
const tooltipConfig = {
    offset: {
        default: { x: 10, y: -10 },
        callout: { x: -120, y: -10 }
    },
    colors: {
        primary: "#328CFF",
        hover: "#005EFF", 
        selected: "#005EFF",
        default: "#f1f5f9",
        noCustomersHover: "#d1d5db",
        noCustomersSelected: "#d1d5db"
    }
};

// Track currently selected state
let selectedStateId = null;

// Helper functions
function getStateInfo(stateId) {
    const stateName = stateNames[stateId] || "Unknown";
    const stateAbbrev = Object.keys(stateAbbrevToName).find(key => 
        stateAbbrevToName[key] === stateName
    );
    const count = stateCounts[stateAbbrev] || 0;
    return { stateName, stateAbbrev, count };
}

function getStateColor(count, stateId = null) {
    // If this is the selected state, use selected colors
    if (stateId && stateId === selectedStateId) {
        return count > 0 ? tooltipConfig.colors.selected : tooltipConfig.colors.noCustomersSelected;
    }
    // Otherwise use normal colors
    return count > 0 ? tooltipConfig.colors.primary : tooltipConfig.colors.default;
}

// Centralized tooltip content generation
function generateTooltipContent(stateName, count) {
    return `<strong>${stateName}</strong><br/>${count} customer${count !== 1 ? 's' : ''}`;
}

// Unified hover behavior for states and callouts
function createHoverBehavior(element, stateId, isCallout = false) {
    const offset = isCallout ? tooltipConfig.offset.callout : tooltipConfig.offset.default;
    
    element
        .on("mouseover", function(event) {
            const { stateName, count } = getStateInfo(stateId);
            
            // Don't change color if this is the currently selected state
            if (stateId !== selectedStateId) {
                // Highlight the actual state path
                const statePath = svg.selectAll(".states").filter(function(d) { return d && d.id === stateId; });
                if (count > 0) {
                    statePath.attr("fill", tooltipConfig.colors.hover);
                } else {
                    statePath.attr("fill", tooltipConfig.colors.noCustomersHover);
                }
                
                // Change callout background if this is a callout
                if (isCallout) {
                    if (count > 0) {
                        d3.select(this).select("rect").attr("fill", tooltipConfig.colors.hover);
                    } else {
                        d3.select(this).select("rect").attr("fill", tooltipConfig.colors.noCustomersHover);
                    }
                }
            }
            
            // Show tooltip
            tooltip
                .style("opacity", 1)
                .html(generateTooltipContent(stateName, count))
                .style("left", (event.pageX + offset.x) + "px")
                .style("top", (event.pageY + offset.y) + "px");
        })
        .on("mousemove", function(event) {
            tooltip
                .style("left", (event.pageX + offset.x) + "px")
                .style("top", (event.pageY + offset.y) + "px");
        })
        .on("mouseout", function(event) {
            const { count } = getStateInfo(stateId);
            
            // Don't reset color if this is the currently selected state
            if (stateId !== selectedStateId) {
                // Reset state color
                const statePath = svg.selectAll(".states").filter(function(d) { return d && d.id === stateId; });
                statePath.attr("fill", getStateColor(count, stateId));
                
                // Reset callout background if this is a callout
                if (isCallout) {
                    d3.select(this).select("rect").attr("fill", count > 0 ? tooltipConfig.colors.primary : "white");
                }
            }
            
            // Hide tooltip
            tooltip.style("opacity", 0);
        });
}

// Update state colors based on customer data
function updateStateColors() {
    svg.selectAll(".states")
        .attr("fill", function(d) {
            if (!d || !d.id) return "#f1f5f9";
            const { count } = getStateInfo(d.id);
            return getStateColor(count, d.id);
        });
}

// Add customer pins to the map using actual lat/lng coordinates
function addCustomerPins() {
    const validCustomers = customerData.filter(d => {
        if (d.lat === null || d.lng === null || 
            d.lat === undefined || d.lng === undefined ||
            isNaN(d.lat) || isNaN(d.lng)) {
            return false;
        }
        
        // Also filter out coordinates that don't project properly
        const projected = projection([d.lng, d.lat]);
        return projected !== null;
    });
    
    // Debug: Log Maine customers specifically
    const maineCustomers = validCustomers.filter(d => d.state === 'ME');
    console.log(`DEBUG: Found ${maineCustomers.length} Maine customers:`, maineCustomers);
    
    // Use proper D3 data join pattern to handle updates and prevent duplicates
    const pins = svg.selectAll(".customer-pin")
        .data(validCustomers, d => d.id); // Use id as key to prevent duplicates
    
    // Remove any existing pins that are no longer in the data
    pins.exit().remove();
    
    // Add new pins - all customers get identical pins
    pins.enter().append("circle")
        .attr("class", "customer-pin")
        .attr("cx", d => {
            const projected = projection([d.lng, d.lat]);
            return projected[0];
        })
        .attr("cy", d => {
            const projected = projection([d.lng, d.lat]);
            return projected[1];
        })
        .attr("r", 3)
        .attr("fill", "#ffffff")
        .attr("stroke", "#000000")
        .attr("stroke-width", 1)
        .style("opacity", 0.95)
        .style("pointer-events", "none");
        
    // Debug: Count total pins after creation
    const totalPins = svg.selectAll(".customer-pin").size();
    console.log(`DEBUG: Total pins created: ${totalPins}`);
}

// Update callout colors based on customer data
function updateCalloutColors() {
    svg.selectAll(".callout-label").each(function() {
        const stateId = d3.select(this).attr("data-state-id");
        const { count } = getStateInfo(stateId);
        const hasCustomers = count > 0;
        
        d3.select(this).select("rect")
            .attr("fill", hasCustomers ? "#328CFF" : "white")
            .attr("stroke", hasCustomers ? "#328CFF" : "#ccc");
            
        d3.select(this).select("text")
            .attr("fill", hasCustomers ? "white" : "#333");
    });
}

// Draw callouts for small East Coast states
function drawCallouts(svg, states, projection) {
    const calloutsGroup = svg.append("g").attr("class", "callouts");
    
    smallStatesConfig.forEach(config => {
        // Find the state feature
        const stateFeature = states.find(d => d.id === config.id);
        if (!stateFeature) return;
        
        // Calculate state centroid
        const centroid = path.centroid(stateFeature);
        if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) return;
        
        // Calculate label position
        const labelX = centroid[0] + config.labelOffset.x;
        const labelY = centroid[1] + config.labelOffset.y;
        
        // Draw leader line
        calloutsGroup.append("line")
            .attr("class", "leader-line")
            .attr("x1", centroid[0])
            .attr("y1", centroid[1])
            .attr("x2", labelX)
            .attr("y2", labelY)
            .attr("stroke", "#666")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "2,2");
        
        // Draw label background (optional rounded rectangle)
        const labelGroup = calloutsGroup.append("g")
            .attr("class", "callout-label")
            .attr("data-state-id", config.id);
        
        const labelText = labelGroup.append("text")
            .attr("x", labelX)
            .attr("y", labelY)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("font-size", "12px")
            .attr("font-weight", "600")
            .attr("pointer-events", "all")
            .style("cursor", "pointer")
            .text(config.abbrev);
        
        // Add background rectangle for better visibility
        const bbox = labelText.node().getBBox();
        const padding = 4;
        
        const labelRect = labelGroup.insert("rect", "text")
            .attr("x", bbox.x - padding)
            .attr("y", bbox.y - padding)
            .attr("width", bbox.width + 2 * padding)
            .attr("height", bbox.height + 2 * padding)
            .attr("rx", 3)
            .attr("fill", "white")
            .attr("stroke", "#ccc")
            .attr("stroke-width", 1)
            .attr("pointer-events", "all")
            .style("cursor", "pointer");
        
        // Add hover events using unified behavior
        createHoverBehavior(labelGroup, config.id, true);
        
        // Add click handler separately to avoid closure issues
        labelGroup.on("click", function(event) {
            const { stateName, count } = getStateInfo(config.id);
            
            // Update selected state
            selectedStateId = config.id;
            
            // Update all state colors to reflect new selection
            updateStateColors();
            
            // Emit event for parent frame
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'stateSelected',
                    state: stateName,
                    stateId: config.id,
                    customerCount: count
                }, '*');
            }
            
            // Show state info panel
            stateInfoPanel.show(stateName, count);
        });
        
        // Update callout colors after creating the callout
        setTimeout(() => {
            updateCalloutColors();
        }, 100);
    });
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
        
        // Log summary statistics
        const numberOfStates = Object.keys(stateCounts).length;
        const totalCustomers = customerData.length;
        console.log(`Map loaded: ${numberOfStates} states with customers, ${totalCustomers} total customers`);
        
        addCustomerPins();
        
        // Update state colors if map exists
        if (d3.selectAll(".states").size() > 0) {
            updateStateColors();
        }
        
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
        .attr("fill", "#f1f5f9")
        .each(function(d) {
            createHoverBehavior(d3.select(this), d.id, false);
        })
        .on("click", function(event, d) {
            const { stateName, count } = getStateInfo(d.id);
            
            // Update selected state
            selectedStateId = d.id;
            
            // Update all state colors to reflect new selection
            updateStateColors();
            
            // Emit event for parent frame
            if (window.parent !== window) {
                window.parent.postMessage({
                    type: 'stateSelected',
                    state: stateName,
                    stateId: d.id,
                    customerCount: count
                }, '*');
            }
            
            // Show state info panel
            stateInfoPanel.show(stateName, count);
        });
    
    // Draw state borders
    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr("class", "state-borders")
        .attr("d", path);
    
    // Draw callouts for small East Coast states
    drawCallouts(svg, topojson.feature(us, us.objects.states).features, projection);
    
    // Load customer data after map is ready
    loadCustomerData().then(() => {
        // Update colors after both map and data are ready
        if (Object.keys(stateCounts).length > 0) {
            updateStateColors();
            updateCalloutColors();
        }
    });
});
