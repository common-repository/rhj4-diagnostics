<?php
/*
Plugin Name: RHJ4 Diagnostics
Plugin URI: http://bellinghamwordpressdevelopers.com/demonstrations/
Description: Generates diagnostic message on browser console and in php error_log (if defined).
Version: 1.2
Author: Bob Jones
Author Email: bob@rhj4.com
License:

  Copyright 2014 Bob Jones (bob@rhj4.com)

  This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU General Public License, version 2, as 
  published by the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software
  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

Usage:
    See readme.txt for usage examples.
    
    Simple form:
        rhj4_diagnostic('my message...');
  
    Explicit initialization:
        rhj4_diagnostic_initialize($options);
 
        where $options is an array containing these key-value pairs:
            enabled = 1 or 0
            threshold = any int (defaults to 10). If current message's
                        threshold is greater than object's message threshold
                        message will not be written.
            output = function name(s) to which output will be passed
            source = name of message source; EX: 'MY DIAGS: '
            logfile = name out file to write diagnostics to 
            level = PHP error_reporting level to capture
*/
class RHJ4Diagnostics {

    /*--------------------------------------------*
     * Constants
     *--------------------------------------------*/
    const name = 'RHJ4 Diagnostics';
    const slug = 'rhj4_diagnostics';

    public $plugin_name = 'RHJ4 Diagnostics';
    public $plugin_slug = 'rhj4_diagnostics';
    public $plugin_url = '';
    public $plugin_path = '';
    public $admin_url = '';
    public $page_loaded = FALSE;    //Set to true after first page load
    
    //
    //  By default, write output into PHP error log
    //
    
    /**
     *  Set to true by init function. 
     *  Testing for true determines whether plugin has been initialized
     * 
     * @var boolean
     */
    public $initialized = FALSE;
    
    /**
     *  Name of WP Option in which all default values will be stored
     * 
     *  @var string = option name
     */
    public $option_name = 'rhj4_diagnostic_options';

    /**
     *  if not true, then do not display any diagnostics
     * 
     *  @var boolean 
     */
    public $enabled;

    /**
     *  Message source (e.g. name of function or class originating message)
     * @var string
     */
    public $source;
    
    /**
     *  If NULL, then results will be produced in the output stream
     * 
     *  @var NULL | function | array
     * 
     *  If NULL, return results to caller
     *  if function, then hand results to that function
     *  if array, then treat each array element as an output
     */
    public $output;

    /**
     * Name of file that will contain diagnostics
     * 
     * @var string 
     */
    public $logfile;
    
    /**
     *
     * @var int $level = PHP error reporting level
     */
    public $level;
    
    /**
     * Indicates what types of events to trace. 
     * Each diagnostic message can have a tracing_level value associated with
     * it as an option. 
     * 
     * Possible values are 0..n where the value serves as a threshold.
     * If the threshold is high, few messages will make it through to the log.
     * If the level is 0, then all messages will get logged.
     * 
     * @var int - possible values:
     * 
     *      0   All messages will be logged
     *      1..n Arbitrary higher threshold. If less than the current threshold,
     *          the message will be logged. 
     *      -1 = no messages (Same as enabled == false)  
     */
    public $threshold = 0;  

    //
    //  Establish default option values
    //
    public $default_enabled          = false;
    public $default_threshold        = 10;
    public $default_output           = 'rhj4_log';
    public $default_source           = 'DIAG: ';
    public $default_logfile          = 'rhj4_diags.log';
    public $default_level            = 71;
    
    /**
     * Access this plugin's working instance
     * 
     * Use the example below instead of new wp-notifications();
     * Example: $rhj4_diagnostics = RHJ4Diagnostics::instance();
     *
     * @return instance of class
     */
    protected static $instance = NULL;
    
    public static function instance() {
        global $rhj4_diagnostics;
        if (!empty($rhj4_diagnostics)) {
            return $rhj4_diagnostics;
        }
        NULL === self::$instance and self::$instance = new self;
        $rhj4_diagnostics = self::$instance;
        return $rhj4_diagnostics;
    }
    
