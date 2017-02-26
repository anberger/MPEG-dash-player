(function() {
  var player = new Player();
  var segmentBoxElement = null;
  var videoElement = null;
  var dropDownElement = null;
  var buttonElement = null;
  var metaElement = null;
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
  function trackChange(e) {
    var state = e.detail;
    buttonElement.innerText = state.track;
  }

  function metaInfoChange(e) {
    var meta = e.detail;
    metaElement.innerHTML = "";
    var duration = document.createElement("div");
    var segmentCount = document.createElement("div");
    var segmentLength = document.createElement("div");

    duration.innerText = "Duration: " + meta.duration + " sec.";
    segmentCount.innerText = "Segment Amount: " + meta.segmentCount;
    segmentLength.innerText = "Segment Length: " + meta.segmentLength + " sec.";

    metaElement.appendChild(duration);
    metaElement.appendChild(segmentLength);
    metaElement.appendChild(segmentCount);
  }

  /**
   * @summary Check if element is in array
   * @param arr - Array to check
   * @param el - Corresponding element
   * @return {boolean} - True if found
   */
  function isInArray(arr, el) {
    for(var i = 0; i < arr.length; i++) {
      if(arr[i] === el) {
        return true;
      }
    }
    return false;
  }

  /**
   * @summary Segment clicked handle
   * @param e - Event
   */
  function segmentClicked(e) {
    var segmentId = e.target.id.split("_");
    if (segmentId && segmentId.length) {
      player.segmentBrowsing(parseInt(segmentId[1]))
    }
  }

  /**
   * @summary Create initial segment list
   * @param count
   */
  function initializeSegments(count) {
    segmentBoxElement.innerHTML = null;
    for(var i = 1; i <= count; i++) {
      var el = document.createElement("div");
      el.innerText = "SEG_" + i;
      el.id = "segment_" + i;
      segmentBoxElement.appendChild(el);
    }
    segmentBoxElement.addEventListener('click', segmentClicked, false);
  }

  /**
   * @summary Update segment state corresponding to player state
   * @param downloaded - Array of downloaded files
   * @param current - Current played segment
   */
  function updateSegmentState(downloaded, current) {
    for(var i = 1; i <= segmentBoxElement.children.length; i++) {
      var el = document.getElementById('segment_' + i);
      var className = "segment-element";
      if(isInArray(downloaded, i)) {
        className += " downloaded";
      } else {
        className += " pending";
      }
      if(i === current) {
        className += " current";
      }
      el.className = className;
    }
  }

  /**
   * @summary This function updates the segment list state (executed by player events)
   * @param e - Event
   */
  function segmentChange(e) {
    var segment = e.detail;

    // Check if elements are already created
    if(segmentBoxElement.children.length !== segment.segmentCount) {
      initializeSegments(segment.segmentCount);
    }

    // Update segment state according to state
    updateSegmentState(segment.downloadedSegments, segment.currentSegment);
  }

  /**
   * @summary This function gets executed when the initialization process is done
   */
  function onLoad() {

    // Initialize elements
    videoElement = document.getElementById('stream-video');
    segmentBoxElement = document.getElementById('segments');
    dropDownElement = document.getElementById('select-video');
    buttonElement = document.getElementById('select-video-button');
    metaElement = document.getElementById('select-video-meta');

    // Set event listeners
    dropDownElement.addEventListener('click', selectVideoHandler, false);
    document.addEventListener('track-change', trackChange, false);
    document.addEventListener('segment-change', segmentChange, false);
    document.addEventListener('meta-info-change', metaInfoChange, false);

    // Get url from location param
    url = getUrlFromParam();

    // Set playlist url
    player.setPlaylistUrl(url);

    // Set video element
    player.setVideoElement(videoElement);

    // Download playlist and update meta info
    player.downloadPlaylist(function(err, metaInfo) {
      if(!err) {
        dropDownElement.childNodes = [];
        metaInfo.video.forEach(function(item) {
          item.representation.forEach(function(repr) {
            var li = document.createElement('li');
            var a = document.createElement('a');
            a.innerText = repr.id;
            a.setAttribute('href', '#');
            a.setAttribute('id', repr.id);
            li.appendChild(a);
            dropDownElement.appendChild(li);
          })
        });
      }
    });
  }
  window.onload = onLoad;
})();