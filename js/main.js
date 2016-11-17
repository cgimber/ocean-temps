/*
TODOS
    -about modal
    -more granular view (e.g. just the readings for one day)?
    -date/range picker?
*/

/* globals
---------------------------------------------------------------------*/
var readings, data;

var CONSTANTS = { "num_days": 365 };
var monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEPT", "OCT", "NOV", "DEC"];
var stations = {
    "La Jolla, CA": "9410230",
    "San Diego, CA": "9410170",
    "Los Angeles, CA": "9410660",
    "Santa Monica, CA": "9410840",
    "Port San Luis, CA": "9412110",
    "Monterey, CA": "9413450",
    "San Francisco, CA": "9414290",
    // "Point Reyes, CA": "9415020",
    // "Arena Cove, CA": "9416841",
    // "North Spit, CA": "9418767",
    // "Cresent City, CA": "9419750",
    "Point Orford, OR": "9431647",
    "Charleston, OR": "9432780",
    "South Beach, OR": "9435380",
    "Astoria, OR": "9439040",
    // "Toke Point, WA": "9440910",
    // "Westport, WA": "9441102",
    "La Push, WA": "9442396",
    // "Neah Bay, WA": "9443090",
    "Port Angeles, WA": "9444090",
    "Seattle, WA": "9447130"
};

var proxy = "";
var currURL = window.location.protocol + "//" + window.location.host + "/" + window.location.pathname;
if (currURL.endsWith('/')) proxy = currURL + "proxy.php";
else proxy = currURL.replace("index.html", "proxy.php");
// console.log("via " + proxy);

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
    loadStations();
    bindEvents();
    update();
});

/* functions
---------------------------------------------------------------------*/
function update() {
    $.get(proxy, params, function(response) {
            readings = $.parseJSON(response).data;
            // console.log(readings);
            // params.format = "xml";
            // console.log(url + "?" + $.param(params));
            // params.format = "json";

            data = [];
            var currDate = getDate(readings[0].t);
            var total = 0;
            var temps = [];
            var average = 0;
            var high, low;

            // set the high/low values to the first valid temp in readings
            for (var j = 0; j < readings.length; j++) {
                var temp = parseFloat(readings[j].v);
                if (!isNaN(temp)) {
                    high = low = temp;
                    break;
                }
            }

            for (var i = 0; i < readings.length; i++) {

                // add a date object for this reading
                readings[i].d = new Date(formatTimeStamp(readings[i].t));

                if ((readings[i].d.getDate()) === currDate) { // if this reading is for the current date,
                    // add this temperature to the running total and store this reading
                    var temp = parseFloat(readings[i].v);
                    if (!isNaN(temp)) {
                        total += temp;
                        temps.push(readings[i]);
                    }

                    if (i === readings.length - 1) { // if this is the last reading,
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
                } else { // this reading is for a new date
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
            // station log
            console.log(getKeyByValue(stations, params.station));
            console.log(formatTemp(low) + " - " + formatTemp(high));
            console.log((data.length - 1) + " days");
        })
        .done(function() {
            console.log(data);
            updateCalendar(data);
            $('.loader').fadeOut('slow');
        })
        .fail(function() {
            console.error("error");
        })
        .always(function() {
            console.log("finished");
        });
}

function loadStations() {
    $.each(stations, function(station, id) {
        var option = "<option value=" + id + ">" + station + "</option>";
        $('.stations').append(option);
    });
    $('.container').css("margin-top", $('header').outerHeight());
}

function updateCalendar(_data) {
    var numOrphans = _data.length % 7; // make sure each week has 7 days
    for (var i = _data.length - 1; i >= numOrphans; i--) {
        var date = "<div class='day__date'>" + _data[i].date + "</div>";
        var value = "<div class='day__value'>" + formatTemp(_data[i].temperature) + "</div>";
        var day = "<div class='calendar__day' style='background:" + tempToRgba(_data[i].temperature, 0.75) + "'>" + date + value + "</div>";
        $('.calendar').append(day);
    }
    $('.day__value').addClass(function() {
        if ($(this).text() === "N/A")
            return "day__value--none";
    });
    $('.calendar__day').hover(function() {
        $(this).children().toggle();
    });
}

function bindEvents() {
    $('header').headroom({
        "offset": $('header').outerHeight(),
        "tolerance": 5,
        "classes": {
            "initial": "animated",
            "pinned": "slideDown",
            "unpinned": "slideUp"
        }
    });
    $(window).resize(function() {
        $('.container').css("margin-top", $('header').outerHeight());
    });
    $('.stations').change(function(event) {
        $('.loader').show();
        $('.calendar').html("");
        params.station = $(this).val();
        update();
    });
}

function formatTimeStamp(t) {
    // replace all dashes with slashes for proper parsing
    // e.g. "2015-11-12 04:48" --> "2015/11/12 04:48"
    return t.replace(/-/g, '/');
}

function getDate(t) {
    // return the date of timestamp t
    // e.g. "2015-11-12 04:48" --> "12"
    var d = new Date(formatTimeStamp(t));
    return d.getDate();
}

function formatDate(d) {
    // return a formatted version of the date object d
    // e.g. "NOV 12 <br>2015"
    return monthNames[d.getMonth()] + " " + d.getDate() + " <br>" + d.getFullYear();
}

function formatTemp(t) {
    // concatenate unit(s) to valid temperature t
    if (t === "N/A") return t;
    else return t + "°F";
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

function getKeyByValue(object, value) {
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            if (object[key] === value)
                return key;
        }
    }
}
