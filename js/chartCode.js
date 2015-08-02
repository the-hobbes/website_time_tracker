/**
  * File containing code to prepare and render the charts.
  */

var printTopResults = function(sortedUrlArray, visitObject) {
  /**
   * printTopResults()
   * Displays urls and counts. Also calls pie chart code.
   * @param {array} sortedUrlArray An array of count-sorted Urls. 
   * @param {object} visitObject An object containing url to count mappings.
   */
  pieChartData = [];   // object to store pie chart data
  timeseriesData = []; // object to store the timeseries data

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
    var orderedListElement = document.getElementById(TOP_SITES_LIST_ID);
    orderedListElement.appendChild(lineItemElement);

    // this is massaged data for the pie chart
    var tmp = {};
    tmp.label = url;
    tmp.value = count;
    pieChartData.push(tmp);

    // timeseries data should be the top X objects from visitObject
    timeseriesData.push(visitObject[url]);
  }
  createPieChart(pieChartData);
  createTimeseries(timeseriesData);
  hideLoadingIcon();
};

var createDropShadowFilter = function() {
 /**
   * createDropShadowFilter()
   * Creates an SVG drop shadow filter for the pie chart.
   */
  var svg = d3.select('svg');
  var defs = svg.append("defs");

  var filter = defs.append("filter")
      .attr("id", "dropshadow");

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
      .attr("in", "offsetBlur");
  feMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");
};

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
    .x(function(d) { return d.label; })
    .y(function(d) { return d.value; })
    .showLegend(true)
    .pieLabelsOutside(false)
    .labelType("percent")
    .tooltipContent(function(key, y, e, graph) { return key + ', ' +
      e.value + ' visits.'; })
    .labelThreshold(.05)
    .showLabels(true);

  chart.legend.margin({top: 5, right:50, left:0, bottom: 0});

  d3.select("#chart svg")
    .datum(data)
    .transition().duration(1200)
    .call(chart);
    
  return chart;
  });
};

var createTimeseries = function(timeseriesData) {
  /**
   * createTimeseries()
   * Creates a timeseries with url data, using nvd3 libraries.
   * @param {object} timeseriesData An object containing url-to-count mappings
   *     as well as dates, formatted for the nvd3 pie chart library.
   */

  var chart = nv.models.lineChart()
                  .useInteractiveGuideline(true)
                  .tooltips(false)
                  .showLegend(true)
                  .showYAxis(true)
                  .showXAxis(true);

  chart.xAxis
      .orient("bottom")
      .tickFormat(function(d) {
          return d3.time.format('%d-%b-%y')(new Date(d));
      })
      .rotateLabels(-45);

  chart.yAxis
      .axisLabel('Number of Visits')
      .orient("left")
      .tickFormat(d3.format('d'));

  var myData = timeseriesData;

  // render the chart
  d3.select('#timeseries-chart svg')
      .datum(myData)
      .call(chart);

  return chart;
};