/* globals
---------------------------------------------------------------------*/
var readings;
var data = [];

/* document ready
---------------------------------------------------------------------*/
$(document).ready(function() {

    var proxy = "https://crossorigin.me/";
    var path = "http://tidesandcurrents.noaa.gov/api/datagetter?";
    var params = {
        "range": "72",
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
            readings = $.parseJSON(response).data;
            console.log(readings);

            var currDate = getDate(readings[0].t);
            var total = 0;
            var temps = [];
            var average = 0;

            for (var i = 0; i < readings.length; i++) {
                if (getDate(readings[i].t) == currDate) { // if this reading is for the current date,
                    // add this temperature to the running total and store this reading
                    var temp = parseFloat(readings[i].v);
                    if (!isNaN(temp)) {
                        total += temp;
                        temps.push(readings[i]);
                    }

                    if (i == readings.length - 1) { // if this is the last reading,
                        // calc avg temp
                        average = total / temps.length;

                        // add to data
                        data.push({ date: currDate, temperature: average, readings: temps });
                    }
                } else {
                    // calc avg temp
                    average = total / temps.length;

                    // add to data
                    data.push({ date: currDate, temperature: average, readings: temps });

                    // move to the next date and clear old values
                    currDate = getDate(readings[i].t);
                    total = 0;
                    temps = [];

                    // add this temperature to the running total and store this reading
                    var temp = parseFloat(readings[i].v);
                    if (!isNaN(temp)) {
                        total += temp;
                        temps.push(readings[i]);
                    }
                }
            }
        })
        .done(function() {
            console.log("done");
            console.log(data);
        })
        .fail(function() {
            console.error("error");
        })
        .always(function() {
            console.log("finished");
        });

});

/* functions
---------------------------------------------------------------------*/

function getDate(t) {
    // return the date of timestamp t
    // e.g. "2016-11-02"
    return t.substr(0, 10);
}
