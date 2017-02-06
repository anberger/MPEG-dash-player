var state = {
  PLAY: "PLAY",
  STOP: "STOP",
  PAUSE: "PAUSE",
  END: "END"
};

function Player() {
  this._videoElement = null;
  this._playlistUrl = null;
  this._baseUrl = null;
  this._metaInfo = [];
}

Player.prototype.handleError = function(error) {
  console.error(error);
};

Player.prototype.setVideoElement = function(video) {
  this._videoElement = video;
};

Player.prototype.setPlaylistUrl = function(url) {
  this._playlistUrl = url;
  this._baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
};

Player.prototype.play = function() {
  this._state = state.PLAY;
};

Player.prototype.pause = function() {
  this._state = state.PAUSE;
};

Player.prototype.stop = function() {
  this._state = state.STOP;
};

Player.prototype.download = function(url, cb) {
  var xhttp = new XMLHttpRequest();
  var self = this;
  xhttp.open('GET', url);
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState === 4) {
      if (xhttp.status === 200) {
        cb(xhttp.response);
      } else {
        self.handleError(xhttp.response);
      }
    }
  };
  xhttp.send();
};

Player.prototype.parseMetaPresentation = function(period_i, adaption, type) {
  var self = this;
  var representation = adaption.querySelectorAll("Representation");

  for (var i = 0; i <= representation.length; i++) {
    if (representation[i]) {
      self._metaInfo[period_i][type]['representation'][i] = {};
      var attr = representation[i].attributes;
      for (var j = 0; j <= attr.length; j++) {
        if (attr[j]) {
          var key = attr[j].name;
          self._metaInfo[period_i][type]['representation'][i][key] = attr[j].value;
        }
      }
    }
  }
}

Player.prototype.parseMetaAdaptionInner = function(period_i, adaption, type) {
  var segmentInfo = adaption.querySelector("SegmentTemplate");
  var attr = segmentInfo.attributes;
  var self = this;

  this._metaInfo[period_i][type]['segmentTemplate'] = {};
  this._metaInfo[period_i][type]['representation'] = [];

  for(var i=0; i <= attr.length; i++) {
    if(attr[i]){
      var key = attr[i].name;
      self._metaInfo[period_i][type]['segmentTemplate'][key] = attr[i].value;
    }
  }

  this.parseMetaPresentation(period_i, adaption, type);
};

Player.prototype.parseMetaAdaptionSet = function(period, period_i) {
  var self = this;
  var adaptions = period.querySelectorAll("AdaptationSet");

  for(var i=0; i<=adaptions.length; i++) {
    if(adaptions[i]){
      var mime = adaptions[i].getAttribute('mimeType');
      if(mime.indexOf('audio') != -1) {
        self.parseMetaAdaptionInner(period_i, adaptions[i], 'audio');
      } else if(mime.indexOf('video') != -1) {
        self.parseMetaAdaptionInner(period_i, adaptions[i], 'video');
      }
    }
  }
};

Player.prototype.parseMetaInfo = function(xml) {
  var self = this;
  try {
    var periods = xml.querySelectorAll("Period");

    periods.forEach(function(period, period_i) {

      self._metaInfo.push({});
      self._metaInfo[period_i]['audio'] = {};
      self._metaInfo[period_i]['video'] = {};
      self.parseMetaAdaptionSet(period, period_i);
    });

    console.log(self._metaInfo)

  } catch (e) {
    this.handleError(e);
  }
};

Player.prototype.downloadPlaylist = function(cb) {
  var self = this;
  this.download(this._playlistUrl, function(res) {
    try {
      var parser = new DOMParser();
      var xml = parser.parseFromString(res, "text/xml");
      self.parseMetaInfo(xml);
      cb(xml);
    } catch (e) {
      self.handleError(e);
    }
  });
};

Player.prototype.init = function() {
  this.downloadPlaylist(function(xml) {

  })
};