    /**
     * Initialize the plugin
     */
    function init($options = NULL) {
        global $rhj4_diagnostics;
        //
        //  Test to see if instance exists
        //
        if (empty($this)) {
            $diags = RHJ4Diagnostics::instance();
            if (!empty($options) && is_array($options)) {
                //  Get options from wp_options table
                $diags->options = get_option($diags->option_name);
                //  Get any missing options from the defaults
                $diags->options = array_merge($diags->defaults(),$diags->options); 
                //  Apply any options passed in to this 
                $diags->options = array_merge($diags->options, $options);
                    
            }
            
            //  Return instance
            return $diags;
        }
      
        //
        //  Test for a quick escape
        //
        if (empty($options) && $this->initialized) {
            return $this;
        }
        
        //
        //  The plugin requires initialization, so let's get to work.
        //  
        //  Get current value from wp[_#]_options for this site
        $this->options = get_option($this->option_name);
        
        // If options are not initialized, then set them to defaults.
        if (!is_array($this->options)) {
            $this->options = $this->defaults();
            update_option($this->option_name, $options);
        }
        //  If there were options passed in..
        if (NULL !== $options && (is_array($options))) {
            //  prime options with default options + database options
            $this->options = array_merge($this->defaults(), $this->options);
            //  merge in the options passed as arguments
            $this->options = array_merge($this->options, $options);
        } else {
            //  Get current options and pass in the options remembered in wp_options
            $this->options($this->options);
        }
        
        //  Set Is Initialized flag
        $this->initialized = TRUE;
        
        //
        //  Establish option values
        //
        $this->plugin_url = plugins_url('/',__FILE__);
        $this->plugin_path = plugin_dir_path(__FILE__);

        //  Test to see if plugin is enabled
        $this->enabled = $this->boolify($this->options['enabled']);
        if (!$this->enabled) {
            return;
        }
        
        if ($this->options['threshold'] && is_int($this->options['threshold'])) {
            $this->threshold = (int) $this->options['threshold'];
        } else {
            $this->threshold = $default_threshold;
        }        
        $this->output       = $this->options['output'];
        $this->source       = $this->options['source'];
        $this->logfile      = $this->options['logfile'];
        
        if ($this->options['level'] && is_int($this->options['level'])) {
            $this->level = (int) $this->options['level'];
        } else {
            $this->level = $default_level;
        }
        
        $this->admin_url = admin_url('admin-ajax.php');
        
        //
        //  If level > 0, then this code will handle and report on all PHP errors
        //
        if ($this->level > 0) {
            $this->set_error_reporting($this->level);
            set_error_handler(array($this,'error_handler'));
            //$this->diagnostic('PHP Error Handler set to '.$this->plugin_slug.'->error_handler');
        }
        
        // Load JavaScript and stylesheets
        $this->register_scripts_and_styles();

        // Register the shortcode [rhj4_diagnostics]
        add_shortcode( $this->plugin_slug, array('RHJ4Diagnostics', 'render_shortcode' ) );

        /**
         * Enable saving of diagnostics from javaScript code
         */
        add_action('wp_ajax_nopriv_rhj4_diagnostics_save','rhj4_diagnostics_save');
        add_action('wp_ajax_rhj4_diagnostics_save','rhj4_diagnostics_save');
        
        add_action('wp_ajax_nopriv_rhj4_diagnostics_show','rhj4_diagnostics_show');
        add_action('wp_ajax_rhj4_diagnostics_show','rhj4_diagnostics_show');
        
        add_action('wp_ajax_nopriv_rhj4_diagnostics_clear','rhj4_diagnostics_clear');
        add_action('wp_ajax_rhj4_diagnostics_clear','rhj4_diagnostics_clear');
        
        //  Write the plugin name into the output stream
//        $this->diagnostic($this->option_name.'->initialized: '
//                .'enabled='.$this->options['enabled'].': '
//                .'threshold=['.$this->options['threshold'].'] '
//                .'output=['.$this->options['output'].'] '
//                .'level=['.$this->options['level'].']');

        $rhj4_diagnostics = $this;
        return $this;
    }

    /**
     * 
     * @return array of default values
     */
    public function defaults () {
        $defaults = array ();
        $defaults['enabled']   = $this->default_enabled;
        $defaults['threshold'] = $this->default_threshold;
        $defaults['output']    = $this->default_output;
        $defaults['source']    = $this->default_source;
        $defaults['logfile']   = $this->default_logfile;
        $defaults['level']     = $this->default_level;
        
        return $defaults;
    }

    /**
     * Kill the current instance
     */
    public function kill() {
        self::$instance = NULL;
    }
    
    /**
     * Runs when the plugin is activated
     */  
    function activate() {
        $instance = RHJ4Diagnostics::instance();
        $instance->diagnostic($instance->option_name.'activating');
        $instance->reset();
    }

    /**
     * Runs when plugin is deactivated
     */
    function deactivate() {
    }

    /**
     * Display a notification using RHJ4Notifications if installed
     * 
     * @param string $message
     * @param NOTIFICATION_TYPE $type
     * @param bool $sticky
     */
    function notify ($message, $type = NOTIFICATION_TYPE_CONFIRMATION, $sticky = TRUE) {
        $notify = RHJ4Notifications::instance();
        if (!empty($notify)) {
            $notify->save($message, $type, $sticky);
        }
    }
    
