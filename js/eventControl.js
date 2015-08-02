/**
  * File containing event and flow control logic. 
  */

var addListeners = function() {
  /**
   * addListeners()
   * Add listeners for page events. 
   */
  addTabChangeListeners();
  addTimesliceListeners();
};

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
  });

  timeseriesButton.addEventListener('click', function() {
    showHiddenContent(ACTIVE_TAB, TIMESERIES_CONTENT_ID,
                      timeseriesButton, ACTIVE_BUTTON);
  });
};

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
};

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
    var timesliceLabelDisplays = document.getElementsByClassName(TIME_LABEL_CLASS);
    console.log(document.getElementsByClassName(TIME_LABEL_CLASS));

    for (var i = 0; i < timesliceLabelDisplays.length; i++) {
      timesliceLabelDisplays[i].innerHTML = selectedOption.innerText;
    }
    targetNode = TOP_SITES_LIST_ID;
    clearCurrentContents(targetNode);
    buildHistoryItemList(selectedValue);
  };
};

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
};

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
};

var showLoadingIcon = function() {
  /**
   * showLoadingIcon()
   * Shows a loading icon while the API is being queried and content is being
   *     loaded.
   */
  var loadingIcon = document.getElementById(LOADING_ICON_ID);
  loadingIcon.style.display = 'block';
};

var hideLoadingIcon = function() {
  /**
   * hideLoadingIcon()
   * Hides the currently displayed loading icon after the API has returned and
   *     the results are ready to display.
   */
  var loadingIcon = document.getElementById(LOADING_ICON_ID);
  loadingIcon.style.display = 'none';
};

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

