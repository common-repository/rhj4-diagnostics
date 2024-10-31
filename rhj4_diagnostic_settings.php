<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Enable Settings management in dashboard
 * 
 * Code modeled on article from: 
 * http://ottopress.com/2009/wordpress-settings-api-tutorial/
 * 
 */
class RHJ4DiagnosticOptions {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'admin_page'));
        add_action('admin_init', array($this, 'admin_init'));
    }

    /**
     * Define the options page
     */
    function admin_page() {

        // Create a single entry in the Settings menu
        // If multiple menu items are wanted here, use _add_menu_page
        //
        add_options_page(
                'RHJ4 Plugin Administration',           // Page Title
                'RHJ4 Diagnostics',                     // Settings Link
                'manage_options',                       // required capability
                'rhj4_diagnostics',                     // Menu slug
                array($this,'settings'));               // Page function
    }

    /**
     * Generate the output for the settings page.
     */
    function settings() {
    ?>
        <div>
            <form action="options.php" method="post">
    <?php   settings_fields('rhj4_diagnostics_options'); 
            do_settings_sections('rhj4_diagnostics'); 
            submit_button(); 
    ?>
            </form>
        </div>
        <?php
    }


    function admin_init() {
        $diags = RHJ4Diagnostics::instance();
        $option_name = $diags->option_name;
        register_setting(
                'rhj4_diagnostics_options',             // group name
                $option_name,                           // option name
                array($this,'validate'));               // validation function callback

        add_settings_section(
                'rhj4_diagnostic_settings_section',     // id of section
                '',                                     // title of section
                array($this,'section_text'),            // function to display fields
                'rhj4_diagnostics');                    // page name

        add_settings_field( 
                'rhj4_diagnostics_enabled',             // ID of field
                'Enabled:',                              // Field title
                array($this,'show_enabled'),            // function callback 
                'rhj4_diagnostics',                     // associated page name
                'rhj4_diagnostic_settings_section');    // settings section id

        add_settings_field( 
                'rhj4_diagnostics_output',              // ID of field
                'Output Function:',                      // Field title
                array($this,'show_output'),             // function callback 
                'rhj4_diagnostics',                     // associated page name
                'rhj4_diagnostic_settings_section');    // settings section id

        add_settings_field( 
                'rhj4_diagnostics_source',              // ID of field
                'Source String:',                        // Field title
                array($this, 'show_source'),            // function callback 
                'rhj4_diagnostics',                     // associated page name
                'rhj4_diagnostic_settings_section');    // settings section id
        
//        add_settings_field(
//                'rhj4_diagnostics_show',                // ID of field
//                '',
//                array($this, 'show_file_contents'),
//                'rhj4_diagnostics',                     // associated page name
//                'rhj4_diagnostic_settings_section');    // settings section id
    }

    function section_text () {
        echo '<h3>RHJ4 Diagnostics Plugin Settings</h3>';
    }

    function show_enabled() {
        global $blog_id;
        $diags = RHJ4Diagnostics::instance();
        $diags->diagnostic('Entering enabled_show');
        
        $option_name = $diags->option_name;
        $options = get_option($option_name);

        $enabled = $options['enabled'];
        $control = "<input id='rhj4_diagnostics_enabled' "
                . "name='plugin_options[enabled]' type='checkbox'";
        if ($enabled) {
            $control .= ' checked';
        }
        $control .= ">";
        echo $control;
    }

    function show_output() {
        global $blog_id;
        $diags = RHJ4Diagnostics::instance();
        $diags->diagnostic('Entering output_show');

        $option_name = $diags->option_name;
        $options = get_option($option_name);

        $control = "<input id='rhj4_diagnostics_output' name='plugin_options[output]' "
        . "size='40' type='text' value='{$options['output']}' />";
        echo $control;
    }

    function show_source() {
        global $blog_id;
        $diags = RHJ4Diagnostics::instance();
        $diags->diagnostic('Entering source_show');

        $option_name = $diags->option_name;

        $options = get_option($option_name);
        $logfile = $diags->logfile;
        
        $control =  "<input id='rhj4_diagnostics_source' name='plugin_options[source]' "
        . "size='40' type='text' value='{$options['source']}' />";
        echo $control;
    }
    
    function validate($input) {
        global $blog_id;
        
        //rhj4_diagnostic('Entering validation code');
        if ($input == NULL) {
            $input = $_REQUEST['plugin_options'];
        }
        
        $diags = RHJ4Diagnostics::instance();
        $option_name = $diags->option_name;
        $options = get_option($option_name);
        
        //  Enabled is rendered as a checkbox which returns nothing if 
        //  not checked. 
        $options['enabled'] = 0;

        //  Get the running instance of this plugin
        $diags = RHJ4Diagnostics::instance();
        
        //  Validate the options currently in the database
        $options = $diags->options($options);
        
        //  Update the options with the new values
        $options = $diags->options($input);
        
        //  Kill current instance, forcing it to re-initialize itself
        $diags->kill();
        
        return $options;
    }
}