    /**
     * Process the shortcode.
     * 
     * @param type $atts
     */
    function render_shortcode($atts) {
        if (!current_user_can('install_plugins') ) {
            echo 'Insufficient privileges to use this shortcode';
//            $this->notify('Insufficient privileges to use this shortcode', NOTIFICATION_TYPE_WARNING, TRUE);
            return;
        }
        
        $diags = RHJ4Diagnostics::instance();
        $logfile = $diags->logfile;
        $filepath = WP_PLUGIN_DIR;
        $filepath = str_replace('plugins','',$filepath);
        $filename = $filepath.$logfile;
        $fileurl = content_url().'/'.$logfile;

        $do_notify = false;
        $do_log = false;
        $do_show = false;
        $do_clear = false;
        $do_options = false;
        $do_demo = false;
        $do_test = false;
        $do_diags = false;
        $do_enable = false;
        $do_disable = false;
        $do_save = false;
        
        // Extract the attributes of the codes
        $args = shortcode_atts(array(
                'show'          => false, 
                'clear'         => false,
                'demo'          => false,
                'test'          => false,
                'diags'         => false,
                'options'       => false,
                'verbose'       => false,
                'notify'        => false,
                'log'           => false,
                'enable'        => false,
                'disable'       => false,
                'threshold'     => 0,
                'save'          => false,
                'sticky'        => true,
                'message'       => '',
                'type'          => NOTIFICATION_TYPE_CONFIRMATION,
                ), $atts);

        foreach($args as $key => $value) {
            $value = strtolower($value);
            switch ($key) {
                case 'show':
                    $do_show = $diags->boolify($value);
                    break;
                
                case 'clear':
                    $do_clear = $diags->boolify($value);
                    break;
                
                case 'demo':
                    if ($value==='jquery' || $value === 'php' || $value === 'both') {
                        $demo_type=$value;
                        $do_demo = true;
                    } else if ($diags->boolify($value)) {
                        $demo_type = 'both';
                        $do_demo = true;
                    }
                    break;
                
                case 'test':
                    $do_test = $diags->boolify($value);
                    break;
                
                case 'diags':
                    $do_diags = $diags->boolify($value);
                    break;
                
                case 'options':
                    $do_options = $diags->boolify($value);
                    break;
                
                case 'verbose':
                    $verbose = $diags->boolify($value);
                    break;
                
                case 'notify':
                    $do_notify = $diags->boolify($value);
                    break;
                
                case 'log':
                    $do_log = $diags->boolify($value);
                    break;
                
                case 'enable':
                    $do_enable = $diags->boolify($value);
                    break;
                
                case 'disable':
                    $do_disable = $diags->boolify($value);
                    break;
                    
                case 'threshold':
                    if (is_int($value)) {
                        $do_threshold = (int)$value;
                    }
                    break;
                    
                case 'save':
                    $do_save = $diags->boolify($value);
                    break;
            }
        }
        
        // Begin output generation
        ob_start();
        $prefix = ($verbose) ? "<strong>RHJ4 Diagnostics Shortcode output: </strong>" : "";
        
        //  Enable logging and (optionally, save options to database
        if ($do_enable) {
            $options = $diags->options;
            $options['enabled'] = true;
            $diags->options['enabled'] = true;
            if ($verbose) {
                echo $prefix.'Logging ENABLED';
            }
        }
        
        if ($do_disable) {
            $options = $diags->options;
            $options['enabled'] = false;
            $diags->options['enabled'] = false;
            if ($verbose) {
                echo $prefix.'Logging DISABLED<br />';
            }
        }
        
        if ($do_threshold > 0) {
            $options = $diags->options;
            $options['threshold'] = $do_threshold;
            $diags->options['threshold'] = $do_threshold;
            if ($verbose) {
                echo $prefix.'Threshold set to '.$do_threshold.'<br />';
            }
        }
        
        if ($do_save) {
            update_option($diags->option_name, $options);
            if ($verbose) {
                echo $prefix.'Database updated<br />';
            }
        }
        
        if ($do_notify) {
            if (empty($args['message'])) {
                $diags->diagnostic('Message is undefined');
                if ($verbose) {
                    echo $prefix.'ERROR: message value is undefined';
                }
                
                return;
            }
            
            $message = $args['message'];
            
            if (!empty($args['type'])) {
                $type = $args['type'];
            }
            if (!empty($args['sticky'])) {
                $sticky = $diags->boolify($args['sticky']);
            }
            $diags->notify($args['message'], $type, $sticky);
            if ($verbose) {
                echo $prefix.'Notification ['.$args['message'].'] sent';
            }
        }
        
        if ($do_log) {
            if (empty($args['message'])) {
                $diags->diagnostic('Message is undefined');
                if ($verbose) {
                    echo $prefix.'ERROR: message value is undefined';
                }
                
                return;
            }
            
            $message = $args['message'];
            
            $result = $diags->diagnostic($message);
            if ($verbose) {
                if ($result) {
                    echo $prefix.'Diagnostic ['.$message.'] saved';
                } else {
                    echo $prefix.'Diagnostic ['.$message.'] NOT saved';
                }
            }
        }
        
        if ($do_diags) {
            $diags->diagnostic_demo(true);
        }
        
        //  Show a demo of this plugin
        //
        //  I have put this on hold because doing it right requires a
        //  RESTful WebService and that is a bit much to step up to at this time.
        //  
        //  Ultimately, my goal is to allow jQuery code to submit a message
        //  that gets saved in the notifications table and displayed by PHP
        //  code. There are a number of technical challenges I must meet in
        //  order to pull this off.
        //
        if ($do_options) {
            $options = $diags->options;
            echo '<h3>Options:</h3><pre>';
            echo var_dump($options);
            echo '</pre>';
        }

        if ($do_test) {
            $diags->diagnostic_test($verbose);
        }
        
        if ($do_demo) {
            echo "<input type='hidden' id='demo-type' value='".$demo_type."'>";
            echo '<h3>DIAGNOSTICS DEMO:</h3>';
            $path = plugin_dir_path(__FILE__);
            require_once $path.'demo.php';
        }
        
        //  Display the contents of the log file
        if ($do_show) {
            echo $diags->show($fileurl, $filename);
        }

        //  Delete the log file
        if ($do_clear && !empty($logfile)) {
            $deleted = $diags->boolify(unlink($filename));
            if ($verbose) {
                echo $prefix.'<h3>Deleting Logfile</h3>';
                if ($deleted) {
                    echo $logfile.' deleted<br />';
                }
                else {
                    echo $logfile.' not found<br />';
                }
            }
        }
        
        return ob_get_clean();
    }
    
