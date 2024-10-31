"use strict";
/////////////////////////////////////////////////////////////////////////
/* DATE/TIME FUNCTIONS */////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////

//
//  timeStamp
//
//  Return current date and time as a string 
//
function timeStamp () {
    var time = new Date();
    var hr = pad(time.getHours(), 2);
    var min = pad(time.getMinutes(), 2);
    var sec = pad(time.getSeconds(), 2);
    var ms = pad(time.getMilliseconds(), 3);
    return hr + '.' + min + '.' + sec + '.' + ms + ': ';
}

//
// IsDate
//
function IsDate(date) { date = new Date(date); if (date !== 'Invalid Date') { return true; } return false; }

//
// DateCompare(date1, date2)
//
//	returns:-1, if date1 is less than date2
//          0, if date1 is equal to date2
//          1, if date1 is greater than date2
//
function DateCompare(date1, date2) {
    var dateStatus = null;
    if (date1.getTime() < date2.getTime()) {
        dateStatus = -1;
    }
    else if (date1.getTime() == date2.getTime()) {
        dateStatus = 0;
    }
    else if (date1.getTime() > date2.getTime()) {
        dateStatus = 1;
    }
    return dateStatus;
}

//
//  CreateDate(year,month,day)
//
function CreateDate(myyear, mymonth, myday) {
    return new Date(myyear, mymonth, myday);
}

//
//  CreateDateTime(year,month,day,hour,minute,second) 
//
function CreateDateTime(myyear, mymonth, myday, myhour, myminute, mysecond) {
    return new Date(myyear, mymonth, myday, myhour, myminute, mysecond);
}

//
// Day(date)                   
//
function Day(date) { return date.getDate(); }


//
// DayOfWeek(date)         
//
function DayOfWeek(date) { return date.getDay() + 1; }


//
// DayOfWeekAsString(date)   
//
function DayOfWeekAsString(date) {
    var string = '';
    var x = date.getDay() + 1;
    if (x == 1) { string = 'Sunday'; }
    if (x == 2) { string = 'Monday'; }
    if (x == 3) { string = 'Tuesday'; }
    if (x == 4) { string = 'Wednesday'; }
    if (x == 5) { string = 'Thursday'; }
    if (x == 6) { string = 'Friday'; }
    if (x == 7) { string = 'Saturday'; }
    return string;
}


//
// DaysInMonth(date)      
//
function DaysInMonth(date) {
    var x = date.getMonth() + 1;
    if (x == 1 || x == 3 || x == 5 || x == 7 || x == 8 || x == 10 || x == 12) { return 31; }
    if (x == 2) { return 28; }
    if (x == 4 || x == 6 || x == 9 || x == 11) { return 30; }
}


//
// IsLeapYear(year)            
//
function IsLeapYear(year) {
    return (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)) ? true : false;
}


//
// Hour(date)                    
//
function Hour(date) { return date.getHours(); }

//
// Minute(date)        
//
function Minute(date) { return date.getMinutes(); }


//
// Month(date)                         
//
function Month(date) { return date.getMonth(); }


//
// Now()         
//
function Now() {
    return new Date();
}

//
// Second(date)     
//
function Second(date) { return date.getSeconds(); }

// Year(date)   
//
function Year(mydate) {
    var newDate = new Date(mydate);
    return newDate.getYear();
}

//
// Get GMT Offset
//
function GetGMTOffset() { var curDateTime = new Date(); var GMTOffset = curDateTime.getTimezoneOffset() / 60; return GMTOffset; }

//
//  Return current date
//
function nowDate() {
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var now = new Date();
    var year = now.getYear();
    if (year < 100)
    { year = year + 2000; }
    else
    { if (year >= 100 && year < 2000) { year = year + 1900; } }
    return months[now.getMonth()] + " " + now.getDate() + ", " + year;
}

//
//  Return current time
//
function nowTime() {
    var currentTime = new Date();
    return currentTime.getHours() + '.' + currentTime.getMinutes() + '.' + currentTime.getSeconds();
}

//
// Display Current Date (User's System Date)
//
function DisplayDate() {
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var now = new Date();
    var year = now.getYear();
    if (year < 100)
    { year = year + 2000; }
    else
    { if (year >= 100 && year < 2000) { year = year + 1900; } }
    document.write(months[now.getMonth()] + " " + now.getDate() + ", " + year);
}

//
// DateAdd
//
//  
//  DESCRIPTION: Adds unit of time to date.
//  RETURNS: Date/Time Object
//  PARAMETERS:	
//  datepart - 	yyyy	=	Year
//  m		=	Month
//  ww		=	Week
//  d		=	Day
//  number	 - 	Number of untis of datepart to add to date.  Positive values to get dates in future.  Negative values to get dates in past.
//  date	 -	Date/time object
//  
function DateAdd(datepart, number, date) {
    // Determine if date was passed
    if (date) {
        // ensure valid date
        date = new Date(date);
    }
    else {
        // create date
        date = new Date();

    }
    // Determine if number was passed
    if (!number) {
        // set default number
        number = 1;
    }
    // Determine DatePart
    switch (datepart) {
        case "yyyy":
            // YEAR
            date.setYear(date.getYear() + number);
            break;
        case "m":
            // MONTH
            date.setMonth(date.getMonth() + number);
            break;
        case "ww":
            // WEEK
            date.setDate(date.getDate() + number);
            break;
        case "d":
            // DAY
            date.setDate(date.getDate() + number);
            break;
        default:
            // DAY
            date.setDate(date.getDate() + number);
            break;
    }
    return date;
}

//
// 	Fix Date
// date - any instance of the Date object
// * hand all instances of the Date object to this function for "repairs"
//
function FixDate(date) { var base = new Date(0); var skew = base.getTime(); if (skew > 0) { date.setTime(date.getTime() - skew); } }
function fixDate(date) { var base = new Date(0); var skew = base.getTime(); if (skew > 0) { date.setTime(date.getTime() - skew); } }

//
//  OnReady notification
//
jQuery(document).ready(function ($) {
//    $.diagnostic('Loaded', 'DateTime.js');
})
