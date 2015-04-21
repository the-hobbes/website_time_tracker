// document identifiers
var TOP_SITES_CONTENT_ID = 'top-sites-content';
var PIE_CHART_CONTENT_ID = 'pie-chart-content';
var TOP_SITES_BUTTON_ID = 'top-sites-button';
var PIE_CHART_BUTTON_ID = 'pie-chart-button';
var TIMESLICE_SELECT_ID = 'timesliceSelectBox';
var TOP_SITES_LIST_ID = 'top-sites-list';
var TIME_LABEL_ID = 'time-label-span';
var LOADING_ICON_ID = 'loading-icon';

// default coloring
var ACTIVE_BACKGROUND_COLOR = '#FCFCFC';
var DORMANT_BACKGROUND_COLOR = 'white';
var BORDER_COLOR = 'black';

// time slice identifiers
var WEEK = '1';
var MONTH = '2';
var YEAR = '3';
var TOP_X = 10; // top X items to show to the user

function buildHistoryItemList(timeslice) {
  /**
   * buildHistoryItemList()
   * This function builds a list of history items from the Chrome history api.
   * @param {string} timeslice A string indicating which of 3 timeslice 
   *     durations to use. Note that the if the timeslice is undefined, a 
   *     default of '1' is used, indicating the duration of a week. 
   */
  showLoadingIcon();
  
  if (typeof timeslice === 'undefined') { timeslice = WEEK; }
  var searchDepth = 0

  if (timeslice == WEEK) {
    var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
    searchDepth = (new Date).getTime() - microsecondsPerWeek;
  } else if (timeslice == MONTH) {
    var microsecondsPerMonth = 1000 * 60 * 60 * 24 * 30;
    searchDepth = (new Date).getTime() - microsecondsPerMonth; 
  } else {
    var microsecondsPerYear = 1000 * 60 * 60 * 24 * 360;
    searchDepth = (new Date).getTime() - microsecondsPerYear; 
  }

  // Track the number of callbacks from chrome.history.getVisits()
  // that we expect to get.  When it reaches zero, we have all results.
  var numRequestsOutstanding = 0;

  chrome.history.search({
    'text': '',                // Return every history item...
    'startTime': searchDepth,  // accessed less than x time ago.
    'maxResults': 0            // 0 == all results
    },
   function(historyItems) {
    // For each history item, get details on all visits.
    for (var i = 0; i < historyItems.length; ++i) {
      var url = historyItems[i].url;
      var processVisitsWithUrl = function(url) {
        // We need the url of the visited item to process the visit.
        // Use a closure to bind the  url into the callback's args.
        return function(visitItems) { processVisits(url, visitItems); };
      };
      chrome.history.getVisits({url: url}, processVisitsWithUrl(url));
      numRequestsOutstanding++;
    }
    if (!numRequestsOutstanding) {
      onAllVisitsProcessed();
    }
  });  

  // Maps URLs to a count of the number of times the user visited that URL
  var urlCountObject = {};
  
  // Callback for chrome.history.getVisits().  Counts the number of
  // times a user visited a URL.
  var processVisits = function(url, visitItems) {
    for (var i = 0, ie = visitItems.length; i < ie; ++i) {
      // get simple domains from a given url
      var rootDomain = new URL(url).hostname;

      if (!urlCountObject[rootDomain]) {
        urlCountObject[rootDomain] = 0;
      }

      urlCountObject[rootDomain]++;
    }

    // If this is the final outstanding call to processVisits(),
    // then we have the final results.  Use them to build the list
    // of URLs to show in the popup.
    if (!--numRequestsOutstanding) {
      onAllVisitsProcessed();
    }
  };
  
  // This function is called when we have the final list of URls to display.
  var onAllVisitsProcessed = function() {
   sortedUrlArray = [];
   for (var url in urlCountObject) {
     // add every url entry in the object to an array for sorting
     sortedUrlArray.push(url);
   }

   // Sort the URLs by the number of times the user typed them.
   sortedUrlArray.sort(function(a, b) {
     return urlCountObject[b] - urlCountObject[a];
   });

   printTopResults(sortedUrlArray, urlCountObject);  
  };
}

var printTopResults = function(sortedUrlArray, urlCountObject) {
  /**
   * printTopResults()
   * Displays urls and counts. Also calls pie chart code.
   * @param {array} sortedUrlArray An array of count-sorted Urls. 
   * @param {object} urlCountObject An object containing url to count mappings.
   */
  pieChartData = new Array(); // object to store pie chart data

  // for (var i in sortedUrlArray) {
  for (var i =0; i < TOP_X; i++) {
    url = sortedUrlArray[i];
    count = urlCountObject[sortedUrlArray[i]];

    // grab the hostname from the url with this hack
    var linkElement = document.createElement('a');
    linkElement.href = 'http://' + url;
    linkElement.text = url;
    linkElement.target = 'blank';

    // create an li for each site, and append the link created above
    var lineItemElement = document.createElement('li');
    lineItemElement.appendChild(linkElement);
    // add the count to the li
    var countText = document.createTextNode(', ' + count + ' times.');
    lineItemElement.appendChild(countText);

    if (i <= 9) { // print the top 10 urls w/counts:
      // append each line item to the appropriate ol element
      var orderedListElement = document.getElementById('top-sites-list');
      orderedListElement.appendChild(lineItemElement);
    }

    // this is massaged data for the pie chart
    var tmp = new Object();
    tmp.label = url;
    tmp.value = count;
    pieChartData.push(tmp);
  }
  createPieChart(pieChartData);
  hideLoadingIcon();
}

