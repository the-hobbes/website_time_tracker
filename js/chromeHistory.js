/**
  * File containing interactions with the chrome history API. 
  */ 

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
  var searchDepth = 0;

  if (timeslice == WEEK) {
    var millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
    searchDepth = (new Date()).getTime() - millisecondsPerWeek;
  } else if (timeslice == MONTH) {
    var millisecondsPerMonth = 1000 * 60 * 60 * 24 * 30;
    searchDepth = (new Date()).getTime() - millisecondsPerMonth;
  } else {
    var millisecondsPerYear = 1000 * 60 * 60 * 24 * 360;
    searchDepth = (new Date()).getTime() - millisecondsPerYear;
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
          processVisits(url, visitItems, historyItem);
        };
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
      
      timeOfVisit = historyItem.lastVisitTime;

      // we have a new, previously unseen rootDomain
      if (!visitObject[rootDomain]) {
        visitObject[rootDomain] = {
          'key'    : rootDomain,
          'count'  : 1, // this is the total count of all visits across all times
          'values' : [{'series':rootDomain, 'x': timeOfVisit, 'y':1}],
        };
        sortedUrlArray.push(rootDomain);
      }

      lastIndex = visitObject[rootDomain].values.length - 1;

      // a new, previously unseen time for a rootDomain visit 
      if (visitObject[rootDomain].values[lastIndex]['x'] == timeOfVisit) {
        visitObject[rootDomain].values[lastIndex]['y'] += 1;
      } else { // update an existing rootDomain visit
        var newVisit = {'series':rootDomain, 'x': timeOfVisit, 'y':1};
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