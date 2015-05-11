// document identifiers
var TOP_SITES_CONTENT_ID = 'top-sites-content';
var PIE_CHART_CONTENT_ID = 'pie-chart-content';
var TIMESERIES_CONTENT_ID = 'timeseries-content';
var TOP_SITES_BUTTON_ID = 'top-sites-button';
var PIE_CHART_BUTTON_ID = 'pie-chart-button';
var TIMESERIES_BUTTON_ID = 'timeseries-button';
var TIMESLICE_SELECT_ID = 'timesliceSelectBox';
var TOP_SITES_LIST_ID = 'top-sites-list';
var TIME_LABEL_CLASS = 'time-label-span';
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

// Maintain the state of the page. By default, the view is set to top-sites.
var ACTIVE_TAB = TOP_SITES_CONTENT_ID;
var ACTIVE_BUTTON = TOP_SITES_BUTTON_ID;


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

   /* Track the number of callbacks from chrome.history.getVisits()
    *     that we expect to get.  When it reaches zero, we have all results.
    */
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
      var processVisitsWithUrl = function(url, historyItem) {
        /**
          * processVisitsWithUrl()
          * We need the url of the visited item to process the visit. Use a
          *     closure to bind the url into the callback's args.
          * @param {string} the url of the historyItem.
          * @param {object} the historyItem object corresponding to the url.
          * @return {function} A closure to bind url+callback.
          */
        return function(visitItems) { 
          processVisits(url, visitItems, historyItem); };
      };
      chrome.history.getVisits({url: url}, 
        processVisitsWithUrl(url, historyItems[i]));
      numRequestsOutstanding++;
    }
    if (!numRequestsOutstanding) {
      onAllVisitsProcessed();
    }
  });  

  // Maps URLs to a count of the number of times the user visited that URL
  var visitObject = {};
  // to be sorted by url count
  var sortedUrlArray = [];

  var processVisits = function(url, visitItems, historyItem) {
    /**
      * processVisits()
      * Callback for chrome.history.getVisits().  Counts the number of times a
      *     user visited a URL.
      * @param {string} url The url to count.
      * @param {object} the historyItem object corresponding to the url.
      * @param {object} visitItems The object from the API representing a visit.
      */
    for (var i = 0, ie = visitItems.length; i < ie; ++i) {
      // get simple domains from a given url
      var rootDomain = new URL(url).hostname;
      
      // TODO: convert timeOfVisit to a regular date.
      timeOfVisit = historyItem.lastVisitTime;

      // a new, previously unseen rootDomain
      if (!visitObject[rootDomain]) {
        visitObject[rootDomain] = {
          'key'   : rootDomain,
          'count' : 1, // this is the total count of all visits across all times
          'values' : [{'series':rootDomain, 'x': timeOfVisit, 'y':1}]
        };
        sortedUrlArray.push(rootDomain);
      }

      lastIndex = visitObject[rootDomain].values.length - 1

      // a new, previously unseen time for a rootDomain visit 
      if (visitObject[rootDomain].values[lastIndex]['x'] == timeOfVisit) {
        visitObject[rootDomain].values[lastIndex]['y'] += 1
      } else { // update an existing rootDomain visit
        var newVisit = {'series':rootDomain, 'x': timeOfVisit, 'y':1}
        visitObject[rootDomain].values.push(newVisit);
      }

      // either way, update the rootDomain visit count
      visitObject[rootDomain].count++;
    }

     /* If this is the final outstanding call to processVisits(),
      *     then we have the final results.  Use them to build the list
      *     of URLs to show in the popup.
      */
    if (!--numRequestsOutstanding) { // if you can no longer decrement...
      onAllVisitsProcessed();
    }
  };
  
  var onAllVisitsProcessed = function() {
    /**
      * onAllVisitsProcessed()
      * Sort the URLs by the number of times the user typed them, then call
      *     the function to print them. This is called when we have the final 
      *     list of URls to display.
      */
   sortedUrlArray.sort(function(a, b) {
     return visitObject[b].count - visitObject[a].count;
   });

   printTopResults(sortedUrlArray, visitObject);  
  };
}

var printTopResults = function(sortedUrlArray, visitObject) {
  /**
   * printTopResults()
   * Displays urls and counts. Also calls pie chart code.
   * @param {array} sortedUrlArray An array of count-sorted Urls. 
   * @param {object} visitObject An object containing url to count mappings.
   */
  pieChartData = new Array();   // object to store pie chart data
  timeseriesData = new Array(); // object to store the timeseries data
  // console.log("visit object:")
  // console.log(visitObject)

  for (var i =0; i < TOP_X; i++) {
    url = sortedUrlArray[i];
    count = visitObject[sortedUrlArray[i]].count;

    // make link elements
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

    // append each line item to the appropriate ol element
    var orderedListElement = document.getElementById('top-sites-list');
    orderedListElement.appendChild(lineItemElement);

    // this is massaged data for the pie chart
    var tmp = new Object();
    tmp.label = url;
    tmp.value = count;
    pieChartData.push(tmp);

    // timeseries data should be the top X objects from visitObject
    timeseriesData.push(visitObject[url])
  }
  createPieChart(pieChartData);
  createTimeseries(timeseriesData);
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
    .showLegend(true)
    .pieLabelsOutside(false)
    .labelType("percent")
    .tooltipContent(function(key, y, e, graph) { return key + ', ' + 
      e.value + ' visits.' })
    .labelThreshold(.05)
    .showLabels(true);

  chart.legend.margin({top: 5, right:50, left:0, bottom: 0});

  d3.select("#chart svg")
    .datum(data)
    .transition().duration(1200)
    .call(chart);
    
  return chart;
  });
}

