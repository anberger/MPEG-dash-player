var log = {
  info: function(msg, context) {
    context = context ? context : "PLAYER";
    console.info(context, msg);
  },
  warning: function(msg, context) {
    context = context ? context : "PLAYER";
    console.warn(context, msg);
  },
  error: function(msg, context) {
    context = context ? context : "PLAYER";
    console.error(context, msg);
  }
};

function Player() {
  this._videoElement = null;
  this._playlistUrl = null;
  this._baseUrl = null;
  this._metaInfo = {};
  this._playerState = {};
  this.resetPlayerState();
}

/**
 * @summary This function resets the player state
 */
Player.prototype.resetPlayerState = function () {
  if(this._playerState.mediaSource) {
    this._playerState.mediaSource.removeEventListener('sourceopen', this.sourceOpen);
    this._playerState.mediaSource.removeSourceBuffer(this._playerState.sourceBuffer);
  }

  this._playerState = {
    lastDownloadedSegment: 0,
    lastPlayedSegment: 0,
    currentPlaySegment: 0,
    downloadedSegments: [],
    video: null,
    mimeType: null,
    sourceBuffer: null,
    filling: false,
    mediaSource: null
  };
};

/**
 * @summary This function logs an error to console
 * @param error
 */
Player.prototype.handleError = function(error) {
  console.error(error);
};

/**
 * @summary This function initializes the video element
 * @param video - HTML video element
 */
Player.prototype.setVideoElement = function(video) {
  this._videoElement = video;
  this._videoElement.ontimeupdate = this.timeUpdate.bind(this);
};

/**
 * @summary Set the playlist url and extract the base url
 * @param url
 */
Player.prototype.setPlaylistUrl = function(url) {

  // Set the playlist url
  this._playlistUrl = url;

  // Base url is required for the segment files
  this._baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
};

/**
 * @summary Set selected video track
 * @param id - Id of the selected video element
 */
Player.prototype.setVideoTrack = function(id) {

  // Reset the player state
  this.resetPlayerState();

  // Set the selected current video element
  this.setMediaRepresentation(id);

  // Trigger an track state event to update the UI
  this.triggerTrackStateEvent(id);

  // Trigger meta info event to update the UI
  this.triggerMetaInfoEvent();

  // Initialize the video
  this.videoInit();
};

/**
 * @summary Trigger a track state change event to update the UI elements
 * @param track - Current track in play state
 */
Player.prototype.triggerTrackStateEvent = function(track) {
  var e = new CustomEvent("track-change", {
    detail: {
      track: track
    }
  });
  document.dispatchEvent(e);
};

/**
 * @summary Trigger a meta info event to update the UI elements
 */
Player.prototype.triggerMetaInfoEvent = function() {
  var e = new CustomEvent("meta-info-change", {
    detail: {
      duration: this._metaInfo.mpd.duration,
      segmentCount: this.calculateSegmentCount(),
      segmentLength: this.getSegmentLengthInSeconds()
    }
  });
  document.dispatchEvent(e);
};

/**
 * @summary Trigger an event, when the segment changes
 */
Player.prototype.triggerSegmentChange = function() {
  var e = new CustomEvent("segment-change", {
    detail: {
      currentSegment: this._playerState.currentPlaySegment,
      downloadedSegments: this._playerState.downloadedSegments,
      segmentCount: this._metaInfo.mpd.segmentCount
    }
  });
  document.dispatchEvent(e);
};

/**
 * @summary This function initiates a XHR request to server
 * @param url - Remote endpoint URL
 * @param cb - Callback with result
 * @param options - Options header params
 * @param options.range - Pass a byte range to header
 * @param options.arrayBuffer - The response should be an arrayBuffer
 */
Player.prototype.download = function(url, cb, options) {
  var xhttp = new XMLHttpRequest();

  xhttp.open('GET', url);
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState === 4) {
      if (xhttp.status === 200) {
        cb(xhttp.response);
      } else {
        log.error(xhttp.response);
      }
    }
  };

  // Response should include a certain byte range
  if(options && options.range) {
    xhttp.setRequestHeader("Range", "bytes=" + options.range);
  }

  // Response should be an arrayBuffer
  if(options && options.arrayBuffer) {
    log.info("Response is an arrayBuffer");
    xhttp.responseType = 'arraybuffer';
  }

  // Send Request
  xhttp.send();
};

/**
 * @summary Map the XML attributes to an object
 * @param xml - XML document to transform
 * @return {{}} - Transformed object
 */
Player.prototype.getAttributes = function(xml) {
  var obj = {};
  if(xml) {
    var attr = xml.attributes;
    for(var i=0; i < attr.length; i++) {
      if(attr[i]) {
        obj[attr[i].name] = attr[i].value;
      }
    }
  } else {
    log.error("Got no XML attributes", "getAttributes");
    log.error(xml, "getAttributes");
  }
  return obj;
};

