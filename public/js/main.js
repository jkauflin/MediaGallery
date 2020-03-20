/*==============================================================================
 * (C) Copyright 2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Styling for the test framework
 *----------------------------------------------------------------------------
 * Modification History
 * 2020-03-20 JJK 	Initial version 
 *============================================================================*/
var main = (function () {
	'use strict';  // Force declaration of variables before use (among other things)
	//=================================================================================================================
	// Private variables for the Module
	var headshotRoot = "images/headshots";

	//=================================================================================================================
	// Variables cached from the DOM
	var $document = $(document);

	//=================================================================================================================
    // Bind events
    
    // Auto-close the collapse menu after clicking a non-dropdown menu item (in the bootstrap nav header)
    $document.on('click', '.navbar-collapse.in', function (e) {
        if ($(e.target).is('a') && $(e.target).attr('class') != 'dropdown-toggle') {
            $(this).collapse('hide');
        }
    });

	//=================================================================================================================
	// Module methods

})(); // var main = (function(){
