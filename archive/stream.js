(function() {
  var streamHandler = null;
  var sliderElement = null;
  var videoElement = null;
  var listElement = null;

  function getUrlFromParam() {
    var param = window.location.search.substring(1);
    var url = (param.indexOf('url=') != -1) ? param.split("=")[1] : "";
    return decodeURIComponent(url);
  }

  function showPlaylistInfo(playlist) {
    console.log(playlist);

    playlist.forEach(function(element, i) {
      var item = document.createElement('li');
      item.id = i.toString();
      item.className = "list-group-item stream-meta-info";

      for (var el in element.meta) {
        var span = document.createElement('span');
        span.className = "badge";
        span.innerText = element.meta[el];
        item.appendChild(span);
      }

      item.appendChild(document.createTextNode("Pl:" + i));
      listElement.appendChild(item);
    });
  }

  function sourceOpen(videoTag, e) {
    var mediaSource = e.target;

    console.log(mediaSource.readyState);

    if (mediaSource.sourceBuffers.length > 0)
      return;

    var sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E,mp4a.40.2"');

    var files = streamHandler.getPlaylistFiles();

    sourceBuffer.addEventListener('updateend', function () {
      //mediaSource.endOfStream();
      //videoElement.play();
    });

    sourceBuffer.addEventListener('error', function (msg) {
      console.log("error", this, msg);
    });

    sourceBuffer.addEventListener('sourceended', function () {
      console.log("ended", this)
    });

    sourceBuffer.addEventListener('update', function () {
      console.log("update", this)
    });


    streamHandler.downloadFilesFromUrl(files[0].url, function(result) {
      console.log(result);
      try {
        var array = new Uint8Array(result);
        sourceBuffer.appendBuffer(array);
      } catch (e) {
        console.log(e)
      }

    });

  }

  function selectPlaylistHandler(ev) {
    streamHandler.downloadPlaylistFiles(ev.srcElement.id, function(files) {
      sliderElement.setValue(0);
      sliderElement.setAttribute('max', files.length.toString());
      startStreamingHandler();
      var mediaSource = new MediaSource;
      videoElement.src = window.URL.createObjectURL(mediaSource);
      mediaSource.addEventListener('sourceopen', sourceOpen.bind(this, videoElement));
    })
  }

  function startStreamingHandler(ev) {

  }

  function prepareSlider() {
    sliderElement = new Slider('#stream-slider', {
      formatter: function(value) {
        return 'Current value: ' + value;
      }
    });
  }

  function onLoad() {

    // Get url from location param
    var url = getUrlFromParam();

    // Prepare HTML elements
    prepareSlider();
    videoElement = document.getElementById('stream-video');
    listElement = document.getElementById('stream-meta');
    listElement.addEventListener('click', selectPlaylistHandler);

    // Create a new streamhandler
    streamHandler = new StreamHandler();

    // Download playlist
    streamHandler.downloadPlaylist(url, function(playlist) {

      // Show playlist to user
      showPlaylistInfo(playlist);
    });
  }
  window.onload = onLoad;
})();