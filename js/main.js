/* globals
---------------------------------------------------------------------*/
var data;

/* document ready
---------------------------------------------------------------------*/
$(document).ready(function() {

    var proxy = "https://crossorigin.me/";
    var path = "http://tidesandcurrents.noaa.gov/api/datagetter?";
    var params = {
        "range": "24",
        "station": "9410230",
        "product": "water_temperature",
        "datum": "MLLW",
        "units": "english",
        "time_zone": "lst",
        "application": "web_services",
        "format": "json"
    };

    var url = proxy + path + $.param(params);

    console.log(url);

    $.get(url, function(response) {
            // console.log(response);
            data = $.parseJSON(response).data;
            console.log(data);
        })
        .done(function() {
            console.log("done");
        })
        .fail(function() {
            console.log("error");
        })
        .always(function() {
            console.log("finished");
        });
});

/* functions
---------------------------------------------------------------------*/