    /**
     * Validate options and return valid array
     * 
     * @param array $options
     * @return array
     */
    public function options ($options = null, $update = TRUE) {
        //
        //  If we have nothing, then use the defaults
        //
        if (NULL === $options || !$options) {
            $options = $this->defaults();
        }
        
        //
        //  Process all options 
        if ($options && is_array($options)) {
            foreach($options as $key=>$value) {
                switch($key) {
                    // if 0, no output will be generated on output stream
                    case 'enabled':
                        //  Weird condition to check for...
                        if ($key !== 'enabled') {
                            break;
                        }
                        $this->enabled = ($this->boolify($value)) ? 1 : 0;
                        $this->options['enabled'] = $this->enabled;
                        break;

                    //  set threshold level. Messages with threshold at or 
                    //  below this value will be written
                    case 'threshold':
                       $this->threshold = (int)($value);
                        $this->options['threshold'] = $this->threshold;
                        break;
                    
                    //  output may be a function or null
                    //  if null, generated message will be returned
                    //  but no other use will be made of it. It will be
                    //  as if the message never existed. Sad, but true.
                    case 'output': 
                        if (is_string($value)) {
                            if (!empty($value)) {
                                if (function_exists ( $value )) {
                                    $this->output = $value;
                                } else {
                                    $options['output']  = null;
                                    $this->output = null;
                                    echo($this->plugin_name.' attempting to set output to '.$value);
                                }
                            } else {
                                $options['output']  = null;
                                $this->output = null;
                            }
                        } else if (is_array($value)) {
                            $options['output'] = $value;
                            $this->output = $value;
                        } else if (NULL === $value) {
                            $options['output']  = null;
                        } else {
                            $options['output']  = null;
                            $this->output = null;
                            echo $this->plugin_name.' attempting to set output to invalid value';
                        }
                        
                        $this->options['output'] = $this->output;
                        break;

                    case 'logfile':
                        $this->logfile = $value;
                        $this->options['logfile'] = $this->logfile;
                        break;
                    
                    // source is a string that will prefix all messages    
                    case 'source':          
                        $this->source  = $value;
                        $this->options['source'] = $this->source;
                        break;

                    case 'level':
                        if ($value && is_int($value)){
                            $this->level = $value;
                        }
                        if ($value > 0) {
                            $this->set_error_reporting($this->level);
                            if ($this->initialized) {
                                set_error_handler(array($this,'error_handler'));
                            }
                        }
                        $this->options['level'] = $this->level;
                        break;
                    
                    default:
                        $this->diagnostic('unknown/invalid option key: ['.$key.']');
                        echo 'unknown/invalid option key: ['.$key.']';
                }
            }
        }
        
        return $this->options;
    }
    
    /**
     * Establish default options and save them in wp_options
     */
    public function set($options = NULL) {
        /**
         * If there are options in wp_options, get them and override 
         * existing option values
         */
        $options = $this->options($options);
        $this->enabled = $options['enabled'];
        $this->threshold = $options['threshold'];
        $this->output = $options['output'];
        $this->logfile = $options['logfile'];
        $this->source = $options['source'];
        $this->level = $options['level'];
                    
        update_option($this->option_name, $options);
    }

    /**
     * reset to defaults
     */
    public function reset() {
        
        $options = $this->options($this->defaults());
        update_option($this->option_name, $options);
        return $options;
    }
    
    /**
     * Convert what should be a boolean value into a boolean value
     *
     * @param string $option
     * @return boolean
     */
    function boolify ($option) {
        if (!$option || strlen($option) === 0) {
            return FALSE;
        }
        if ($option === 'on') {
            return TRUE;
        }

        return ($option === 'true'
                || $option === 'on'
                || $option = '1'
                || $option === 1 ) ? TRUE : FALSE;
    }

    /**
     * Registers and enqueues stylesheets for the administration panel and the
     * public facing site.
     */
    private function register_scripts_and_styles() {
        $this->load_file( self::slug . '-datetime', 'js/datetime.js', true );
        $this->load_file( self::slug . '-strings', 'js/strings.js', true );
        $this->load_file( self::slug . '-diagnostics', 'js/jquery.diagnostics.js', true );
        $this->load_file( self::slug . '-persistent', 'js/jquery.persistent.js', true );
        $this->load_file( self::slug . '-demo', 'js/demo.js', true );
        $this->load_file( self::slug . '-diagnosticss-style', 'css/rhj4-diagnostics.css' );
    } // end register_scripts_and_styles

