/*
TODOS
    -format date (month) and values (F/C)
    -fix orphan days
    -more granular view (e.g. just the readings for one day)
    -tweak mobile styling
    -station picker?
    -date/range picker?
*/

/* globals
---------------------------------------------------------------------*/
var readings;
var data = [];

var CONSTANTS = { "temp_max": 80, "temp_min": 55, "num_days": 365 };
CONSTANTS.temp_range = Math.abs(CONSTANTS.temp_max - CONSTANTS.temp_min);

var proxy = "/proxy.php";
var url = "http://tidesandcurrents.noaa.gov/api/datagetter";
var params = {
    "csurl": url,
    "range": (CONSTANTS.num_days - 2) * 24, // adjust for incomplete dates and convert to hours
    "station": "9410230",
    "product": "water_temperature",
    "datum": "MLLW",
    "units": "english",
    "time_zone": "lst",
    "application": "web_services",
    "format": "json"
};

/* document ready
---------------------------------------------------------------------*/
$(document).ready(function() {

    $.get(proxy, params, function(response) {
            readings = $.parseJSON(response).data;
            // console.log(readings);

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
                        average = Math.round(total / temps.length);
                        if (isNaN(average)) average = "N/A";

                        // add to data
                        data.push({ date: currDate, temperature: average, readings: temps });
                    }
                } else {
                    // calc avg temp
                    average = Math.round(total / temps.length);
                    if (isNaN(average)) average = "N/A";

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
            updateHTML(data);
            bindEvents();
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

function updateHTML(_data) {
    var days = "";
    for (var i = _data.length - 1; i >= 0; i--) {
        var date = "<div class='day__date'>" + formatDate(_data[i].date) + "</div>";
        var value = "<div class='day__value'>" + formatTemp(_data[i].temperature) + "</div>";
        var day = "<div class='calendar__day' style='background:" + tempToRgba(_data[i].temperature, 0.75) + "'>" + date + value + "</div>";
        days += day;
    }
    $('.calendar').append(days);
}

function bindEvents() {
    $('.calendar__day').hover(function() {
        $(this).children().toggle();
    });
}

function getDate(t) {
    // return the date of timestamp t
    // e.g. "2016-11-02"
    return t.substr(0, 10);
}

function formatDate(d) {
    var year = d.split('-')[0];
    var month = d.split('-')[1];
    var day = d.split('-')[2];
    return month + "-" + day + "-" + year;
}

function formatTemp(t) {
    // concatenate units to valid temperatures
    if (t == "N/A") return t;
    else return t + "&#176;";
}

function tempToRgba(t, a) {
    var r, b, g;
    if (Math.abs(CONSTANTS.temp_max - t) < Math.abs(CONSTANTS.temp_min - t)) { // hotter than avg
        r = Math.round(map(Math.abs(CONSTANTS.temp_max - t), CONSTANTS.temp_range / 2, 0, 0, 255));
        b = 0;
        g = 255 - r;
    } else {
        r = 0;
        b = Math.round(map(Math.abs(CONSTANTS.temp_min - t), CONSTANTS.temp_range / 2, 0, 0, 255));
        g = 255 - b;
    }
    return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
}

function map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}