function sinAndCos() {
  var sin = [],sin2 = [],
      cos = [];

  //Data is represented as an array of {x,y} pairs.
  for (var i = 0; i < 100; i++) {
    sin.push({x: i, y: Math.sin(i/10)});
    sin2.push({x: i, y: Math.sin(i/10) *0.25 + 0.5});
    cos.push({x: i, y: .5 * Math.cos(i/10)});
  }

  //Line chart data should be sent as an array of series objects.
  return [
    {
      values: sin,      //values - represents the array of {x,y} data points
      key: 'Sine Wave', //key  - the name of the series.
      color: '#ff7f0e'  //color - optional: choose your own line color.
    },
    {
      values: cos,
      key: 'Cosine Wave',
      color: '#2ca02c'
    },
    {
      values: sin2,
      key: 'Another sine wave',
      color: '#7777ff',
      area: true      //area - set to true if you want this line to turn into a filled area chart.
    }
  ];
}

var createTimeseries = function(timeseriesData) {
  console.log(timeseriesData)
  var chart = nv.models.lineChart()
                  .margin({left: 100})  //Adjust chart margins to give the x-axis some breathing room.
                  .useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
                  .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
                  .showYAxis(true)        //Show the y-axis
                  .showXAxis(true)        //Show the x-axis
    ;

  chart.xAxis     //Chart x-axis settings
      .axisLabel('Date')
      .tickFormat(d3.format(',r'));

  chart.yAxis     //Chart y-axis settings
      .axisLabel('Visits')
      .tickFormat(d3.format('.02f'));

  /* Done setting the chart up? Time to render it!*/
  // var myData = sinAndCos();   //You need data...
  var myData = timeseriesData;
  // console.log("fake data:")
  // console.log(myData)

  d3.select('#timeseries-chart svg')    //Select the <svg> element you want to render the chart in.   
      .datum(myData)              //Populate the <svg> element with chart data...
      .call(chart);               //Finally, render the chart!

  //Update the chart when window resizes.
  nv.utils.windowResize(function() { chart.update() });
  return chart;
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
  var timeseriesButton = document.getElementById(TIMESERIES_BUTTON_ID);

  topSitesButton.addEventListener('click', function(){
    showHiddenContent(ACTIVE_TAB, TOP_SITES_CONTENT_ID, 
                      topSitesButton, ACTIVE_BUTTON);
  });

  pieChartButton.addEventListener('click', function() {
    showHiddenContent(ACTIVE_TAB, PIE_CHART_CONTENT_ID, 
                      pieChartButton, ACTIVE_BUTTON);
  })

  timeseriesButton.addEventListener('click', function() {
    showHiddenContent(ACTIVE_TAB, TIMESERIES_CONTENT_ID, 
                      timeseriesButton, ACTIVE_BUTTON);
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
    var timesliceLabelDisplay = document.getElementsByClassName(TIME_LABEL_CLASS)[0];
    timesliceLabelDisplay.innerHTML = selectedOption.innerText;
    targetNode = TOP_SITES_LIST_ID;
    clearCurrentContents(targetNode);
    buildHistoryItemList(selectedValue);
  }
}

var showHiddenContent = function(currentContent, 
                                 targetContent, 
                                 callingButton, 
                                 currentButtonId) {
  /**
   * showHiddenContent()
   * Hides currently displayed content and shows another set of content.
   * @param {string} currentContent A string containing the ID of the content 
   *     currently displayed.
   * @param {string} targetContent A string containing the ID of the content 
   *     that should be displayed.
   * @param {element} callingButton A DOM element containing the object that was
   *     clicked and caused the event to fire.
   * @param {string} currentButtonId A string containing the id of the currently
   *     active button.
   */
  var displayStyle = 'block';
  currentButton = document.getElementById(ACTIVE_BUTTON);

  hideContent(currentContent, currentButton);

  var toShow = document.getElementById(targetContent);
  toShow.style.display = displayStyle;
  callingButton.style.borderBottomColor = ACTIVE_BACKGROUND_COLOR;
  callingButton.style.backgroundColor = ACTIVE_BACKGROUND_COLOR;

  // set up globals to track the state of the page
  ACTIVE_TAB = targetContent;
  // the id of the button that was clicked on is the new active button
  ACTIVE_BUTTON = event.target.id;
}

var hideContent = function(currentContent, currentButton) {
  /**
   * hideContent()
   * Hides a given content node, and updates its active button style.
   * @param {string} currentContent A string representing the ID of the current
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