    /**
     * Helper function for registering and enqueueing scripts and styles.
     *
     * @name	The 	ID to register with WordPress
     * @file_path		The path to the actual file
     * @is_script		Optional argument for if the incoming file_path is a JavaScript source file.
     */
    private function load_file( $name, $file_path, $is_script = false ) {

            $url = plugins_url($file_path, __FILE__);
            $file = plugin_dir_path(__FILE__) . $file_path;

            if( file_exists( $file ) ) {
                if( $is_script ) {
                    wp_register_script( $name, $url, array('jquery') ); //depends on jquery
                    wp_enqueue_script( $name );
                } else {
                    wp_register_style( $name, $url );
                    wp_enqueue_style( $name );
                } // end if
            } // end if

    } // end load_file

    /**
     * Write a diagnostic message into the output
     * 
     * @args object: {
     *      source: string,
     *      message: string,
     *      data: {string,object,array,function} - associated data
     *      error_log: boolean (defaults to true)
     * 
     */
    public function diagnostic($message, $options = NULL) {
        if (!$this->initialized) {
            $this->init($options);
        } 

        //
        //  The options provided as an argument to this function do not
        //  update the current option values. They only apply to this
        //  invocation of this function
        
        //
        //  Get current message threshold. This value represents the threshold
        //  we compare to as the baseline threshold
        //
        $current_options = $this->options;
        if ($options !== NULL) {
            //  If the $options parameter is a string, it is source
            //  value, so get the rest of the options and apply this one.
            if (is_string($options)) {
                $options = array_merge($this->options(), 
                        array('source' => $options));  // Don't update
            } elseif (is_array($options)) {
                $options = $this->options($options);
            }
        }
        
        $source = $current_options['source'];
        $output = $current_options['output'];
        $logfile = $current_options['logfile'];
        $enabled = $current_options['enabled'];
        
        //
        //  Restore previous values
        //
        $this->options($current_options);
        
        //
        //  If logging is not enabled or message threshold is less than current
        //  threshold, bail.
        //
        if (!$enabled || $this->threshold < $options['threshold']) {
            return false;
        }
        
        /**
         * Construct messsage
         */
        if (is_object($message)) {
            ob_start();
            var_dump($message);
            $message = $source.ob_get_clean();
        } elseif (is_array($message)) {
            $newmsg = '';
            for ($i=0; $i < count($message); $i++) {
                $newmsg += '['.$i.'] '.$this->diagnostic($message[$i]).$newline;
            }
            $message = $newmsg;
        } else {
            $newmsg = '';
            if (strlen($source) > 0) {
//                $newmsg .= print_r($source, true); 
            }
            $message = $newmsg.$message;
        }
  
        /**
         * Output message
         */
        if (empty($output)) {
            return $message;
        } elseif (is_array($output)) {
            foreach ($output as $out) {
                
                //  Check for mangled parms and set them to the defaults
                //  if missing
                if (is_array($out)) {
                    if (!$out['function']) {
                        $out['function'] = $this->default_output;
                    }
                    if (!$out['logfile']) {
                        $out['logfile'] = $this->defaults_logfile;
                    }
                } else {
                    $out = array(
                        'function' => $this->default_output,
                        'logfile' => $this->default_logfile);
                }
                
                $function = $out['function'];
                $logfile = $out['logfile'];
                if (function_exists($function)) {
                    if (empty($logfile)) {
                        $function($message);
                    } else {
                        $function($message, $logfile);
                    }
                } 
            }
        } else {
            $function = $output;
            if (function_exists($function)) {
                if (empty($logfile)) {
                    return $function($message);
                } else {
                    return $function($message, $logfile);
                }
            } else {
                error_log('Whoops!'); // Couldn't think of anything better to say... ;>)
            }
        }
        
        return $message;
    }

    /**
     * Erase contents of log file
     * @param type $logfile
     */
    public function clear_log($logfile = NULL) {
        if (!$this->initialized) {
            $this->init();
        }
        if (empty($logfile)) {
            $logfile = $this->logfile;
        }
        if (!empty($logfile) && is_file($logfile)) {
            $handle = fopen ($logfile, "w+");
            fclose($handle);
        }
    }
    
    /**
     * Handle Error Exception
     * 
     * @param type $errno
     * @param type $errstr
     * @param type $errfile
     * @param type $errline
     */
    public function error_handler($errno, $errstr, $errfile, $errline) {
        //  To report an error, this plugin must be enabled 
        //  and the error number must be one we are trapping
        if ($this->enabled && ($errno & $this->level)) {
            $path = pathinfo($errfile);
            $file = basename($errfile);
            $type = $this->error_type($errno);
            $this->diagnostic($errstr, $type.': '.$file.' ('.$errline.')');
            return $type.': '.$file.' ('.$errline.')'.$errstr;
        }
        return null;
    }

