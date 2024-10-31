=== RHJ4 Diagnostics ===
Contributors: Bob Jones
Donate link: http://bellinghamwordpressdevelopers.com/donate
Tags: diagnostics, debugging
Requires at least: 3.0.1
Tested up to: 3.9
Stable tag: 1.7
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

RHJ4 Diagnostics supports program debugging by making it simple to write tracing information into several log files.

== Description ==

RHJ4 Diagnostics captures diagnostic messages written in PHP and conditionally directs them to various different logging functions. The plugin can be enabled or disabled during page execution, and it can intercept and handle various classes of PHP errors, e.g. E_ERROR & ~E_NOTICE. The documentation includes numerous usage examples.

Diagnostics works closely with RHJ4 Notifications. Each uses functionality in the other plugin. 

== Installation ==

1. Upload the contents of the zip file to the `/wp-content/plugins/` directory
1. Activate the plugin through the 'Plugins' menu in WordPress
1. Enable plugin using shortcodes or explicitly in your code

== Screenshots ==
screenshot-2.png
screenshot-3.png
screenshot-4.png
screenshot-5.png

== Frequently Asked Questions ==

= Why do I need this plugin? =

There are only three commonly used methods to debug code:

1.  Iteratively alter the code until you get the desired effect. 
    This is useful for fine-tuning screen layouts, but not for code bugs.

1.  Use diagnostic trace statements to capture critical flow information. 

1.  Use a debugger with breakpoints so you can stop and examine code and
    variables.

This plugin makes it simple to write diagnostic information into files on the
server and onto the browser's console log. Diagnostics on the server can be
written to multiple files simultaneously. PHP error diagnostics can be included
or excluded, and diagnostics can be enabled at specific points in your code
and disabled elsewhere.

= What makes this plugin better than simply invoking error_log? =

1. The error log file's location is defined in php.ini and, depending on your configuration, may not be visible to you.
1. You can easily enable and disable logging at various places in your code. 
1. Diagnostic statements can be written into a variety of files or even databases.
1. You can add the shortcode [rhj4_diagnostics show=true] to any page and see the entire contents of the current logfile.
1. The shortcode [rhj4_diagnostics clear=true] will delete the logfile.

= Can I enable and disable logging without having to delete all my trace statements? =

        RHJ4Diagnostics::instance('enabled'=>true|false);

