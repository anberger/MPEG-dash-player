(function() {
  var inpPlaylist = document.getElementById("playlist");
  var btnStream = document.getElementById("stream");

  function redirect(value) {
    var param = encodeURIComponent(value);
    window.location.href = "/stream.html?url=" + param
  }

  function urlChange() {
    redirect(inpPlaylist.value);
  }

  function streamClick() {
    redirect(inpPlaylist.value);
  }

  inpPlaylist.addEventListener("change", urlChange);
  btnStream.addEventListener("click", streamClick);
})();