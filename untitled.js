(function (doc, nav) {
  "use strict";

  var video, width, height, context, threshold, canvas, bgCanvas, bgContext, power, pow, operator, canvasAvg, start, flagSlow, flagRev, flagAvg;

  function initialize() {
    // The source video.
    video = doc.getElementById("vid");
    width = doc.body.clientWidth;
    height = doc.body.clientHeight;

    threshold = 80;
    power = 4;
    pow = power;
    operator = -1;
    flagSlow = false;
    flagRev = false;
    flagAvg = false;

    // The target canvas.
    bgCanvas = doc.getElementById("untitled");
    bgCanvas.width = width;
    bgCanvas.height = height;
    bgContext = bgCanvas.getContext("2d");
    canvas = doc.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    context = canvas.getContext("2d");
    bgContext.translate(canvas.width, 0);
    bgContext.scale(-1, 1);
    start = new Date().getTime();

    context.fillStyle = "#FFFFFF";
    context.fillRect(0, 0, canvas.width, canvas.height);

    nav.getUserMedia = nav.getUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia || nav.msGetUserMedia;

    if (!nav.getUserMedia) {
          doc.getElementById("compatibility-warning").style.display = "block";
          return;
        }

    setTimeout(function() {flagSlow = true;}, 45000);
    setTimeout(function() {flagRev = true;}, 90000);

    // Get the webcam's stream.
    nav.getUserMedia({video: true, audio: false}, startStream, function(err) {
              doc.getElementById("camera-warning").style.display = "block";
              console.log("Error: ", err);
          });
  }

  function startStream(stream) {
    video.src = URL.createObjectURL(stream);
    video.play();

    // Ready! Let's start drawing.
    requestAnimationFrame(draw);
  }

  function draw() {
    var frame = readFrame();
    var canvasFrame = context.getImageData(0, 0, width, height);

    if (frame) {
      grayThreshold(frame.data, canvasFrame.data, threshold);
      context.putImageData(canvasFrame, 0, 0);

      if (flagSlow) {
        if (canvasAvg < 0.8 * 255) {
          power = pow / 2;
        } else if (canvasAvg > 0.8 * 255) {
          power = pow / 2;
        } else {
          power = pow;
        }
      }

      if (flagRev || flagAvg) {
        reverseAnim();
      }
    }

    // Wait for the next frame.
    requestAnimationFrame(draw);
    console.log(canvasAvg, flagSlow, flagRev, flagAvg);
  }

  function reverseAnim() {
    operator *= -1;
    flagRev = false;
    flagAvg = true;
    setTimeout(function() {flagRev = true;}, 90000);
  }

  function readFrame() {
    try {
      bgContext.drawImage(video, 0, 0, width, height);
    } catch (e) {
      // The video may not be ready, yet.
      return null;
    }

    return bgContext.getImageData(0, 0, width, height);
  }

  function grayThreshold(data, ctx, threshold) {
    var len = data.length;
    var ths = [];

    for (var i = 0; i < len; i += 4) {
      var r = data[i];
      var g = data[i+1];
      var b = data[i+2];
      // color -> grayscale weighting (0.299, 0.587, 0.144) as in openCV package // suitable for testing
      var th = (0.299*r + 0.587*g + 0.144*b >= threshold) ? 255 : 0;

      data[i] = data[i+1] = data[i+2] = th;

      ctx[i] += (th / 255) * power * operator;
      ctx[i+1] += (th / 255) * power * operator;
      ctx[i+2] += (th / 255) * power * operator;

      ths.push(ctx[i]);      
    }

    var sum = 0;
    for (var i = 0; i < ths.length; i++) {
      sum += parseInt(ths[i], 10);
    }
    canvasAvg = sum / ths.length;

    if ((canvasAvg > 0.85*255 || canvasAvg < 0.15*255) && flagSlow) {
      flagAvg = true;
    }
  }

  doc.onkeydown = function(evt){
    evt = evt || window.event;
    // if arrow up, increase threshold
    if (evt.keyCode == 38) {
      threshold += 5;
    }
    // if arrow down, decrease threshold
    else if (evt.keyCode == 40) {
      threshold -= 5;
    }
    // if enter, save screenshot, works only in Chrome (as far as I know)
    else if (evt.keyCode == 13) {
      var ua = window.navigator.userAgent;

      if (ua.indexOf("Chrome") > 0) {
        var link = doc.createElement('a');
        link.download = "UNTITLED_scrnsht.png";
        link.href = canvas.toDataURL('image/png').replace("image/png", "image/octet-stream");
        link.click();
      }
      else {
        alert("Saving screenshots works only in Chrome!");
      }
    }
  }

  addEventListener("DOMContentLoaded", initialize);
})(document, navigator);
