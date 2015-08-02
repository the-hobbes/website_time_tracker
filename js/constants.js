/**
  * File containing project constants. 
  */

// document identifiers
var TOP_SITES_CONTENT_ID = 'top-sites-content';
var PIE_CHART_CONTENT_ID = 'pie-chart-content';
var TOP_SITES_BUTTON_ID = 'top-sites-button';
var PIE_CHART_BUTTON_ID = 'pie-chart-button';
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

// Chrome analytics code
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-11781420-8', 'auto');
ga('send', 'pageview');
