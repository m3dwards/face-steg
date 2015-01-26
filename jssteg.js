/**
 * jsSteg Javascript Library v1.0
 * https://github.com/owencm/js-steg
 * Copyright 2014, Owen Campbell-Moore and other contributors
 * Released under the MIT license
 *
 * Usage:
 * jsSteg provides two public functions, getCoefficients and reEncodeWithModifications.
 * Refer to their documentation below to understand their usage.
 * 
 * Note:
 * This library depends on jsstegdecoder-1.0.js and jsstegencoder-1.0.js which have different
 * licences and must be included before this library.
 */
var jsSteg = (function() {
  /**
   * Use the JPEG decoding library and pass on the coefficients to coeffReader
   * - url: the blob URL from which to read the image
   * - coeffReader: a function which will be called with the coefficients as an argument
   */
  var getCoefficients = function(url, coeffReader) {
    var image;
    image = new JpegImage();
    image.onload = function(coefficients) {
      return coeffReader(coefficients);
    };
    return image.load(url, true);
  };

  /**
   * Convert an image in any format to bmp data for encoding
   * - url: the blob URL to convert to bmp
   * - callback: called with the resulting data
   */
  var getImageDataFromURL = function(url, callback) {
    var img;
    img = document.createElement("img");
    img.onload = function() {
      var ctx, cvs;
      cvs = document.createElement("canvas");
      cvs.width = img.width;
      cvs.height = img.height;
      ctx = cvs.getContext("2d");
      ctx.drawImage(img, 0, 0);
      return callback(ctx.getImageData(0, 0, cvs.width, cvs.height));
    };
    return img.src = url;
  };

  /**
   * Decode the provided JPEG to raw data and then re-encode it with the JPEG encoding library,
   * running coefficientModifier on the coefficients while encoding
   * - url: the blob URL from which to 're-encode'
   * - coefficientModifier: this will be called with the coefficients as an argument which it can
   * modify before the encoding is completed
   */
  var reEncodeWithModifications = function(url, coefficientModifier, callback) {
    getImageDataFromURL(url, function(data) {
      var encoder = new JPEGEncoder();
      var jpegURI = encoder.encodeAndModifyCoefficients(data, 75, coefficientModifier);
      callback(jpegURI);
    });
  }  

  return {
    getCoefficients: getCoefficients,
    reEncodeWithModifications: reEncodeWithModifications
  };
})();

/**
 * Called when decoding a JPEG
 * - coefficients: coefficients[0] is an array of luminosity blocks, coefficients[1] and 
 *   coefficients[2] are arrays of chrominance blocks. Each block has 64 "modes"
 */
var readCoefficients = function(coefficients) {
  console.log(coefficients);
  alert("The coefficients have been outputted to the console.");
};

/**
 * Called when encoding a JPEG
 * - coefficients: coefficients[0] is an array of luminosity blocks, coefficients[1] and 
 *   coefficients[2] are arrays of chrominance blocks. Each block has 64 "modes"
 */
var modifyCoefficients = function(coefficients) {
  // An example that inverts the luminosity. You could hide information in the bits here.
  var lumaCoefficients = coefficients[0];
  for (var i = 0; i < lumaCoefficients.length; i++) {
    for (var j = 0; j < 64; j++) {
      lumaCoefficients[i][j] = -lumaCoefficients[i][j];
    }
  }
}

// A global variable which holds onto the blob url of the selected image while we wait for the
// user to choose to encode or decode.
var objectURL;

// Bind the decode button to reading out the coefficients from the image. Note the image must be a
// JPEG for this to do something sensible.
document.getElementById("decode").addEventListener("click", function() {
  jsSteg.getCoefficients(objectURL, readCoefficients);
});

// Bind the encode button to reading out the coefficients from the image
document.getElementById("encode").addEventListener("click", function () {
  jsSteg.reEncodeWithModifications(objectURL, null, function (resultUri) {
    // Do whatever you want with the resulting uri, in this example we display it on the page.
    document.getElementById("output").src = resultUri;
  });
});

// When the user completes selecting an image we generate a blob url for it to communicate with 
// the encoder/decoder
document.getElementById("file").addEventListener("change", function handleFileSelect(e){
  // Ensure the user chose a single file
  if (e.target.files.length !== 1) {
    throw new Error("User didn't select a file correctly");
  }
  var f = e.target.files[0];
  // Create a 'blob' url file for the image so we can the file to be decoded or encoded
  window.URL = window.URL || window.webkitURL;
  objectURL = window.URL.createObjectURL(f);
  // Clear the file selection
  e.target.files = [];
  // Reset the 'encoded image' being displayed
  document.getElementById("output").src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
}, false);
