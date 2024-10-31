"use strict";
/////////////////////////////////////////////////////////////////////////
/* STRING FUNCTIONS *///////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////			

//
// Len(string)
//
function Len(string) {
    return string.length;
}

//
//  Pad the leading edge of a string with character
//
//  string: the string to pad
//  length: the desided length of the resulting string
//  padWith: that padding character. Defaults to '0'
//
function pad(string, length, padWith) {
    var output = string.toString();
    if (!padWith) { padWith = '0'; }
    while (output.length < length) {
        output = padWith + output;
    }
    return output;
}

//
// Encrypt  
//
function Encrypt(string, key) {
    Ref = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz._~"
    key = parseInt(key)
    var Temp = ""
    for (Count = 0; Count < string.length; Count++) {
        var TempChar = string.substring(Count, Count + 1)
        var Conv = Ref.indexOf(TempChar)
        var Cipher = Conv ^ key
        Cipher = Ref.substring(Cipher, Cipher + 1)
        Temp += Cipher
    }
    return (Temp)
}

//
// Asc(string) - Determines the value of a character
//
function Asc(string) {
    return string.charCodeAt(0);
}

//
// Change Case
//
function ChangeCase(string, Case) {
    var returnVar;
    switch (Case) {
        case "upper":
            //  UPPER CASE
            returnVar = string.toUpperCase();
            break;
        case "lower":
            // lower case
            returnVar = string.toLowerCase();
            break;
        case "title":
            // Title Case
            returnVar = string.toLowerCase().replace(/^(.)|\s(.)/g,
                function ($1) { return $1.toUpperCase(); });
            break;
    }
    return returnVar;
}

//
// Chr(number)  - Converts a numeric value to a UCS-2 character 
//
function Chr(number) { return String.fromCharCode(number); }

//
//  CJustify(string, length) - Centers a string in a field length
//
function CJustify(mystring, number) {
    NoOfCharsToAdd = Math.floor((number - mystring.length) / 2);
    for (i = 0; i < NoOfCharsToAdd; i++) {
        mystring = ' ' + mystring + ' ';
    }
    if (mystring.length < number) { mystring += ' ' };
    return mystring;
}

//
// CLEAN MSWORD
//
function CleanMSWord(string) {
    // debug for new codes
    // for (i = 0; i < input.length; i++)  alert("'" + input.charAt(i) + "': " + input.charCodeAt(i));
    var swapCodes = new Array(8211, 8212, 8216, 8217, 8220, 8221, 8226, 8230); // dec codes from char at
    var swapStrings = new Array("--", "--", "'", "'", '"', '"', "*", "...");
    var CleanString = string;
    for (i = 0; i < swapCodes.length; i++) {
        var swapper = new RegExp("\\u" + swapCodes[i].toString(16), "g"); // hex codes
        CleanString = CleanString.replace(swapper, swapStrings[i]);
    }
    return CleanString;
}