var createDropShadowFilter = function() {
 /**
   * createDropShadowFilter()
   * Creates an SVG drop shadow filter for the pie chart.
   */
  var svg = d3.select('svg');
  var defs = svg.append("defs");

  var filter = defs.append("filter")
      .attr("id", "dropshadow")

  filter.append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 4)
      .attr("result", "blur");
  filter.append("feOffset")
      .attr("in", "blur")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("result", "offsetBlur");

  var feMerge = filter.append("feMerge");

  feMerge.append("feMergeNode")
      .attr("in", "offsetBlur")
  feMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");
}

var createPieChart = function(pieChartData) {  
  /**
   * createPieChart()
   * Creates a pie chart with url data, using nvd3 libraries.
   * @param {object} pieChartData An object containing url-to-count mappings
   *     formatted for the nvd3 pie chart library.
   */
  var data = pieChartData;

  nv.addGraph(function() {
  var chart = nv.models.pieChart()
    .x(function(d) { return d.label })
    .y(function(d) { return d.value })
    .showLegend(false)
    .labelType("percent")
    .tooltipContent(function(key, y, e, graph) { return key + ', ' + 
      e.value + ' visits.' })
    .labelThreshold(.05)
    .showLabels(true);

  createDropShadowFilter();

  d3.selectAll("svg")
  .attr("class", "shadow")
  .attr("filter", "url(#dropshadow)");

  d3.select("#chart svg")
    .datum(data)
    .transition().duration(1200)
    .call(chart);
    
  return chart;
  });
}

var addListeners = function() {
  /**
   * addListeners()
   * Add listeners for page events. 
   */
  addTabChangeListeners();
  addTimesliceListeners();
}

var addTabChangeListeners = function(){
  /**
   * addTabChangeListeners()
   * Add listeners to the tab buttons, enabling a user to switch between them.
   */
  var topSitesButton = document.getElementById(TOP_SITES_BUTTON_ID);
  var pieChartButton = document.getElementById(PIE_CHART_BUTTON_ID);

  topSitesButton.addEventListener('click', function(){
    showHiddenContent(PIE_CHART_CONTENT_ID, TOP_SITES_CONTENT_ID, 
      topSitesButton, pieChartButton);
  });

  pieChartButton.addEventListener('click', function() {
    showHiddenContent(TOP_SITES_CONTENT_ID, PIE_CHART_CONTENT_ID, 
      pieChartButton, topSitesButton);
  })
}

var clearCurrentContents = function(targetNode) {
  /**
   * clearCurrentContents()
   * Clears the current contents of a provided node.
   * @param {element} targetNode A DOM node from which its children will be 
   *     cleared.
   */
  var node = document.getElementById(targetNode);
  if (node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }
}

var addTimesliceListeners = function() {
  /**
   * addTimesliceListeners()
   * Listens to onchange events from the selectbox containing timeslices, and
   *     rebuilds the display according to what was selected.
   */
  var timesliceSelectBox = document.getElementById(TIMESLICE_SELECT_ID);
  timesliceSelectBox.onchange = function (e) {
    var selectedOption = this[this.selectedIndex];
    var selectedValue = selectedOption.value;
    var timesliceLabelDisplay = document.getElementById(TIME_LABEL_ID);
    timesliceLabelDisplay.innerHTML = selectedOption.innerText;
    targetNode = TOP_SITES_LIST_ID;
    clearCurrentContents(targetNode);
    buildHistoryItemList(selectedValue);
  }
}

var showHiddenContent = function(currentContent, targetContent, callingButton, 
  currentButton) {
  /**
   * showHiddenContent()
   * Hides currently displayed content and shows another set of content.
   * @param {string} currentContent A string containing the ID of the content 
   *     currently displayed.
   * @param {string} targetContent A string containing the ID of the content 
   *     that should be displayed.
   * @param {element} callingButton A DOM element containing the object that was
   *     clicked and caused the event to fire.
   * @param {element} currentButton A DOM element containing the object that 
   *     represents the currently active button.
   */
  var displayStyle = 'block';

  hideContent(currentContent, currentButton);

  var toShow = document.getElementById(targetContent);
  toShow.style.display = displayStyle;
  callingButton.style.borderBottomColor = ACTIVE_BACKGROUND_COLOR;
  callingButton.style.backgroundColor = ACTIVE_BACKGROUND_COLOR;
}

var hideContent = function(currentContent, currentButton) {
  /**
   * hideContent()
   * Hides a given content node, and updates its active button style.
   * @param {string} currentContent A string representign the ID of the current
   *     content displayed.
   * @param {element} currentButton A DOM element representing the currently
   *     active button.
   */
  var toHide = document.getElementById(currentContent);  
  toHide.style.display = 'none';
  currentButton.style.borderBottomColor = BORDER_COLOR;
  currentButton.style.backgroundColor = DORMANT_BACKGROUND_COLOR;
}

var showLoadingIcon = function() {
  /**
   * showLoadingIcon()
   * Shows a loading icon while the API is being queried and content is being
   *     loaded.
   */
  var loadingIcon = document.getElementById(LOADING_ICON_ID);
  loadingIcon.style.display = 'block';
}

var hideLoadingIcon = function() {
  /**
   * hideLoadingIcon()
   * Hides the currently displayed loading icon after the API has returned and
   *     the results are ready to display.
   */
  var loadingIcon = document.getElementById(LOADING_ICON_ID);
  loadingIcon.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
  /**
   * document.addEventListener()
   * Entry point into the code. Fires when the DOMContentLoaded event completes.
   */
  // add event listeners to elements
  addListeners();
  // begin querying the history API and setting up the page
  buildHistoryItemList(); 
});
