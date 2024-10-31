/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

function diagnostic_submit() {
    jQuery.notification.erase();
    var ok = true;
    
    var source = jQuery('#source').val();
    if (source.trim() === '') {
        jQuery.notification({ notification: "Message source is empty", type: "error", sticky: true, queue: false });
        ok = false;
    }

    var message = jQuery('#message').val();
    if (message.trim() === '') {
        jQuery.notification({ notification: "Message text is empty", type: "error", sticky: true, queue: false });
        ok = false;
    }
    
    if (ok === false) {
        return;
    }
    
    var path = jQuery('input[name=path]:checked').val();
    switch(path) {
        case 'Browser':
            jQuery.diagnostic(message, source);
            message = "The following line will appear in the browser console:<br /><br />" + source + message;
            jQuery.notification({ notification: message, type: "data", sticky: true, queue: false });
            jQuery.notification({ notification: "See browser console", type: "confirmation", sticky: false, queue: false });
            break;
            
        case 'Server':
            jQuery.diagnostic.save(message, source);
            jQuery.diagnostic.show(function(data) {
                jQuery('.plugin_log').html(data);
                jQuery.notification.show(true);
            });
            break;
            
        default:
            jQuery.notification({ notification: "Select path", type: "error", sticky: true, queue: false });
            break;
    }
}

function diagnostic_show() {
    diagnostic_submit();
//    var source = jQuery('#source').val();
//    var message = jQuery('#message').val();
//    jQuery.notification({ notification: source + message, type: "confirmation", sticky: true, queue: false });
}

function diagnostic_clear() {
    jQuery.diagnostic.clear(function(data) {
        jQuery('.plugin_log').html(data);
    });
    
    jQuery.notification.erase();
}

jQuery(document).ready(function (jQuery) {
    var demo_type = jQuery('#demo-type').val();
    switch(demo_type) {
        case 'jquery':
            jQuery('#userBrowser:checked').val(true);
            jQuery('#userServer').hide()
            break;
            
        case 'php':
            jQuery('#useBrowser').hide();
            jQuery('#userServer:checked').val(true);
            break;
            
        case 'both':
            jQuery('#userServer').show()
            jQuery('#useBrowser').show();
            break;
            
        default:
            return;
            break;
    }
    
    jQuery('.output_selector').hide();
});