= Can I selectively enable or disable PHP error messages? =
 
        $diags->option(array ('level' => E_ALL & ~E_DEPRECATED & ~E_NOTICE & ~E_STRICT);

= Will it capture All PHP diagnostics except NOTICE and STRICT messages? =

        $diags->option(array ('level' => 0);
  
= Will it disable capture of PHP diagnostics? =

= Can I label various messages so I can tell where they came from? =

        $diags = RHJ4Diagnostics::instance();
        $diags->diagnostic('Message # 1', 'FUNCTION A: ');
        ...
        $diags->diagnostic('Message # 2', 'FUNCTION B: ');
        ...
        $diags->diagnostic('Message # 3', 'FUNCTION C: ');

= Can I write some output into various different log files? =

        $diags->diagnostic('Message text', array('output'=> array(
            'function' => 'my_diagnostic_test_output', 'logfile' => 'demo.log')));

= Can I selectively enable some diagnostic messages and disable others? =

Yes. The "threshold" option determines which messages will be displayed. 
If the current threshold value is 10 and the message's threshold value is greater than 10, the message will not be logged. If the message threshold is 10 or less, it will be logged. 

        $diags = RHJ4Diagnostics::instance();
        $diags->options(array('enabled' => true, 'threshold' => 6);
        $diags->diagnostic('This message will not be logged',array('threshold'=>7));
        $diags->diagnostic('This message will be logged',array('threshold'=>5));

= Can my settings be remembered across pages? =

Yes. On the first page establish your settings like this:

        $diags = RHJ4Diagnostics::instance();
        $diags->set(array('enabled' => true, 'threshold' => 6);
    
== Changelog ==

= 1.2 =

Enhanced demo considerably.

Added jQuery support for save, clear and show functions. It can now save a diagnostic generated in jQuery or PHP.

Added rhj4_diagnostics_save, rhj4_diagnostics_show and rhj4_diagnostics_clear AJAX functions to support jQuery calls.

= 1.1 =

Added substantial shortcode support.
Added threshold option.


== Upgrade Notice ==

= 1.0 = Initial version

== Usage ==

### The Problem ###
Using trace statements is my preferred method of debugging when I am not 
exactly sure where the bug is coming from. A common method for implementing 
tracing is to use the PHP error_log function which writes a line of text 
into a specific file that is identified in the PHP.ini configuration file. 

This method is simple and effective, but there are several problems that come
along with it:

1.  You have to go back through your code later and remove the error_log calls
    or they will slow the program down and fill the error log with what are now
    useless messages.
1.  The log may also contain undesired "noise" in the form of PHP messages and
    stack dumps. Many of these you can control using the error_reporting (level)
    function, but some of these messages simply won't go away.
1.  Depending on your configuration, you may not have access to PHP.ini and you
    may not be able to see the generated log because you don't have access 
    rights to the location the log was written to.

### RHJ4Diagnostics ###

Diagnostic problems can arise in the Javascript code executing in the browser
or in PHP code executing in the server. In both cases, you want to be able to
easily capture and report the condition.

RHJ4Diagnostics reports its messages in several places: on the Browser's 
debugging console, in the PHP error_log, or to a function you specify.

Diagnostics can be turned on or off for an entire site or for a single section
of code. Since the diagnostics are very lightweight, they don't have to be 
removed from the code in order to be disabled.

### PHP API ###

The PHP code is implemented as a class with the following functions:

* instance(): Return instance of plugin (does not initialize). 
 
* init($options = NULL): Initialize plugin

* kill(): Kill current instance of plugin

* options ($options = null): parse and set options for currently loaded page

* set($options = NULL): parse and set options in wp\_options table. NOTE: Multisite is supported. Options will be set in wp\_$blog\_id\_options table.

* reset(): reset all options to their defaults

* diagnostic($message, $options = NULL): Capture a diagnostic message. NOTE: $if $options is a string, it will be treated as if it were: array('source' -> 'whatever:').

* set\_error\_reporting($level = null): Set PHP error\_reporting\_level

* render\_error\_level($level): Translate integer error_level value to string

### OPTIONS ####

The following options may be used for all functions that accept $options:

* _enabled_ enables plugin (default: false). If not enabled, no diagnostic messages will be displayed.
* _threshold_ sets a threshold that determines which messages will be logged. Messages with a threshold above the current threshold will not be written to the log file.
* _output_ identifies output handler function (default: 'rhj4_log'). Output may be a single function name or an array of function names. Function must exist to be set.
* _source_ identifies the body of code that diagnostics will be coming from. This string will be prepended to each message.
* _logfile_ identifies where output diagnostics will be saved (default: 'rhj4_diags.log').
* _level_ PHP error reporting level for PHP diagnostics (default: 71 = 64 + 4 + 2 + 1 = ERROR, WARNING, PARSE, COMPILE ERROR). PHP errors will be reported if WP_DEBUG is TRUE. RHJ4Diagnostics will be reported if plugin is enabled.

Option values are stored in the wp_options table using the key 'rhj4_diagnostic_options'.

### SHORTCODES ###


The shortcode format is: 

        [rhj4_diagnostics <code>=<value> [...]]

The following code values are supported:

**enable** [true|false<- default] Enables logging on this page.

**disable** [true|false<- default] Disables logging on this page.

**threshold** [0 | integer value] Sets diagnostic threshold level. Only messages with this threshold or lower will be logged.

**save** [true|false<- default] Used with Enable, Disable and Threshold to save settings
to database. To enable diagnostics for all pages:

    [rhj4_diagnostics enable=true save=true]

**show** [true|false<- default] Displays current log file contents.

**clear** [true|false<- default] Deletes current log file.

**options** [true|false<- default] Displays current option values on page.

**demo** [true|false<- default] Shows a demonstration of many ways of using this plugin.

**test** [true|false<- default] Performs some diagnostic tests on the code.

**options** [true|false<- default] Shows the current option values.

**verbose** [true|false<- default] Echos diagnostic information on the page.

**log** [true|false<- default] Writes a diagnostic to the log. Requires message. For example:

        [rhj4_diagnostics log=true message='log this message']

**message** = <content> is used with notify and log to define the message to be sent.

**notify** [true|false<- default] Displays a notification popup using RHJ4Notifications. Requires message and uses sticky and type.

        [rhj4_diagnostics notify=true message='show this message in popup' sticky=true, type=NOTIFICATION_TYPE_WARNING]

**sticky** [true|false<- default] is used with notify to indicate whether the notification message is "sticky", i.e. will stay visible on the screen until a page turn or the message is deleted.


**type** = <notification type> (NOTIFICATION_TYPE_CONFIRMATION<- default) indicates the type of notification to be generated.


Example:

        [rhj4_diagnostics enable=true show=true clear=true show_options=true]

Will produce:

####Options####

    array (size=6)
    'enabled' => int 1
    'threshold' => int 10
    'output' => string 'rhj4_log' (length=8)
    'source' => string 'DIAG: ' (length=6)
    'logfile' => string 'rhj4_diags.log' (length=14)
    'level' => int 71
    Logfile: D:\ApacheHtdocs\bhamwpdev/wp-content/rhj4_diags.log

    09/14/14 04:56:09->DIAG: Page Name [] User [bob_jones]
    09/14/14 04:56:55->DIAG: Page Name [diags] User [bob_jones]

    rhj4_diags.log deleted


Example:

        [rhj4_diagnostics notify=true message="this is a notification" verbose=true]

Will generate a popup window containing the notification message.

NOTE: Use of the notify function requires the installation of the RHJ4 Notifications plugin.

DEMONSTRATION Page: Visit [http://bellinghamwordpressdevelopers.com/diags](http://bellinghamwordpressdevelopers.com/diags) for a demonstration of these shortcodes in action. 

### EXAMPLES ###

There are two basic ways to invoke this plugin:

1. Call rhj4_diagnostic and pass in the message and (optionally) any options

1. Acquire an instance of the plugin and work with that:

    $diags = RHJ4Diagnostics::instance();

    $diags holds an instance of the diagnostics object and can be used to invoke methods in the object.

These two lines are equivalent:

        $diags->diagnostic('message','SOURCE: ');
        $diags->diagnostic('message', array('source' => 'SOURCE: '));

Enable plugin for this page and print a message:

        $diags->diagnostic('message', 
            array('source' => 'SOURCE: ', 'enabled' => true));

This code:

        rhj4_diagnostic('this is a message');

Will produce this output in the current log file:

    08/13/14 23:36:44->DIAGNOSTICS:this is a message

This example:

        $diags = RHJ4Diagnostics::instance();
        $diags = RHJ4Diagnostics::instance()->init(array (
            'enabled'   => true,
            'threshold' => 10,
            'output'    => 'rhj4_log',
            'source'    => 'DIAGNOSTICS:',
            'logfile'   => 'rhj4_diags.log',
            'level'     => E_ALL & ~E_DEPRECATED & ~E_NOTICE & ~E_STRICT
        ));
    
        $diags->diagnostic($diags->plugin_slug.' enabled');

Will:

+ Enable the plugin.
+ Set the message threshold to 10.
+ Set the output logging function ('rhj4_log).
+ Identify the logging file ('rhj4_diags.log'). 
+ Tell the plugin to report all PHP errors except E\_DEPRECATED, E\_NOTICE and E\_STRICT.
+ Write a line in the output file like this:

    08/13/14 23:36:42->DIAGNOSTICS:rhj4_diagnostics enabled

#### Demo Code ####

Add this line of code (or uncomment the line in the plugin source):

        add_action('init','rhj4_diagnostics_demo');

and the plugin will execute code in the function rhj4_diagnostics_demo:
    
Get an instance of this plugin:

        $diags = RHJ4Diagnostics::instance();
  
Reset option settings to their defaults. The reset values are remembered in wp_options:

        $diags->clear_log();
        $diags->reset();
        $options = $diags->options();
        var_dump($options);

    
After reset, plugin will not be enabled, so this next message won't show:

        $message = rhj4_diagnostic('This message will NOT appear in the log.');    
        var_dump($message);
    
Enable plugin and change the source message:

        $message = $diags->diagnostic('This message WILL appear in log', array(
           'enabled'    => true,
       'source'     => 'DEMO: '
        ));
    
        $options = $diags->options();
        var_dump($message);
        var_dump($options);
    
        $message = $diags->diagnostic('Turn on reporting of PHP Errors', array(
            'level' => E_ALL ));
    
        $options = $diags->options();
        var_dump($message);
        var_dump($options);
  
        rhj4_diagnostic('End of demo','THE END: ');


#### Custom Output Handlers ####

You can write your own output handlers that will direct diagnostics to any file (or database table) that you want. Here is an example:

        function my_diagnostic_test_output($message, $logfile = 'rhj4_diags_test.log') {
            $timestamp = date('m/d/y H:i:s',time());
            $file = fopen($logfile,"a+");
            fwrite($file, $timestamp.'->'.$message."\n");
            fclose($file);
        }


#### Multiple Output Handlers ####

    //
    //  This example writes the output to two log files 
    //
        rhj4_diagnostic('more complex message', array(
            'source' =>'MULTIPLE FUNCTIONS: ',
            'output' => array(
                array(  'function' => 'my_diagnostic_test_output', 
                        'logfile' => 'rhj4_diags_test.log'),
                array(  'function' => 'rhj4_log', 
                        'logfile' => 'rhj4_diags.log')
            )));

  
### SUPPORT ###

I will attempt to answer your email as quickly as I can, but cannot promise immediate response.

I will entertain ideas for enhancements, especially if I hear the same request from multiple people.

Donations will encourage my support... and my thanks.


### CONSULTING ###

I make my living by helping WordPress developers. If I can help you, please contact me.

Bob Jones

[bob@rhj4.com](mailto:bob@rhj4.com)

[http://bellinghamwordpressdevelopers.com/](http://bellinghamwordpressdevelopers.com/)