/**
 * @summary Parse the meta video meta information from XML respond
 * @param xml - XML parsed mpd file from server
 * @param meta - Prepared meta info object
 */
Player.prototype.parseMetaInfoVideo = function(xml, meta) {
  var rep = xml.querySelectorAll("Representation");
  for(var i=0; i < rep.length; i++) {
    meta.representation[i] = this.getAttributes(rep[i]);
    var segTemplate = rep[i].querySelector("SegmentTemplate");
    meta.representation[i].segmentTemplate = this.getAttributes(segTemplate);
    meta.representation[i]._id = i;
  }
  this._metaInfo.video.push(meta);
  log.info(this._metaInfo, "metaInfo")
};

/**
 * @summary Parse the duration from XML playlist file
 * @param duration - Plain duration string
 * @return {number} - Duration in seconds
 */
Player.prototype.parseDuration = function(duration) {
  duration = duration.replace('PT', '');
  var hourIndex = duration.indexOf('H');
  var minuteIndex = duration.indexOf('M');
  var secondsIndex = duration.indexOf('S');
  var hour = parseFloat(duration.substr(0, hourIndex));
  var minute = parseFloat(duration.substr(++hourIndex, minuteIndex));
  var seconds = parseInt(duration.substr(++minuteIndex, secondsIndex));
  return this._metaInfo.mpd.duration = (hour * 3600) + (minute * 60) + seconds;
};

/**
 * @summary This function returns the length of a segment in seconds
 * @return {number} - Segment length in seconds
 */
Player.prototype.getSegmentLengthInSeconds = function() {
  var segmentDuration = this._playerState.video.segmentTemplate.duration;
  var timescale = this._playerState.video.segmentTemplate.timescale;
  return (segmentDuration / timescale);
};

/**
 * @summary This function calculates the segment count based on duration an segment length
 * @return {*|number} - Segment count
 */
Player.prototype.calculateSegmentCount = function() {
  var mediaDuration = this.parseDuration(this._metaInfo.mpd.mediaPresentationDuration);
  var segmentLength = this.getSegmentLengthInSeconds();
  return this._metaInfo.mpd.segmentCount = Math.ceil(mediaDuration / segmentLength);
};

/**
 * @summary This function estimates the current segment by a given playtime
 * @param time - Time in seconds
 * @return {number} - Current played segment
 */
Player.prototype.calculateCurrentSegment = function(time) {
  var duration = this._metaInfo.mpd.duration;
  var segmentCount = this._metaInfo.mpd.segmentCount;
  var currSegment = Math.ceil((segmentCount / duration) * time);
  return this._playerState.currentPlaySegment = currSegment;
};

/**
 * @summary This function parses the meta info from mpd playlist
 * @param xml - XML respond from server
 * @return {{}|*} - Meta info object
 */
Player.prototype.parseMetaInfo = function(xml) {
  try {
    this._metaInfo['mpd'] = {};
    this._metaInfo['video'] = [];

    // Get file MPD meta data
    var mpd = xml.querySelector("MPD");
    this._metaInfo.mpd = this.getAttributes(mpd);

    // Parse Duration from ISO String
    this.parseDuration(this._metaInfo.mpd.mediaPresentationDuration);

    // Get adaptionsets
    var adaptionSets = xml.querySelectorAll("AdaptationSet");

    // Iterate through adaption sets
    for(var i=0; i < adaptionSets.length; i++) {
      var curr = adaptionSets[i].getAttribute('mimeType');
      var meta = {
        adaptationSet: this.getAttributes(adaptionSets[i]),
        representation: []
      };

      if(curr.indexOf('video') != -1) {
        this.parseMetaInfoVideo(adaptionSets[i], meta);
      }
    }
    return this._metaInfo;

  } catch (e) {
    this.handleError(e);
  }
};

/**
 * @summary Download the playlist from server
 * @param cb - Callback with result
 */
Player.prototype.downloadPlaylist = function(cb) {
  var self = this;

  // Download playlist
  this.download(this._playlistUrl, function(res) {
    try {

      // Parse result
      var parser = new DOMParser();
      var xml = parser.parseFromString(res, "text/xml");

      // Fire callback with result
      cb(null, self.parseMetaInfo(xml));
    } catch (e) {
      self.handleError(e);
      cb(e, null);
    }
  }, {});
};

/**
 * Set the current media representation in player state
 * @param id - Id of the selected representation
 */
Player.prototype.setMediaRepresentation = function(id) {
  var element = this._metaInfo.video;
  var self = this;
  if(element.length) {
    element.forEach(function(elItem) {
      elItem.representation.forEach(function(representation) {
        if(representation.id === id) {
          self._playerState.video = representation;
        }
      })
    })
  }
  log.info(this._playerState)
};

/**
 * @summary Get the next segment url to download
 * @return {*} - URL
 */