    /**
     * Map error type into string
     * 
     * @param int $errno
     * @return string
     */
    public function error_type($errno) {
        $error_types = array(
            '1'     => "ERROR",
            '2'     => "WARNING",
            '4'     => "PARSE",
            '8'     => "NOTICE",
            '16'    => "CORE ERROR",
            '32'    => "CORE WARNING",
            '64'    => "COMPILE ERROR",
            '128'   => "COMPILE WARNING",
            '256'   => "USER ERROR",
            '512'   => "USER WARNING",
            '1024'  => "USER NOTICE",
            '2048'  => "STRICT",
            '4096'  => "RECOVERABLE",
            '8192'  => "DEPRECATED",
            '16384' => "USER DEPRECATED"
            );
                
        return $error_types[$errno];
    }

    /**
     * Set error reporting level to $level
     * 
     * @param int $level
     */
    public function set_error_reporting($level = null) {
//        if (!$this->initialized) {
//            $this->init((is_int($level)) ? array('level' => (int) $level) : null);
//        }
        if (!$this->enabled) {
            return;
        }

        // If $level is an integer, then use this value as the error reporting level
        // otherwise, use the current level as defined in the settings.
        $diags = RHJ4Diagnostics::instance();
        
        $lvl = (is_int($level)) ? (int) $level : $diags->level;
        $desc =$this->render_error_level($lvl);

        //
        //  Set the error reporting level
        $error_reporting = error_reporting($lvl);
    }


    /**
     * Construct string containing all current diagnostic messages
     * 
     * @param string $fileurl
     * @param string $filename
     * @return string
     */
    public function show($fileurl = null, $filename = null) {
        if (empty($fileurl) || empty($filename)) {
            $diags = RHJ4Diagnostics::instance();
            $logfile = $diags->logfile;
            $filepath = WP_PLUGIN_DIR;
            $filepath = str_replace('plugins','',$filepath);
            $filename = $filepath.$logfile;
            $fileurl = content_url().'/'.$logfile;
        }
        
        $contents = wp_remote_fopen($fileurl);
        $output = "<div class='plugin_log'>"
                . "<h3>Diagnostic Logfile Contents</h3>";
        if (!empty($contents)) {
            $output .= "<h4 class='plugin_logfile'>Logfile: ".$filename."</h4>";
            $output .= "<div class='plugin_log_data'>";
            $output .= "<pre>".$contents."</pre><br />";
            $output .= "</div>";
        } else if (empty ($logfile)) {
            $output .= 'Log file is empty<br />';
        } else {
            $output .= $logfile.' is empty<br />';
        }
        $output .= "</div>";
        return $output;
    }
    
    /**
     * Render error level as string values
     * 
     * @param int  $level - See PHP error_reporting()
     * @return string
     */
    public function render_error_level($level) {
        $lvl = '';
        if ($level & E_ERROR) {
            $lvl.='ERROR ';
        }
        if ($level & E_WARNING) {
            $lvl.='WARNING ';
        }
        if ($level & E_PARSE) {
            $lvl.='PARSE ';
        }
        if ($level & E_NOTICE) {
            $lvl .='NOTICE ';
        }
        if ($level & E_CORE_ERROR) {
            $lvl .='CORE_ERROR ';
        }
        if ($level & E_CORE_WARNING) {
            $lvl .='CORE_WARNING ';
        }
        if ($level & E_COMPILE_ERROR) {
            $lvl .='COMPILE_ERROR ';
        }
        if ($level & E_COMPILE_WARNING) {
            $lvl .='COMPILE_WARNING ';
        }
        if ($level & E_USER_ERROR) {
            $lvl .='USER_ERROR ';
        }
        if ($level & E_USER_WARNING) {
            $lvl .='USER_WARNING ';
        }
        if ($level & E_USER_NOTICE) {
            $lvl .='USER_NOTICE ';
        }
        if ($level & E_STRICT) {
            $lvl .='STRICT ';
        }
        if ($level & E_RECOVERABLE_ERROR) {
            $lvl .='RECOVERABLE_ERROR ';
        }
        if ($level & E_DEPRECATED) {
            $lvl .='DEPRECATED ';
        }
        if ($level & E_USER_DEPRECATED) {
            $lvl .='USER_DEPRECATED ';
        }

        return $lvl;
    }

    /**
     * Test various ways to use this plugin
     */
    public function diagnostic_test($verbose = false) {
        if ($verbose) {
            echo '<h3>Performing Diagnostic Tests</h3>';
        }
        
        //
        //  Reset to initial defaults
        //
        $this->clear_log();
        $this->reset();

        $diags = RHJ4Diagnostics::instance();
        $diags->set (array('enabled' => true));

        $this->echo_message('test #1: simple message before output enabled',
                $this->options, $verbose);

        $options = array(
            'enabled'   => TRUE,
            'threshold' => 2,
            'source'    => 'TEST: ',
            'logfile'   => 'rhj4_diags_test.log',
            'output'    => 'my_diagnostic_test_output'
        );
        
        $this->set(array_merge($this->defaults(),$options));

        $this->echo_message('test #2: simple message after enabling output',
                $this->options, $verbose);

        $this->echo_message('test #3: message with source', 
                'MessageSource: ', $verbose);

        $outputs = array(
            array('function' => 'my_diagnostic_test_output', 'logfile' => 'rhj4_diags_test_log'),
            array('function' => 'my_other_test_output', 'logfile' => 'rhj4_other_test.log'));
        
        $this->echo_message('test #4: message with multiple outputs',
                array('output' => $outputs), $verbose);

        $this->reset();
        if ($verbose) {
            echo 'END OF DIAGNOSTIC TEST';
        }

    }

