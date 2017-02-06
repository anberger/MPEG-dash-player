function StreamHandler(sliderElement, videoElement) {
  this._playlist = null;
  this._playlistFiles = null;
  this._streaming = false;
  this._currSegment = 0;
  this._sliderElement = sliderElement;
  this._videoElement = videoElement;
  this._serverUrl = null;
}

StreamHandler.prototype.downloadFromUrl = function(url, cb) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState === 4 && xhttp.status === 200) {
      cb(xhttp.response);
    }
  };
  if(!this._serverUrl) this._serverUrl = url.substring(0, url.lastIndexOf('/') + 1);
  xhttp.open("GET", url, true);
  xhttp.send();
};

StreamHandler.prototype.downloadFilesFromUrl = function(url, cb) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState === 4 && xhttp.status === 200) {
      cb(xhttp.response);
    }
  };
  xhttp.open("GET", url, true);
  xhttp.responseType = 'arraybuffer';
  xhttp.send();
};

StreamHandler.prototype.parsePlaylist = function(response) {
  var lines = response.split("\n");
  var playlist = [];
  var obj = {};
  var self = this;

  if(lines[0] === "#EXTM3U") {
    lines.forEach(function(line) {
      if(line.indexOf("#EXT-X-STREAM-INF") != -1) {
        var data = line.split(":")[1];
        var meta = data.split(",");
        var tmp = {};

        // Fix codec part
        meta.forEach(function(item, i) {
          if(item[0] === item[0].toLowerCase()) {
            meta[i-1] += "," + meta[i];
            meta.splice(i,1);
          }
        });

        // Parse to key value pair
        meta.forEach(function(item, i) {
          var currMeta = item.split("=");

          tmp[currMeta[0]] = currMeta[1]
            .replace('"', '')
            .replace('"', '');
        });
        obj.meta = tmp;
      }
      else if(line.indexOf("#") == -1 && line.length) {
        var url = line;
        console.log(self._serverUrl);
        if(line.indexOf("http") === -1) {
          url = self._serverUrl + line;
        }
        obj.url = url;
        playlist.push(obj);
        obj = {};
      }
    });
  }
  this._playlist = playlist;
};

StreamHandler.prototype.parsePlaylistFiles = function(response) {
  var lines = response.split("\n");
  var files = [];
  var obj = {};
  var self = this;

  if(lines[0] === "#EXTM3U") {
    lines.forEach(function(line) {
      if(line.indexOf("#EXTINF") != -1) {
        obj.meta = line;
      }
      else if(line.indexOf("#") == -1 && line.length) {
        var url = line;
        if(line.indexOf("http") === -1) {
          url = self._serverUrl + line;
        }
        obj.url = url;
        files.push(obj);
        obj = {};
      }
    });
  }
  this._playlistFiles = files;
};

StreamHandler.prototype.downloadPlaylist = function(url, cb) {
  var self = this;

  this.downloadFromUrl(url, function(response) {
    self.parsePlaylist(response);
    cb(self._playlist);
  })
};

StreamHandler.prototype.downloadPlaylistFiles = function(listIndex, cb) {
  var playlist = this._playlist[parseInt(listIndex)];
  var self = this;

  this.downloadFromUrl(playlist.url, function(response) {
    self.parsePlaylistFiles(response);
    cb(self._playlistFiles);
  })
};

StreamHandler.prototype.downloadStreamingFiles = function(sourceBuffer, cb) {

  for(var i=0; i<10; i++){
    this.downloadFilesFromUrl(this._playlistFiles[i].url, function(result){
      sourceBuffer.appendBuffer(result);
    });
  }


};

StreamHandler.prototype.startStreaming = function() {
  this._streaming = true;
};

StreamHandler.prototype.stopStreaming = function() {
  this._streaming = false;
};

StreamHandler.prototype.getPlaylistFiles = function() {
  return this._playlistFiles;
};

