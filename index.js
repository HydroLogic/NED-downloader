"use strict";

var fs = require("fs"),
    util = require("util");
var request = require("request");

var INITIATE_TEMPLATE = "http://gisdata.usgs.gov/XMLWebServices2/(S(va2r0255orkvus45mhzree55))/json_wrapper.php?SERVICE=DL_SERVICE&OP=initiateDownload&downloadServiceEndPoint=http://extract.cr.usgs.gov/axis2/services/DownloadService/initiateDownload?PL=N3F&MSU=http://imsref.cr.usgs.gov/servlet/com.esri.esrimap.Esrimap&MSS=USGS_EDC_TDDS_Inventory_Elevation&MSL=TDDS_Tile_Index_NED_13arcsec&MSEA=FILE_ID&DLS=http://gisdata.usgs.gov/TDDS/DownloadFile.php?TYPE=ned3f_zip%26FNAME=&FID=ZI&ARC=ZI&DLA=FILE_ID&EIDL=%s&siz=52&lft=%d&bot=%d&rgt=%d&top=%d&ORIG=NEDTILED";

var STATUS_TEMPLATE = "http://gisdata.usgs.gov/XMLWebServices2/(S(va2r0255orkvus45mhzree55))/json_wrapper.php?SERVICE=DL_SERVICE&OP=getDownloadStatus&requestID=%s&downloadServiceEndPoint=http://extract.cr.usgs.gov/axis2/services/DownloadService/";

var GET_DATA_TEMPLATE = "http://extract.cr.usgs.gov/axis2/services/DownloadService/getData?downloadID=%s";

process.exit();


var query = function(name, downloadId, callback) {
  var next;

  var checkStatus = function() {
    request.get(util.format(STATUS_TEMPLATE, downloadId), function(err, response, body) {
      var rsp = JSON.parse(body);
      var msg = rsp["service_response"].replace("\r\n", " ");
      var status = rsp["service_response"].split(",")[0];

      console.log("[%s] %s", name, msg);

      if (+status !== 400) {
        return next();
      }

      return callback(null, downloadId);
    });
  };

  next = function() {
    setTimeout(checkStatus, 5000);
  }

  return checkStatus();
};

// filename corresponds to the top-left
var name = process.argv[process.argv.length - 1];
var top = +name.slice(1, 3);
var left = -name.slice(4, 8);

// TODO check whether the file has already been downloaded

request.get(util.format(INITIATE_TEMPLATE, name, left, top - 1, left - 1, top), function(err, response, body) {
  var rsp = JSON.parse(body);
  var downloadId = rsp["service_response"];

  query(name, downloadId, function() {
    console.log("[%s] Downloading...", name);
    request.get(util.format(GET_DATA_TEMPLATE, downloadId)).pipe(fs.createWriteStream(name + ".zip"));
  });
});