    /**
     * Write diagnostic message and echo the resulting message into the 
     * output stream if $verbose is true
     * 
     * @param string $message
     * @param array $options
     * @param bool $verbose
     */
    public function echo_message($message, $options = null, $verbose = false) {
        $message = $this->diagnostic($message,$options);
        if ($verbose && !empty($message)) {
            echo 'Message: '.$message.'<br />';
        }            
    }
    
    public function diagnostic_demo($verbose = false) {
        if ($verbose) {
            echo '<h3>Diagnostic Demo</h3>';
            echo '<p>This code exercises a variety of the plugin\'s capabilities</p>';
        }

        //  Get an instance of this plugin

        //  Reset option settings to their defaults. 
        //  The reset values are remembered in wp_options
        $diags = RHJ4Diagnostics::instance();
        if ($verbose) {
            echo 'Clearing and resetting the log file';
        }
        
        $diags->clear_log();
        $diags->reset();
        $diags->init(array('threshold'=>2));
        $options = $diags->options();
        
        if ($verbose) {
            echo '<h3>Options After Reset:</h3><pre>';
            var_dump($options);
            echo '</pre>';
        }

        //  After reset, plugin will not be enabled, so this next message won't show
        $diags->echo_message('This message will NOT appear in the log.',
                $diags->options, $verbose);

        //  Enable plugin and change the source message.
        $diags->echo_message('This message WILL appear in the log.', array(
           'enabled'    => true,
           'threshold'  => 2,
           'source'     => 'DEMO: '
        ), $verbose);
        
        $options = $diags->options();
        if ($verbose) {
            echo 'Enabling capture of PHP errors';
        }
        $diags->echo_message('Turn on reporting of PHP Errors', array(
            'level' => E_ALL ), $verbose);
        
        $options = $diags->options();
        if ($verbose) {
            echo '<h3>This->Options:</h3><pre>';
            echo var_dump($options);
            echo '</pre>';
        }

        //
        //  This example writes the output to two log files 
        //
        $diags->echo_message('more complex message', array(
            'source' =>'MULTIPLE FUNCTIONS: ',
            'output' => array(
                array('function' => 'my_diagnostic_test_output', 'logfile' => 'rhj4_diags_test.log'),
                array('function' => 'rhj4_log', 'logfile' => 'rhj4_diags.log')
            )), $verbose);

        $diags = RHJ4Diagnostics::instance();
        $diags->init(array('enabled' => true, 'threshold' => 8));
        $current_threshold = $diags->threshold;
        
        $diags->echo_message('Current threshold is: ['.$current_threshold.']', 
                array('threshold' => 0), $verbose);
        
        $diags->echo_message('Message with threshold = 1 will be displayed', 
                array('source' => 'FUNCTION A: ', 'threshold' => 1), $verbose);

        $diags->echo_message('Message with threshold = 2 will be displayed', 
                array('source' => 'FUNCTION B: ', 'threshold' => 5), $verbose);

        $diags->echo_message('Message with threshold = 3 will NOT be displayed', 
                array('source' => 'FUNCTION C: ', 'threshold' => 9), $verbose);

        $diags->echo_message('Message written to function', array('output'=> array(
            'function' => 'my_diagnostic_test_output', 'logfile' => 'demo.log')), $verbose);

        $diags->echo_message('End of demo', 
                array('source' => 'THE END: ', 'threshold' => 1), $verbose);

        if ($verbose) {
            echo '<h3>End of Diagnostic Demo</h3>';
        }  
    }
} // end class

/**
 * Perform diagnostic tests
 */
function rhj4_diagnostics_test($verbose = false) {
    $diags = RHJ4Diagnostics::instance();
    $diags->diagnostic_test($verbose);    
}

/**
 * Code examples of how to use this plugin
 */
function rhj4_diagnostics_demo ($verbose = false) {
    $diags = RHJ4Diagnostics::instance();
    $diags->diagnostic_demo($verbose);
  }

/**
 * Examples of diagnostic output functions
 * 
 * @param string $message
 * @param string $logfile
 */
function my_diagnostic_test_output($message, $logfile = 'rhj4_diags_test.log') {
    $file = fopen($logfile,"a+");
    fwrite($file, $message."\n");
    fclose($file);
}

/**
 * Write to specific log file.
 * @param type $message
 * @param string $logfile - IGNORE FOR THIS TEST CASE
 */
function my_other_test_output($message, $logfile) {
    $logfile='rhj4_other_test.log';
    $file = fopen($logfile,"a+");
    fwrite($file, $message."\n");
    fclose($file);
}

/**
 * Capture a diagnostic message 
 * 
 * @param string $message
 * @param array $options - see settings
 * 
 * Usage Examples:
 *      rhj4_diagnostic('test message');
 * 
 *      rhj4_diagnostic('test message', 'MY CODE: ');
 * 
 */
function rhj4_diagnostic($message, $options = NULL) {
    $diag = RHJ4Diagnostics::instance();
    $diag->diagnostic($message, $options);
}