Player.prototype.getNextUrl = function() {
  var segment = this._playerState.lastDownloadedSegment;
  var track = this._playerState.video;
  var media = track.segmentTemplate.media;
  var baseUrl = this._baseUrl;
  var url;

  if(segment === 0) {
    url = baseUrl + track.segmentTemplate.initialization;
  }
  else {
    url = baseUrl + media.replace("$Number$", segment.toString());
  }
  return url;
};

/**
 * @summary Check if this element is downloaded
 * @return {boolean} - True if not downloaded
 */
Player.prototype.isNotDownloaded = function() {
  var self = this;
  this._playerState.downloadedSegments.forEach(function(item) {
    if(item === self._playerState.lastDownloadedSegment) return false;
  });
  return true;
};

/**
 * @summary
 */
Player.prototype.fillBuffer = function() {
  var self = this;
  var next = this.getNextUrl();
  var currSegment = this._playerState.currentPlaySegment;
  var lastDownloaded = this._playerState.lastDownloadedSegment;
  var dif = lastDownloaded - currSegment;
  var buffer = this._playerState.sourceBuffer;

  // Check if video is still there
  if(!buffer) return;

  // Visualize segment state
  this.triggerSegmentChange();

  // Check if this segment should be downloaded
  if((lastDownloaded <= this.calculateSegmentCount()) && (dif < 5) && this.isNotDownloaded()) {

    // Indicate downloading
    this._playerState.filling = true;

    // Event listener function
    var func = function() {

      // Remove eventlistener from buffer
      buffer.removeEventListener('updateend', func);

      // Recursive call to fill the buffer
      self.fillBuffer();
    };

    // Download element
    this.download(next, function(res) {

      // Add event listener to indicate when the buffer is filled
      buffer.addEventListener('updateend', func);

      // Append download result array to buffer
      buffer.appendBuffer(new Uint8Array(res));

      // Add this element to player state
      self._playerState.downloadedSegments.push(self._playerState.lastDownloadedSegment);
      self._playerState.lastDownloadedSegment++;
    }, {
      arrayBuffer: true
    });
  } else {

    // Indicate filling done
    this._playerState.filling = false;
  }
};

/**
 * @summary This function gets executed when the video element changes time
 * @param e - Event
 */
Player.prototype.timeUpdate = function(e) {

  // Get current time in seconds
  var currentTime = e.target.currentTime;

  // Calculate segment from time
  var currentSegment = this.calculateCurrentSegment(currentTime);

  // Get the last played segment number
  var lastSegment = this._playerState.lastPlayedSegment;

  // Calculate the difference
  var dif = currentSegment - lastSegment;

  // Check if user browsed the video to set the new state
  if(dif !== 0 && dif !== 1) {

    // Start loading the segments at the browsed time
    var seg = currentSegment - 1;

    // Avoid index errors on selecting the first element
    seg = (seg === -1) ? 0 : seg;

    // Update the segment state
    this._playerState.lastDownloadedSegment = seg;
    this._playerState.lastPlayedSegment = seg;
  }

  // Fill buffer if its not filling
  if(!this._playerState.filling) {
    this.fillBuffer();
  }

  // Visualize segment state
  this.triggerSegmentChange();

  // Set the last played element to current
  this._playerState.lastPlayedSegment = currentSegment;
};

/**
 * @summary Browse to specific segment id
 * @param segmentId - Segment number
 */
Player.prototype.segmentBrowsing = function(segmentId) {

  // Pause the video element
  this._videoElement.pause();

  // Get the segment length
  var segmentLength = this.getSegmentLengthInSeconds();

  // Calculate current time based on segment number
  this._videoElement.currentTime = (segmentId * segmentLength);

  // Force play
  this._videoElement.play();
};

/**
 * @summary This function gets executed when the media source is ready
 */
Player.prototype.sourceOpen = function() {
  try {
    this._playerState.sourceBuffer = this._playerState.mediaSource.addSourceBuffer(this._playerState.mimeType);
    this.fillBuffer();
  } catch (e) {
    log.error('Exception calling addSourceBuffer for video', e);
  }
};

/**
 * @summary This function initializes the video
 */
Player.prototype.videoInit = function() {
  var video = this._playerState.video;

  // Get codecs from meta info
  this._playerState.mimeType = 'video/mp4; codecs="' + video.codecs + '"';

  // Calculate ratio from given video
  var ratio = video.width / video.height;

  // Scale video
  var width = (window.innerWidth * 0.6);

  // Set video dimensions
  this._videoElement.height = parseInt(width / ratio);
  this._videoElement.width = width;

  // Check if media source is available
  if ('MediaSource' in window && MediaSource.isTypeSupported(this._playerState.mimeType)) {
    var mediaSource = this._playerState.mediaSource = new MediaSource;

    // Create an URL pointing to media source
    this._videoElement.src = URL.createObjectURL(mediaSource);

    // Append event listener on media source
    mediaSource.addEventListener('sourceopen', this.sourceOpen.bind(this));
  } else {
    console.error('Unsupported MIME type or codec: ', this._playerState.mimeType);
  }
};

