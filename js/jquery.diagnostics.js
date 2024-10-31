/******************************************************************************
//
//  DIAGNOSTIC MESSAGING PLUGINS
//
*******************************************************************************
//
//  Author: Bob Jones
//
//  History:
//      Version Created By      Comments
//      V0.1    9/11/13 BJ      Extracted from old globals.js and cleaned up
//                              and incorporated several related functions.
//      V0.2    9/13/13 BJ      Tested and cleaned up some bugs
//
//      V1.0    9/19/14 BJ      Submitted to WordPress
//      V1.1    9/20/14 BJ      Small cosmetic fixes
//      V1.2    9/22/14 BJ      Add save, clear and show as AJAX functions
//
//  Usage:
//
//      To log a message: $.diagnostic('this is a message');
//
//      To log a message and identify where it came from: $('message','source')
//
//      To get current settings: var settings = $.diagnostic();
//
//      To get current version: $.diagnostic().version
//
********************************************************************************/
(function ($) { // Hide scope, no $ conflict
    var version = '0.5';
    
    //
    //  Write a diagnostic message onto the console
    //
    //  if message is an object, then settings are ignored 
    //      because message contains the settings and these
    //      will be merged with the current settings and
    //      returned from this function.
    //
    //  options are stored in $.data and remembered once set.
    //
    //  if message is a string, then the formatted message
    //  will be displayed on the console.
    //
    //  if message is empty, then the current options will
    //  be returned.
    //
    //  if settings is an object, then these settings will
    //  be used to write this message, they will update the
    //  default options.
    //
    //  if settings is a string, then it will be presumed
    //  to be an identifier for the caller that is writing
    //  this message.
    //
    //  if settings is undefined and options.showParent is true,
    //  then we will set source to our caller. If we cannot
    //  find our caller, we will set source = 'anonymous'.
    //  
    //  if source !== undefined, it will be prepended to message.
    //
    //  if options.showTimeStamp, a timestamp will prepend the message.
    //
    //  if handler !== undefined, it will be called and passed
    //  the message. Whatever this handler returns will be returned
    //  by this code.
    //

    /**********************************************************************************************
    //
    //  DIAGNOSTIC
    //
    //  Initialize any missing values and display message if defined
    //
    ***********************************************************************************************/
    $.diagnostic = function (message, settings) {
        var options = $.diagnostic.defaults();

        //
        //  If no arguments, then return options
        //
        if (typeof message === 'object') {
            __extend(options, message);
            options['message'] = message['notification'];
        } else if (typeof message === 'string') {
            options['message'] = message;
            if (settings && typeof settings === 'object') {
                __extend(options, settings);
            } else if (typeof settings === 'string') {
                options['source'] = settings;
            }
        }

        if (options.message === undefined) {
            return options;
        }

        //
        //  Determine source 
        //
        if (options.source === undefined || options.source.length === 0) {
            options.source = 'log';
        }

        if (options.exception) {
            //
            //  Throw an exception
            //
            throw options.source + ':' + options.message;
        }

        if (options.alert) {
            //
            //  Show alert message
            //
            alert(options.source + ':' + options.message);
            return options.message;
        }

        //
        //  Determine what code will handle the diagnostic
        //
        var handler = options.messageHandler;
        if (!handler || typeof handler !== 'function') {
            handler = _log;
        }

        //
        //  Handle the message
        //
        return handler(options.message, options.source);

        //
        //  Option extender
        //
        function __extend(settings) {
            $.each(settings, function (key, value) {
                switch (key) {
                    case 'version': // Version is read-only
                        break;

                    case 'enabled':
                    case 'exception':
                    case 'alert':
                    case 'showParent':
                    case 'showTimeStamp':
                        if (typeof value === 'boolean') {
                            options[key] = value;
                        }
                        break;

                    case 'messageHandler':
                        if (typeof value === 'function') {
                            options[key] = value;
                        }
                        break;

                    default:
                        options[key] = value;
                        break;
                }
            });
        }

        //        
        //  Default message handler
        //
        function _log(msg, source) {

            function __log(msg) {
                window.console.log(msg);
            }

            if (source !== undefined) {
                msg = source + ': ' + msg;
            }

            if (options.showPageName) {
                msg = $.diagnostic.pageName() + msg;
            }

            if (options.showTimeStamp) {
                msg = timeStamp() + msg;
            }

            if (options.enabled === true) {
                if (typeof console === "undefined" || typeof console.log === "undefined") {
                    console = {};
                    console.log = function () {
                    };
                }

                if (window.console) { }
                __log(msg);
            }

            //
            //  Return the formatted message to the caller
            //
            return msg;
        }
    }

    $.diagnostic.defaults = function () {
        return {
            version: version,           //  current version of code
            enabled: true,              //  if true, message will be written messageHandler event 
            message: undefined,         //  message to be written
            messageHandler: undefined,  //  jandler to write message - defaults to internal handler
            source: undefined,          //  source of message
            exception: false,           //  if true, throw exception after writing message
            alert: false,               //  if true, show alert(message) after writing message
            showParent: true,           //  if true, set source to name of function that called us
            showTimeStamp: true,        //  if true, prepend each message with a timestamp
            showPageName: true          //  if true, prepend each message with the current page name
        };
    }

    $.diagnostic.option = function (key) {
        var options = $.diagnostic.defaults();
        return options[key];
    }

    //
    //  Look at the arguments parameter and find the
    //  name of the callee of the function that called
    //  this function
    //
    $.diagnostic.callerName = function () {
        var caller = arguments.callee.caller.caller;
        if (caller === undefined || caller == null) {
            return '';
        }
        return $.diagnostic.objectName(caller);
    }

    //
    //  Determine and return the name of the object
    //
    $.diagnostic.objectName = function (object) {
        var name;

        switch ($.type(object)) {
            case 'function':
                name = object.toString();
                name = name.substr('function '.length);
                name = name.substr(0, name.indexOf('('));
                break;

            case 'object':
                name = object.id;
                break;

            default:
                break;
        };

        return name;
    }

    //
    //  return current page name
    //
    //  Extention == true --> include file extension
    $.diagnostic.pageName = function (options) {
        var defaults = {
            url: false,         //  if true, return full path name
            extension: false,   //  if true, include file extension
            append: ': '        //  string to append to end of file name
        }
        options = $.extend(defaults, options);
        var name = '';
        var append = (options.append) ? options.append : '';

        var currurl = window.location.pathname;
        if (options.url) {
            name = currurl;
        } else {

            var index = currurl.lastIndexOf("/") + 1;
            var filenameWithExtension = currurl.substr(index);
            if (!options.extension) {
                name = filenameWithExtension;
            } else {
                name = filenameWithExtension.split(".")[0];
            }
        }
        return name + append;
    }

    ///////////////////////////////////////////////////////////////////////
    //
    //  SAVE
    //
    //  Queue a message for display the next time the code
    //  asks for messages. This can be useful during page turns
    //
    $.diagnostic.save = function (message, source, output, handler) {
        if (message === undefined) {
            message = 'Demonstration Message';
        }
        
        if (source === undefined) {
            source = 'DEMO: ';
        }
        
        if (output === undefined) {
            output = 'rhj4_log';
        }
        
        do_ajax({
            action: "rhj4_diagnostics_save", 
            message: message, 
            source: source, 
            output: output
        }, function(result) {
            if (handler) {
                handler(result);
            } else if (result) {
                $.diagnostic('Diagnostic Save result: [' + result + ']');
            }
        });
    }
    
    $.diagnostic.show = function (handler) {
        do_ajax({
            action: "rhj4_diagnostics_show"
        }, function(result) {
            if (handler) {
                handler(result);
            } 
        });
    }

    $.diagnostic.clear = function (handler) {
        do_ajax({
            action: "rhj4_diagnostics_clear"
        }, function(result) {
            if (handler) {
                handler(result);
            }
        });
    }
    
    //
    //
    //  Perform diagnostic tests on this plugin
    $.diagnostic.test = function () {
        $.diagnostic('message');
        $.diagnostic('message', 'source');
        $.diagnostic({ message: 'message', source: 'source', messageHandler: function (msg) { console.log('console: ' + msg) } });
        $.diagnostic({ message: 'this is an alert', source: 'from space', alert: true });

    }
    ///////////////////////////////////////////////////////////////////////
    //
    //  PRIVATE FUNCTIONS
    //
    //  do_ajax (args, handler)
    //  args: data passed to server
    //  handler: function to call with returned data
    //
    ///////////////////////////////////////////////////////////////////////
    function do_ajax(args, handler) {
        var ajaxurl = jQuery('input#hid_admin_url').val();
        if (ajaxurl === undefined) {
            alert('ajaxurl undefined');
            return;
        }
        
//        jQuery.post(ajaxurl,args,function(results) {
//            if (handler!== undefined) {
//                handler(results);
//            }
//        })
//        return false;
        
        try {
            $.diagnostic('ajax url: [' + ajaxurl + '] data: [' + args + '] ');
            jQuery.ajax({
                type: "post",
                data: args,
                async: false,
                url: ajaxurl,
                success: function(results) {
                    if (handler!== undefined) {
                        handler(results);
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    if (xhr.status != 0) {
                        var msg = ' (' + xhr.status + ') ';
                        if (textStatus) msg += ': ' + textStatus;
                        if (xhr.status < 200) {
                            msg = 'AJAX Informational ' + msg;
                        } else if (xhr.status < 300) {
                            msg = 'AJAX Success ' + msg;
                        } else if (xhr.status < 400) {
                            msg = 'AJAX Redirection ' + msg;
                        } else if (xhr.status < 500) {
                            msg = 'AJAX Client Error' + msg;
                        } else {
                            msg = 'AJAX Server Error' + msg;
                        }
                        jQuery.diagnostic(msg);
                    } else {
                        jQuery.diagnostic(errorThrown);
                    }
                }
            });
        }
        catch (err) {
            //Handle errors here
            $.diagnostic('Notifications Error: ' + err, 'jGrowl');
            return -1;
        }
    }
})(jQuery);

//
//  OnReady notification
//
jQuery(document).ready(function ($) {
})
