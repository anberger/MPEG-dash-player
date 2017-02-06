(function() {
  var player = new Player();
  var sliderElement = null;
  var videoElement = null;
  var listElement = null;

  function getUrlFromParam() {
    var param = window.location.search.substring(1);
    var url = (param.indexOf('url=') != -1) ? param.split("=")[1] : "";
    return decodeURIComponent(url);
  }

  function prepareSlider() {
    sliderElement = new Slider('#stream-slider', {
      formatter: function(value) {
        return 'Current value: ' + value;
      }
    });
  }

  function onLoad() {

    videoElement = document.getElementById('stream-video');
    listElement = document.getElementById('stream-meta');

    // Prepare HTML elements
    prepareSlider();

    // Get url from location param
    var url = getUrlFromParam();

    // Set playlist url
    player.setPlaylistUrl(url);

    // Set video element
    player.setVideoElement(videoElement);


    player.downloadPlaylist(function(result) {
      console.log(result);
    })
  }
  window.onload = onLoad;
})();