<?php
/*==============================================================================
 * (C) Copyright 2014,2016 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Recurse through a directory and get list of sub-directories
 *              and files, then create thumbnails.  Use the following 
 * 				CRON job command line:
 *					php -q /home/jkaufl5/public_html/createThumbnails.php
 *----------------------------------------------------------------------------
 * Modification History
 * 2014-04-03 JJK 	Initial version to return a directory list
 * 2016-03-05 JJK   Modified to create thumbnails
 * 2016-05-30 JJK   Added create of MED_ versions of the photo
 * 2016-12-19 JJK	Modified to create thumbnails and smaller photos in 
 * 					separate directories
 * 2016-12-27 JJK   Modified the logging to check operation
 * 2017-05-21 JJK   Modified to only run late at night
 * 2020-03-14 JJK   Added a MediaRootDir include to define variables
 *============================================================================*/
include 'MediaRootDir.php';
define("LOG_FILE", "./createThumbnails.log");

//*** JJK Note: Can't do this because the recursion on a large set of work will cause it
//*** to run out of memory before completing any processing.  Better to let it run with the
//*** default timeout of 30 seconds, but schedule it to run frequently - like every 5 or 10 minutes
//set_time_limit(0);

$outputArray = array();
try {
        /*
        $rootDir = $phpRootReset . $MediaRootDir;
	if (isset($_GET["dir"])) { 
        $rootDir = $rootDir . $_GET["dir"];
    } 
    */

	// Default root
	$rootDir = 'jjkPhotos';
	if (isset($_GET["dir"])) {
		// Override default if passed
		$rootDir = $_GET["dir"];
	} 

	$pid = getmypid();
	//error_log(date('[m-d H:i:s] '). '***** Starting, PID = ' . $pid . PHP_EOL, 3, LOG_FILE);
	//if (date('H') < 7) {
		// If the directory exists, start the processing
		if (file_exists($rootDir)) {
			loopThroughDir($rootDir);
		}
	//}

}
catch (Exception $e) {
    //echo 'An error occured: ' .  $e->message;
}

//echo json_encode($outputArray);
echo 'Finished';
return;


function loopThroughDir($dirPath) {
	//error_log(date('[m-d H:i:s] '). 'dirPath = ' . $dirPath . PHP_EOL, 3, LOG_FILE);
	$dirParts = explode("/", $dirPath);
	// Get the subpath, without the root or the filename
	$subPath = implode('/',array_slice($dirParts,1));
	// Set roots for separate Thumbs and Smaller files
	$thumbRoot = $dirParts[0] . 'Thumbs';
	makedirs($thumbRoot);
	$smallerRoot = $dirParts[0] . 'Smaller';
	makedirs($smallerRoot);
	
	$fileNamePart = '';
	$extension = '';
	$thumbFile = '';
	$thumbPath = '';
	$smallerFile = '';
	$smallerPath = '';
	
	$files = scandir($dirPath);
	$fileURL = '';
	foreach($files as $file)  {
		// Make sure it is a valid directory
		if ($file == "." || $file == "..") {
			continue;
		}
				
		$fileURL = $dirPath.'/'.$file;
		if (is_dir($fileURL)) {
			// Recursively call the function to loop through a directory
			loopThroughDir($fileURL);
			continue;
		}
		
		// Process the non-directory file 		
 		$parts = explode(".", $file);                   // pull apart the name and dissect by period 
	    if (is_array($parts) && count($parts) > 1) {    // does the dissected array have more than one part 
			$fileNamePart = $parts[0];

			// skip thumbnails and Medium files (shouldn't need this anymore)
			/*
			if (substr($file,0,4) == "TBN_" || substr($file,0,4) == "MED_") {
				continue;
			}
			*/

	        $extension = strtoupper(end($parts));       // set to we can see last file extension
	        if ($extension == "JPEG" || $extension == "JPG" || $extension == "PNG" || $extension == "GIF") {
	        	// Create a thumbnail of the photo image
	        	$thumbPath = $thumbRoot . '/' . $subPath;
	        	$thumbFile = $thumbPath . '/' . $file;
	        	makedirs($thumbPath);
	        	
	        	if (!file_exists($thumbFile)) {
	        		error_log(date('[m-d H:i:s] '). 'THUMB for ' . $thumbFile . PHP_EOL, 3, LOG_FILE);
	        		createThumbnail($fileURL, $thumbFile, 130, 130);
	        		//echo 'Thumbnail created = ' . $thumbFile . '<br>';
	        	}
	        	
	        	// Create a medium sized version of the photo image
	        	$smallerPath = $smallerRoot . '/' . $subPath;
	        	$smallerFile = $smallerPath . '/' . $file;
	        	makedirs($smallerPath);
	        	if (!file_exists($smallerFile)) {
	        		//error_log(date('[Y-m-d H:i] '). 'Creating SMALLER for ' . $smallerFile . PHP_EOL, 3, LOG_FILE);
	        		createThumbnail($fileURL, $smallerFile, 2000, 2000);
	        	}
	        	
	        }
	     }

	} // foreach($files as $file)  {

}


