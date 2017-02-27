(function() {
  var inpPlaylist = document.getElementById("playlist");
  var btnStream = document.getElementById("stream");

  /**
   * @summary This function redirects the user to the stream page
   * @param value
   */
  function redirect(value) {
    var param = encodeURIComponent(value);
    window.location.href = "/stream.html?url=" + param
  }

  /**
   * @summary Redirect on url change
   */
  function urlChange() {
    redirect(inpPlaylist.value);
  }

  /**
   * @summary Redirect on click
   */
  function streamClick() {
    redirect(inpPlaylist.value);
  }

  /**
   * @summary Append listeners to elements
   */
  inpPlaylist.addEventListener("change", urlChange);
  btnStream.addEventListener("click", streamClick);
})();