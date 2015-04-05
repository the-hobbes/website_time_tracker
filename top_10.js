document.addEventListener('DOMContentLoaded', function () {
  txt = 'suckah';
  var line_item = document.createElement('li');
  line_item.appendChild(document.createTextNode(txt));  

  var ordered_list = document.getElementById('top-sites');
  ordered_list.appendChild(line_item);
});
  
