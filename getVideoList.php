<?php
/*==============================================================================
 * (C) Copyright 2014 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2014-04-04 JJK   Initial version to return a list of video ids
 * 2020-03-14 JJK   Added a MediaRootDir include to define variables
 * 2020-12-19 JJK   Hard-coded media root and reset levels
 *============================================================================*/
$MediaRootDir = "Media/";
$phpRootReset = "../../../";

$lines = array();
try {
    $fileURL = $phpRootReset;				
	if (isset($_GET["file"])) { 
		$fileURL = $fileURL . $_GET["file"];
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
