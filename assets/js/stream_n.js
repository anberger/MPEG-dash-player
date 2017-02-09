(function() {
  var player = new Player();
  var sliderElement = null;
  var videoElement = null;
  var dropDownElements = {};
  var buttonElements = {};
  var url = null;

  /**
   * @summary This function parses the URL from browser address
   * @return {string} - URL to process
   */
  function getUrlFromParam() {
    var param = window.location.search.substring(1);
    var url = (param.indexOf('url=') != -1) ? param.split("=")[1] : "";
    return decodeURIComponent(url);
  }

  /**
   * @summary This function prepares the segment slider
   */
  function prepareSlider() {
    sliderElement = new Slider('#stream-slider', {
      formatter: function(value) {
        return 'Current value: ' + value;
      }
    });
  }

  /**
   * @summary Audio track select handler
   * @param e
   */
  function selectAudioHandler(e) {
    player.setAudioTrack(e.target.id);
  }

  /**
   * @summary Video track select handler
   * @param e
   */
  function selectVideoHandler(e){
    player.setVideoTrack(e.target.id);
  }

  /**
   * @summary Updates track elements (fired by event from player)
   * @param e - Event params
   */
  function trackState(e) {
    var trackState = e.detail;
    buttonElements[trackState.type].innerText = trackState.track;
  }

  /**
   * @summary Updates play button state (fired by event from player)
   * @param e - Event params
   */
  function playButtonState(e) {
    var cState = e.detail;
    var target = buttonElements.play;
    var text = "";
    var icon = "glyphicon glyphicon-";

    if(state.PLAY == cState) {
      text = " Pause";
      icon += "pause";
    } else {
      text = " Play";
      icon += "play";
    }

    var span = document.createElement('span');
    var txt = document.createTextNode(text);
    target.innerText = "";
    target.innerHTML = "";
    target.childNodes =[];
    span.className = icon;
    target.appendChild(span);
    target.appendChild(txt);
  }

  /**
   * @summary This function toggles the player state from pause to play and vice versa
   * @param e
   */
  function playButtonHandler(e) {
    player.toggle();
  }

  /**
   * @summary This function gets executed when the initialization process is done
   */
  function onLoad() {

    // Initialize elements
    videoElement = document.getElementById('stream-video');
    dropDownElements.video = document.getElementById('select-video');
    dropDownElements.audio = document.getElementById('select-audio');
    buttonElements.video = document.getElementById('select-video-button');
    buttonElements.audio = document.getElementById('select-audio-button');
    buttonElements.play = document.getElementById('play-button');

    // Set event listeners
    buttonElements.play.addEventListener('click', playButtonHandler, false);
    dropDownElements.video.addEventListener('click', selectVideoHandler, false);
    dropDownElements.audio.addEventListener('click', selectAudioHandler, false);
    document.addEventListener('player-state', playButtonState, false);
    document.addEventListener('track-state', trackState, false);

    // Prepare HTML elements
    prepareSlider();

    // Get url from location param
    url = getUrlFromParam();

    // Set playlist url
    player.setPlaylistUrl(url);

    // Set video element
    player.setVideoElement(videoElement);

    // Download playlist and update meta info
    player.downloadPlaylist(function(metaInfo) {
      for(var t in mimeTypes) {
        type = mimeTypes[t];
        if(metaInfo.hasOwnProperty(type)) {
          dropDownElements[type].childNodes = [];
          metaInfo[type].forEach(function(item) {
            item.representation.forEach(function(repr) {
              var li = document.createElement('li');
              var a = document.createElement('a');
              a.innerText = repr.id;
              a.setAttribute('href', '#');
              a.setAttribute('id', repr.id);
              li.appendChild(a);
              dropDownElements[type].appendChild(li);
            })
          });
        }
      }
    });

    // Initialize the player
    player.init();
  }
  window.onload = onLoad;
})();