/**
 * This code is an improvement over Alex's code that can be found here -> http://stackoverflow.com/a/11376379
 * 
 * This funtion creates a thumbnail with size $thumbnail_width x $thumbnail_height.
 * It supports JPG, PNG and GIF formats. The final thumbnail tries to keep the image proportion.
 * 
 * Warnings and/or notices will also be thrown if anything fails.
 * 
 * Example of usage:
 * 
 * <code>
 * require_once 'create_thumbnail.php';
 * 
 * $success = createThumbnail(__DIR__.DIRECTORY_SEPARATOR.'image.jpg', __DIR__.DIRECTORY_SEPARATOR.'image_thumb.jpg', 60, 60);
 * 
 * echo $success ? 'thumbnail was created' : 'something went wrong';
 * </code>
 * 
 * @author Pedro Pinheiro (https://github.com/PedroVPP).
 * @param string $filepath The image complete path with name. Example: C:\xampp\htdocs\project\image.jpg
 * @param string $thumbpath The path with name of the final thumbnail. Example: C:\xampp\htdocs\project\image_thumbnail.jpg
 * @param int $thumbnail_width Width of the thumbnail. Only integers allowed.
 * @param int $thumbnail_height Height of the thumbnail. Only integers allowed.
 * @return boolean Returns true if the thumbnail was created successfully, false otherwise.
 */
function createThumbnail($filepath, $thumbpath, $thumbnail_width, $thumbnail_height) {
    list($original_width, $original_height, $original_type) = getimagesize($filepath);
    if ($original_width > $original_height) {
        $new_width = $thumbnail_width;
        $new_height = intval($original_height * $new_width / $original_width);
        
        $thumbnail_height = $new_height;
    } else {
        $new_height = $thumbnail_height;
        $new_width = intval($original_width * $new_height / $original_height);
        
        $thumbnail_width = $new_width;
    }
    $dest_x = intval(($thumbnail_width - $new_width) / 2);
    $dest_y = intval(($thumbnail_height - $new_height) / 2);
    
    if ($original_type === 1) {
        $imgt = "ImageGIF";
        $imgcreatefrom = "ImageCreateFromGIF";
    } else if ($original_type === 2) {
        $imgt = "ImageJPEG";
        $imgcreatefrom = "ImageCreateFromJPEG";
    } else if ($original_type === 3) {
        $imgt = "ImagePNG";
        $imgcreatefrom = "ImageCreateFromPNG";
    } else {
        return false;
    }
    
    $old_image = $imgcreatefrom($filepath);
    $new_image = imagecreatetruecolor($thumbnail_width, $thumbnail_height);
    imagecopyresampled($new_image, $old_image, $dest_x, $dest_y, 0, 0, $new_width, $new_height, $original_width, $original_height);
    $imgt($new_image, $thumbpath);
    
    return file_exists($thumbpath);
}

// Recursive make dir function
function makedirs($dirpath, $mode=0777) {
	return is_dir($dirpath) || mkdir($dirpath, $mode, true);
}

?>
