function buildTypedUrlList() {
  // this function is largely unchanged from the google example
  var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
  var oneWeekAgo = (new Date).getTime() - microsecondsPerWeek;

  // Track the number of callbacks from chrome.history.getVisits()
  // that we expect to get.  When it reaches zero, we have all results.
  var numRequestsOutstanding = 0;

  chrome.history.search({
    'text': '',              // Return every history item...
    'startTime': oneWeekAgo  // that was accessed less than one week ago.
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

  // Maps URLs to a count of the number of times the user typed that URL into
  // the omnibox.
  var urlToCount = {};
  
  // Callback for chrome.history.getVisits().  Counts the number of
  // times a user visited a URL.
  var processVisits = function(url, visitItems) {
    for (var i = 0, ie = visitItems.length; i < ie; ++i) {

      if (!urlToCount[url]) {
        urlToCount[url] = 0;
      }

      urlToCount[url]++;
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
   // Get the top scorring urls.
   urlArray = [];
   for (var url in urlToCount) {
     urlArray.push(url);
   }

   // Sort the URLs by the number of times the user typed them.
   urlArray.sort(function(a, b) {
     return urlToCount[b] - urlToCount[a];
   });

   printTopResults(urlArray, urlToCount);  
  };
}

var printTopResults = function(topResults, allResults) {
  // print the top 10 urls w/counts:
  for (var i in topResults.slice(0, 10)) {
    url = topResults[i];
    count = allResults[topResults[i]];

    // grab the hostname from the url with this hack
    var link_element = document.createElement('a');
    link_element.href = url;
    link_element.text = link_element.hostname;
    link_element.title = url; // set hover text

    // create an li for each site, and append the link created above
    var line_item = document.createElement('li');
    line_item.appendChild(link_element);
    // add the count to the li
    var count_text = document.createTextNode(', ' + count + ' times.');
    line_item.appendChild(count_text);

    // append each line item to the appropriate ol element
    var ordered_list = document.getElementById('top-sites-list');
    ordered_list.appendChild(line_item);
  }
  createPieChart(topResults, allResults); 
}

var createPieChart = function(topResults, allResults) {
  // print all the urls w/counts:
  // for (var i in urlArray) {
  //   console.log(urlArray[i] + ' ' + urlToCount[urlArray[i]]);
  // }


}

var addButtonListeners = function(){
  var top_sites_button = document.getElementById('top-sites-button');
  top_sites_button.addEventListener('click', function(){
    console.log('clicked top-sites');
    showHiddenContent('pie-chart-content', 'top-sites-content');
  });

  var pie_chart_button = document.getElementById('pie-chart-button');
  pie_chart_button.addEventListener('click', function() {
    console.log('clicked pie chart');
    showHiddenContent('top-sites-content', 'pie-chart-content');
  })
}

var showHiddenContent = function(currentContent, targetContent) {
  // currentContent is the content that is displayed right now
  // targetContent is the element that we want to show

  hideContent(currentContent);

  var to_show = document.getElementById(targetContent);
  to_show.style.display = 'block';

}

var hideContent = function(currentContent) {
  var to_hide = document.getElementById(currentContent);
  to_hide.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
  // Function to add event listener to buttons
  addButtonListeners();

  // entry point into history api stuff
  buildTypedUrlList(); 
});
