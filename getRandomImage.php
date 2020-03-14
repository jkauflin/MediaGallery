<?php
/*==============================================================================
 * (C) Copyright 2014, 2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Service to return the url path to a random photo in a dir
 *----------------------------------------------------------------------------
 * Modification History
 * 2014-11-12 JJK 	Initial version from old displayRandomImages function
 * 2020-03-14 JJK   Added a MediaRootDir include to define variables
 *============================================================================*/
include 'MediaRootDir.php';

$photoURL = '';
try {
    $mediaImagesDir = $MediaRootDir . 'images/';
    $rootDir = $phpRootReset . $mediaImagesDir;
	if (isset($_REQUEST["rootDir"])) { 
        $inDir = urldecode($_REQUEST["rootDir"] . '/');
        $mediaImagesDir = $mediaImagesDir . $inDir;
        $rootDir = $rootDir . $inDir;
	} 

    //error_log(date('[Y-m-d H:i] '). '$rootDir = ' . $rootDir . PHP_EOL, 3, 'php.log');

	if (file_exists($rootDir)) {
	    $files = scandir($rootDir);
	  	// filter out non images
	  	foreach($files as $file)  {
			if (stripos($rootDir . $file,'.JPG')) {
				$imagesArray[] = $file;
			}
	  	}
	  
	  	$arrayIndex = array_rand($imagesArray);
		$photoURL = $mediaImagesDir . $imagesArray[$arrayIndex];
			
	} // if (file_exists($rootDir)) {

}
catch (Exception $e) {
    //echo 'An error occured: ' .  $e->message;
}

echo $photoURL;
?>
