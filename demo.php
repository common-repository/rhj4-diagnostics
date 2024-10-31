<div id="rhj4_plugins_php_demo">
    <table class='rhj4_plugins_demo'>
        <tr>
            <td class='rhj4_plugins_label'>Source:</td><td><input id='source' type='text' placeholder='Enter source string' /></td></tr>
        <tr>
            <td class='rhj4_plugins_label'>Message:</td><td><input id='message' type='text' placeholder='Enter message text' /></td></tr>
        <tr class=' path_selector'>
            <td class='rhj4_plugins_label'>Using:</td>
            <td><input type='radio' name='path' id='useBrowser' value='Browser' checked/>Browser<input type='radio' name='path' id='useServer' value='Server'  />Server</td>
            </tr>
<!--        <tr class='output_selector'><td class='rhj4_plugins_label'>Output 1:</td><td><input type='text' id='output1' value='rhj4_log' /></td></tr>
        <tr class='output_selector'><td class='rhj4_plugins_label'>Output 2:</td><td><input type='text' id='output2' value='my_diagnostic_test_output' /></td></tr>
        <tr class='output_selector'><td class='rhj4_plugins_label'>Output 3:</td><td><input type='text' id='output3' value='my_other_test_output' /></td></tr>-->
    </table>
    <table class='rhj4_plugins_buttons'>
        <tr><td> 
            <input type='button' id='show_button' value='Show' onclick='diagnostic_show();return false;' />
            <input type='button' id='clear_button' value='Clear' onclick='diagnostic_clear();return false;' />
        </td></tr>
    </table>
</div>

