/*
TODOS
    -more granular view (e.g. just the readings for one day)
    -tweak mobile styling
    -station picker?
    -date/range picker?
*/

/* globals
---------------------------------------------------------------------*/
var readings;
var data = [];

var CONSTANTS = { "num_days": 365 };
var monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC"];

var proxy = "/proxy.php";
var url = "http://tidesandcurrents.noaa.gov/api/datagetter";
var params = {
    "csurl": url,
    "range": (CONSTANTS.num_days + 0.25) * 24, // adjust for gap years and convert to hours
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

            var currDate = new Date(readings[0].t).getDate();
            var total = 0;
            var temps = [];
            var average = 0;
            var high, low, i = 0;
            do { // set the high/low values to the first valid temp in readings
                high = low = readings[i].v;
                i++;
            } while (isNaN(readings[i].v));

            for (var i = 0; i < readings.length; i++) {
                // add a date object for this reading
                readings[i].d = new Date(readings[i].t);

                if ((readings[i].d.getDate()) == currDate) { // if this reading is for the current date,
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
                        else { // check for a new high/low
                            if (average > high) high = average;
                            else if (average < low) low = average;
                        }

                        // add to data
                        data.push({ date: formatDate(readings[i].d), temperature: average, readings: temps });
                    }
                } else {
                    // calc avg temp
                    average = Math.round(total / temps.length);
                    if (isNaN(average)) average = "N/A";
                    else { // check for a new high/low
                        if (average > high) high = average;
                        else if (average < low) low = average;
                    }

                    // add to data
                    data.push({ date: formatDate(readings[i - 1].d), temperature: average, readings: temps });

                    // move to the next date and clear old values
                    currDate = readings[i].d.getDate();
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
            // add temp values to constants
            CONSTANTS.temp_max = high + 3;
            CONSTANTS.temp_min = low - 3;
            CONSTANTS.temp_range = Math.abs(CONSTANTS.temp_max - CONSTANTS.temp_min);
        })
        .done(function() {
            console.log("done");
            console.log(data);
            updateHTML(data);
            $('.loader').fadeOut('slow');
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
    _data.length = CONSTANTS.num_days - (CONSTANTS.num_days % 7); // make sure each week has 7 days
    for (var i = _data.length - 1; i >= 0; i--) {
        var date = "<div class='day__date'>" + _data[i].date + "</div>";
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
    // e.g. "2015-11-12 04:48" --> "12"
    var d = new Date(t);
    return d.getDate();
}

function formatDate(d) {
    // return a formatted version of the date object d
    // e.g. "NOV 12 <br>2015"
    return monthNames[d.getMonth()] + " " + d.getDate() + " <br>" + d.getFullYear();
}

function formatTemp(t) {
    // concatenate unit(s) to valid temperature t
    if (t == "N/A") return t;
    else return t + "°";
    // else return t + "°F / " + toCelsius(t) + "°C";
}

function toCelsius(f) {
    return Math.round((5 / 9) * (f - 32));
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