//
// CLEAN MSWORD HTML	
//
function CleanMSWordHTML(str) {
    str = str.replace(/<o:p>\s*<\/o:p>/g, "");
    str = str.replace(/<o:p>.*?<\/o:p>/g, "&nbsp;");
    str = str.replace(/\s*mso-[^:]+:[^;"]+;?/gi, "");
    str = str.replace(/\s*MARGIN: 0cm 0cm 0pt\s*;/gi, "");
    str = str.replace(/\s*MARGIN: 0cm 0cm 0pt\s*"/gi, "\"");
    str = str.replace(/\s*TEXT-INDENT: 0cm\s*;/gi, "");
    str = str.replace(/\s*TEXT-INDENT: 0cm\s*"/gi, "\"");
    str = str.replace(/\s*TEXT-ALIGN: [^\s;]+;?"/gi, "\"");
    str = str.replace(/\s*PAGE-BREAK-BEFORE: [^\s;]+;?"/gi, "\"");
    str = str.replace(/\s*FONT-VARIANT: [^\s;]+;?"/gi, "\"");
    str = str.replace(/\s*tab-stops:[^;"]*;?/gi, "");
    str = str.replace(/\s*tab-stops:[^"]*/gi, "");
    str = str.replace(/\s*face="[^"]*"/gi, "");
    str = str.replace(/\s*face=[^ >]*/gi, "");
    str = str.replace(/\s*FONT-FAMILY:[^;"]*;?/gi, "");
    str = str.replace(/<(\w[^>]*) class=([^ |>]*)([^>]*)/gi, "<$1$3");
    str = str.replace(/<(\w[^>]*) style="([^\"]*)"([^>]*)/gi, "<$1$3");
    str = str.replace(/\s*style="\s*"/gi, '');
    str = str.replace(/<SPAN\s*[^>]*>\s*&nbsp;\s*<\/SPAN>/gi, '&nbsp;');
    str = str.replace(/<SPAN\s*[^>]*><\/SPAN>/gi, '');
    str = str.replace(/<(\w[^>]*) lang=([^ |>]*)([^>]*)/gi, "<$1$3");
    str = str.replace(/<SPAN\s*>(.*?)<\/SPAN>/gi, '$1');
    str = str.replace(/<FONT\s*>(.*?)<\/FONT>/gi, '$1');
    str = str.replace(/<\\?\?xml[^>]*>/gi, "");
    str = str.replace(/<\/?\w+:[^>]*>/gi, "");
    str = str.replace(/<H\d>\s*<\/H\d>/gi, '');
    str = str.replace(/<H1([^>]*)>/gi, '');
    str = str.replace(/<H2([^>]*)>/gi, '');
    str = str.replace(/<H3([^>]*)>/gi, '');
    str = str.replace(/<H4([^>]*)>/gi, '');
    str = str.replace(/<H5([^>]*)>/gi, '');
    str = str.replace(/<H6([^>]*)>/gi, '');
    str = str.replace(/<\/H\d>/gi, '<br>'); //remove this to take out breaks where Heading tags were
    str = str.replace(/<(U|I|STRIKE)>&nbsp;<\/\1>/g, '&nbsp;');
    str = str.replace(/<(B|b)>&nbsp;<\/\b|B>/g, '');
    str = str.replace(/<([^\s>]+)[^>]*>\s*<\/\1>/g, '');
    str = str.replace(/<([^\s>]+)[^>]*>\s*<\/\1>/g, '');
    str = str.replace(/<([^\s>]+)[^>]*>\s*<\/\1>/g, '');
    //some RegEx code for the picky browsers
    var re = new RegExp("(<P)([^>]*>.*?)(<\/P>)", "gi");
    str = str.replace(re, "<div$2</div>");
    var re2 = new RegExp("(<font|<FONT)([^*>]*>.*?)(<\/FONT>|<\/font>)", "gi");
    str = str.replace(re2, "<div$2</div>");
    str = str.replace(/size|SIZE = ([\d]{1})/g, '');
    return str;
}

//
//  Compare(string1,string2)
//
function Compare(string1, string2) {
    if (string1 == string2) {
        x = 0
    }
    else {
        for (i = 0; i < Math.max(string1.length, string2.length); i++) {
            if (string1.charCodeAt(i) != string2.charCodeAt(i)) {
                if (string1.charCodeAt(i) < string2.charCodeAt(i)) { x = -1; };
                if (string1.charCodeAt(i) > string2.charCodeAt(i)) { x = 1; };
                break;
            }
        }
    }
    return x;
}

//
//  CompareNoCase(string1,string2)
//
function comparenocase(string1, string2) {
    string1 = string1.toUpperCase();
    string2 = string2.toUpperCase();
    if (string1 == string2) {
        x = 0
    }
    else {
        for (i = 0; i < Math.max(string1.length, string2.length); i++) {
            if (string1.charCodeAt(i) != string2.charCodeAt(i)) {
                if (string1.charCodeAt(i) < string2.charCodeAt(i)) { x = -1; };
                if (string1.charCodeAt(i) > string2.charCodeAt(i)) { x = 1; };
                break;
            }
        }

    }
    return x;
}

//
//  Find(substring, string [, start ])         
//
function Find(mysubstring, string, start) {
    if (!start) { var start = 0; }
    else { start = start - 1; }
    return string.indexOf(mysubstring, start) + 1;
}

//
//  FindNoCase(substring, string [, start ])           
//
function FindNoCase(mysubstring, string, mystart) {
    if (!mystart) { var mystart = 0; }
    else { mystart = mystart - 1; }
    string = string.toUpperCase()
    mysubstring = mysubstring.toUpperCase()
    return string.indexOf(mysubstring, mystart) + 1;
}

//
// Insert(substring, string, position)     
//
function Insert(mysubstring, mystring, position) {
    return mystring.substring(0, position) + mysubstring + mystring.substring(position, mystring.length);
}

//
// LCase(string)  
//
function LCase(string) {
    return string.toLowerCase();
}

//
// LEFT & RIGHT FUNCTIONS	
//
// Left
//
function Left(str, n) {
    if (n <= 0)
        return "";
    else if (n > String(str).length)
        return str;
    else
        return String(str).substring(0, n);
}

//
// Right
//
function Right(str, n) {
    if (n <= 0)
        return "";
    else if (n > String(str).length)
        return str;
    else {
        var iLen = String(str).length;
        return String(str).substring(iLen, iLen - n);
    }
}

//
// LJustify(string, length)   
//
function LJustify(mystring, number) {
    NoOfCharsToAdd = number - mystring.length
    for (i = 0; i < NoOfCharsToAdd; i++) {
        mystring = ' ' + mystring;
    }
    return mystring
}

//
// Mid(string, start, count)           
//
function Mid(string, start, count) {
    return string.substr(start - 1, count);
}

//
// RepeatString(string, count)
//
function RepeatString(string, count) {
    var _NewString = '';
    for (i = 0; i < count; i++) { _NewString += string }
    return _NewString;
}

//
// RemoveChars(string, start, count)
//
function RemoveChars(mystring, start, count) {
    new_string = mystring.slice(0, start - 1);
    new_string2 = mystring.slice(start + count - 1);
    return new_string + new_string2;
}


//
// Remove Spaces - Removes spaces from string
//
function removeSpaces(string) {
    return string.split(' ').join('');
}

//
// Replace(string, substring1, substring2 , scope)  
//
function Replace(string, substring1, substring2, scope) {
    if (!scope) { scope = '1' };
    if (scope.toUpperCase() != 'ALL') { scope = '1' };
    re = '/' + substring1;
    if (scope == '1') {
        re += '/';
    }
    else {
        re += '/g';
    }
    new_string = string.replace(eval(re), substring2);
    return new_string;
}

//
// ReplaceNoCase(string, substring1, substring2 , scope )
//
function ReplaceNoCase(string, substring1, substring2, scope) {
    if (!scope) { scope = '1' };
    if (scope != 'ALL') { scope = '1' };
    re = '/' + substring1
    if (scope == '1') {
        re += '/i';
    }
    else {
        re += '/gi';
    }
    new_string = string.replace(eval(re), substring2);
    return new_string;
}

//
// ReReplace(string, reg_expression, substring2 , scope )                  
//
function ReReplace(mystring, reg_expression, substring2, scope) {
    if (!scope) { scope = 'ONE' };
    if (scope != 'ALL') { scope = 'ONE' } else { reg_expression = reg_expression + '/g' };
    new_string = mystring.replace(reg_expression, substring2);
    return new_string;
}

//
// ReReplaceNoCase(string, reg_expression, substring2 , scope )                  
//
function ReReplaceNoCase(mystring, reg_expression, substring2, scope) {
    if (!scope) { scope = 'ONE' };
    if (scope != 'ALL') {
        reg_expression = '/' + reg_expression + '/i'
    }
    else {
        reg_expression = '/' + reg_expression + '/gi'
    }
    new_string = mystring.replace(eval(reg_expression), substring2);
    return new_string;
}

//
// Reverse(string)        
//
function Reverse(mystring) {
    var _TempNewString = '';
    for (i = 0; i < mystring.length; i++) {
        _TempNewString = mystring.charAt(i) + _TempNewString;
    }
    return _TempNewString;
}

//
// RJustify(string, length)      
//
function RJustify(mystring, number) {
    NoOfCharsToAdd = number - mystring.length;
    for (i = 0; i < NoOfCharsToAdd; i++) { mystring = mystring + ' ' };
    return mystring;
}

//
// STRIP WHITE-SPACE
//
function StripWhiteSpace(stringToStrip) {
    var StrippedString;
    StrippedString = stringToStrip.replace(/^\s*/, "").replace(/\s*$/, "");
    StrippedString = StrippedString.replace(/\s{2,}/, " ");
    return StrippedString;
}

//
// STRIP HTML
//
function StripHTML(stringToStrip) {
    var StrippedString;
    StrippedString = stringToStrip.replace(/<\/?[^>]*>/gm, " ");
    return StrippedString;

}


//
// STRIP PUNCTUATION
//
function StripPunctuation(stringToStrip) {
    var StrippedString;
    StrippedString = stringToStrip.replace(/\./g, " ");
    StrippedString = StrippedString.replace(/[\u0000-\u0019\u0021-\u002F\u003a-\u003f\u005b-\u0060\u007b-\u007f\u00a1-\u00bf\u02c6-\u0385\u2018\u0060]/g, "");
    return StrippedString;
}

//
// TRIM FUNCTIONS
//
// Trim
function Trim(stringToTrim) { if (stringToTrim.length > 0) { return stringToTrim.replace(/^\s+|\s+$/g, ""); } else { return stringToTrim; } }
function trim(stringToTrim) { if (stringToTrim.length > 0) { return stringToTrim.replace(/^\s+|\s+$/g, ""); } else { return stringToTrim; } }

//
// LTrim
//
function LTrim(stringToTrim) { return stringToTrim.replace(/^\s+/, ""); }
function ltrim(stringToTrim) { return stringToTrim.replace(/^\s+/, ""); }

//
// RTrim
//
function RTrim(stringToTrim) { return stringToTrim.replace(/\s+$/, ""); }
function rtrim(stringToTrim) { return stringToTrim.replace(/\s+$/, ""); }

//
// UCase(string) 
//
function UCase(string) {
    return string.toUpperCase();
}

//
// Val(string)  - Converts numeric characters that occur at the begining of a string to a number. 
//
function Val(myString) {
    newstring = ""
    for (i = 0; i < myString.length; i++) {
        if (myString.charAt(i) == '1'
        || myString.charAt(i) == '2'
        || myString.charAt(i) == '3'
        || myString.charAt(i) == '4'
        || myString.charAt(i) == '5'
        || myString.charAt(i) == '6'
        || myString.charAt(i) == '7'
        || myString.charAt(i) == '8'
        || myString.charAt(i) == '9'
        || myString.charAt(i) == '0'
        || myString.charAt(i) == '.'
        || myString.charAt(i) == '+'
        || myString.charAt(i) == '-') {
            newstring += myString.charAt(i)
        }
        else { break; }
    }
    return newstring;
}

//
// Convert Currency to Number	
//
function ConvertCurrencyToNumber(value) {
    //Default 
    num = 0;
    //Strip Dollar Sign
    value = value.replace(/\$/g, '');
    // Strip Commas
    temp = new RegExp(",", "g");
    num = value.replace(temp, "");
    num = num.replace('\\', "");
    num = Number(num);
    return num;
}

//
// Determine if sting is valid url		
//
function isUrl(string) {
    var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    return regexp.test(string);
}

// SafeEmail
//
// Prevents machines from grabbing e-mail addresses from website
// <script language="JavaScript">SafeEmail('John_Smith','SomeSite.com','Subject Line','Link Text');</script>
//
function SafeEmail(EmailName, DomainName, SubjectLine, VisibleLink) {
    if (VisibleLink == "")
    { VisibleLink = EmailName + '@' + DomainName };
    document.write('<a href=mailto:' + EmailName + '@' + DomainName + '?Subject=' + SubjectLine + '>' + VisibleLink + '</a>');
}

//
//  OnReady notification
//
jQuery(document).ready(function ($) {
//    $.diagnostic('Loaded', 'Strings.js');
})