/**
 * Write message to logfile - This is the default logging function
 * 
 * @param string $message
 * @param string $logfile
 * 
 * Although this function can be called directly, it is generally better to
 * call it using rhj4_diagnostic so that logging can be enabled or disabled.
 */
function rhj4_log($message, $logfile = 'rhj4_diags.log') {
    $logfile = dirname(get_theme_root()).'/'.$logfile;
    
    $timestamp = date('m/d/y H:i:s',time());
    $file = fopen($logfile,"a+");
    fwrite($file, $timestamp.'->'.$message."\n");
    fclose($file);
    return $message;
}

/**
 * Enable plugin and set default values. 
 */
function rhj4_diagnostics_enable() {
    //  Get an instance of this plugin
    $diags = RHJ4Diagnostics::instance();
    $diags->init(array (
        'enabled'           => true,
        'threshold'         => 10,
        'output'            => 'rhj4_log',
        'source'            => 'DIAGNOSTICS:',
        'logfile'           => 'rhj4_diags.log',
        'level'             => E_ALL & ~E_DEPRECATED & ~E_NOTICE & ~E_STRICT
    ));
}

/**
 *  Once each page load, report on the page, the user, etc 
 *  so that we can trace site activity
 * 
 * @global type $pagename
 * @global type $post
 * @global type $current_user
 */
function rhj4_report_page() {
    $diags = RHJ4Diagnostics::instance();
    if ($diags->page_loaded === FALSE) {
        global $current_user;
        get_currentuserinfo();
        $user_name = (empty($current_user->display_name))
            ? $current_user->user_lastname.', '.$current_user->user_firstname
            : $current_user->display_name;

        global $pagename;
        global $post;
        $pagename = get_query_var('pagename');
        $diags->diagnostic('Page Name ['.$pagename.'] User ['.$user_name.']',
                array('threshold' => 5));
        $diags->page_loaded = true;
    }
}

/**
 * AJAX call handler to save a diagnostic message
 */
function rhj4_diagnostics_save() {
    $post = $_POST;
    
    $diags = RHJ4Diagnostics::instance();
    if (count($post) == 0 || FALSE === $post['diagnostic']) {
        $diags->diagnostic('Diagnostic text is missing');
        die();
    } 
    $message = (FALSE === $post['message']) 
            ? "Message is empty" : $post['message'];

    $output = (FALSE === $post['output']) ? $diags->output : $post['output'];
    $source = (FALSE === $post['source']) ? $diags->source : $post['source'];

    if ($diags->diagnostic($message, array('output' => $output, 'source' => $source))) {
        $diags->notify("Diagnostic Message Saved:<br />".$source.$message, NOTIFICATION_TYPE_CONFIRMATION, true);
        echo 'ok';
    } else {
        echo 'error';
    }

    die();
}

/**
 * AJAX Call Handler to return log file contents
 */
function rhj4_diagnostics_show() {
    $diags = RHJ4Diagnostics::instance();
    $logfile = $diags->logfile;
    if (empty($logfile)) {
        die();
    }
    
    $filepath = WP_PLUGIN_DIR;
    $filepath = str_replace('plugins','',$filepath);
    $filename = $filepath.$logfile;
    $fileurl = content_url().'/'.$logfile;
    echo $diags->show($fileurl, $filename);
    die();
}

/**
 * AJAX Call handler to clear log file
 */
function rhj4_diagnostics_clear() {
    $diags = RHJ4Diagnostics::instance();
    $logfile = $diags->logfile;
    if (empty($logfile)) {
        echo 'Logfile not defined';
        die();
    }
    
    $filepath = WP_PLUGIN_DIR;
    $filepath = str_replace('plugins','',$filepath);
    $filename = $filepath.$logfile;
    $deleted = $diags->boolify(unlink($filename));
    echo $prefix.'<h3>Deleting Logfile</h3>';
    if ($deleted) {
        echo $logfile.' deleted<br />';
    }
    else {
        echo $logfile.' not found<br />';
    }
    die();
}

/**
 * Initialize the plugin.
 * 
 * This function should be called only once per page-load.
 * 
 * @param array $options
 * @return object
 */
add_action('init', array('RHJ4Diagnostics','init'), 1, 1);

register_activation_hook(__FILE__, array('RHJ4Diagnostics','activate'));
register_deactivation_hook(__FILE__, array('RHJ4Diagnostics','deactivate'));

/**
 * If admin, configure settings panel
 */
//if (is_admin()) {
//    require_once 'rhj4_diagnostic_settings.php';
//    $plugin_settings = new RHJ4DiagnosticOptions();
//}

/**
 * To watch several examples of using this plugin, uncomment the next statement
 */
//add_action('init','rhj4_diagnostics_demo');

/**
 * To test diagnostics, uncomment the next statement
 */
//add_action('init','rhj4_diagnostics_test');

/**
 * To enable plugin and set default values, uncomment the next statement
 */
add_action('init','rhj4_diagnostics_enable');

/**
 * To log each page load, uncomment the next statement
 */
//add_action('wp', 'rhj4_report_page');
?>