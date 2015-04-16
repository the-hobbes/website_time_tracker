// global vars

var TOP_SITES_CONTENT_ID = 'top-sites-content';
var PIE_CHART_CONTENT_ID = 'pie-chart-content';

var TOP_SITES_BUTTON_ID = 'top-sites-button';
var PIE_CHART_BUTTON_ID = 'pie-chart-button';

var ACTIVE_BACKGROUND_COLOR = 'whitesmoke';
var DORMANT_BACKGROUND_COLOR = 'white';
var BORDER_COLOR = 'black';

function buildTypedUrlList() {
  var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
  var oneWeekAgo = (new Date).getTime() - microsecondsPerWeek;

  var microsecondsPerMonth = 1000 * 60 * 60 * 24 * 30;
  var oneMonthAgo = (new Date).getTime() - microsecondsPerMonth; 

  var microsecondsPerYear = 1000 * 60 * 60 * 24 * 360;
  var oneYearAgo = (new Date).getTime() - microsecondsPerYear; 

  // Track the number of callbacks from chrome.history.getVisits()
  // that we expect to get.  When it reaches zero, we have all results.
  var numRequestsOutstanding = 0;

  chrome.history.search({
    'text': '',              // Return every history item...
    'startTime': microsecondsPerMonth  // accessed less than one month ago.
    },
   function(historyItems) {
    // For each history item, get details on all visits.

    for (var i = 0; i < historyItems.length; ++i) {
      var url = historyItems[i].url;
      var processVisitsWithUrl = function(url) {
        // We need the url of the visited item to process the visit.
        // Use a closure to bind the  url into the callback's args.
        return function(visitItems) {
          processVisits(url, visitItems); // call function defined below
        };
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
      // hack to get simple domains from a given url
      var linkElement = document.createElement('a');
      linkElement.href = url;

      if (!urlCountObject[linkElement.hostname]) {
        urlCountObject[linkElement.hostname] = 0;
      }

      urlCountObject[linkElement.hostname]++;
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
  pieChartData = new Array(); // object to store pie chart data

  for (var i in sortedUrlArray) {
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
}

var createPieChart = function(pieChartData) {    
  var data = pieChartData

  nv.addGraph(function() {
  var chart = nv.models.pieChart()
    .x(function(d) { return d.label })
    .y(function(d) { return d.value })
    .showLegend(false)
    .labelType("percent")
    .tooltipContent(function(key, y, e, graph) { return key + ', ' + 
      e.value + ' visits.' })
    .showLabels(true);

  d3.select("#chart svg")
    .datum(data)
    .transition().duration(1200)
    .call(chart);

    return chart;
  });
}

var addButtonListeners = function(){
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

var showHiddenContent = function(currentContent, targetContent, callingButton, 
  currentButton) {
  // currentContent is the content that is displayed right now
  // targetContent is the element that we want to show
  // callingButton is the button that was clicked to fire the event
  var displayStyle = 'block';

  hideContent(currentContent, currentButton);

  var toShow = document.getElementById(targetContent);
  toShow.style.display = displayStyle;
  callingButton.style.borderBottomColor = ACTIVE_BACKGROUND_COLOR;
  callingButton.style.backgroundColor = ACTIVE_BACKGROUND_COLOR;
}

var hideContent = function(currentContent, currentButton) {
  // set styling to default
  var toHide = document.getElementById(currentContent);
  
  toHide.style.display = 'none';
  currentButton.style.borderBottomColor = BORDER_COLOR;
  currentButton.style.backgroundColor = DORMANT_BACKGROUND_COLOR;
}


document.addEventListener('DOMContentLoaded', function () {
  // Function to add event listener to buttons
  addButtonListeners();

  // entry point into history api stuff
  buildTypedUrlList(); 
});
