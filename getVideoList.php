<?php
/*==============================================================================
 * (C) Copyright 2014 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2014-04-04 JJK 	Initial version to return a list of video ids
 *============================================================================*/

$lines = array();
try {
	$fileURL = '';				
	if (isset($_GET["file"])) { 
		$fileURL = $_GET["file"];
		if (file_exists($fileURL)) {
			$lines = file($fileURL);		
		}
	} 
}
catch (Exception $e) {
    //echo 'An error occured: ' .  $e->message;
}

echo json_encode($lines);

?>
