<?php
/*==============================================================================
 * (C) Copyright 2019 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Utility to create a smaller web version and a thumbnail of a
 * 				given image file
 *----------------------------------------------------------------------------
 * Modification History
 * 2019-02-14 JJK	Initial version
 *============================================================================*/
define("LOG_FILE", "./createThumbnail.log");

include 'secrets.php';

try {
	$uid = getParamVal("UID");
	if ($uid != $APIguid) {
		return;
	}
		
	// Check if the file exists
	$file = getParamVal("file");
	if (!file_exists($file)) {
		return;
	}

	//error_log(date('[m-d H:i:s] '). 'file = ' . $file . PHP_EOL, 3, LOG_FILE);
	echo processFile($file);

}
catch (Exception $e) {
	//echo 'An error occured: ' .  $e->message;
	echo 'Error';
}

return;


function processFile($fileNameAndPath) {
	$status = 'Already exists';
	$dirParts = explode("/", $fileNameAndPath);
	//error_log(date('[m-d H:i:s] '). '$dirParts[0] = ' . $dirParts[0] . PHP_EOL, 3, LOG_FILE);
	//error_log(date('[m-d H:i:s] '). '$dirParts count = ' . count($dirParts) . PHP_EOL, 3, LOG_FILE);

	// Get the subpath, without the root or the filename
	//array_slice(array,start,length,preserve)
	$subPath = implode('/',array_slice($dirParts,1,count($dirParts)-2));
	$file = end($dirParts);

	//error_log(date('[m-d H:i:s] '). '$subPath = ' . $subPath . PHP_EOL, 3, LOG_FILE);
	//error_log(date('[m-d H:i:s] '). '$file = ' . $file . PHP_EOL, 3, LOG_FILE);

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
			
 	$parts = explode(".", $file);                   // pull apart the name and dissect by period 
	if (is_array($parts) && count($parts) > 1) {    // does the dissected array have more than one part 
		$fileNamePart = $parts[0];
	    $extension = strtoupper(end($parts));       // set to we can see last file extension
	    if ($extension == "JPEG" || $extension == "JPG" || $extension == "PNG" || $extension == "GIF") {
	        // Create a thumbnail of the photo image
	        $thumbPath = $thumbRoot . '/' . $subPath;
	        $thumbFile = $thumbPath . '/' . $file;
	        makedirs($thumbPath);
	        	
	        if (!file_exists($thumbFile)) {
	        	error_log(date('[m-d H:i:s] '). 'THUMB for ' . $thumbFile . PHP_EOL, 3, LOG_FILE);
	        	createThumbnail($fileNameAndPath, $thumbFile, 130, 130);
				//echo 'Thumbnail created = ' . $thumbFile . '<br>';
				$status = "Created";
	        }
	        	
	        // Create a medium sized version of the photo image
	        $smallerPath = $smallerRoot . '/' . $subPath;
	        $smallerFile = $smallerPath . '/' . $file;
	        makedirs($smallerPath);
	        if (!file_exists($smallerFile)) {
	        	//error_log(date('[Y-m-d H:i] '). 'Creating SMALLER for ' . $smallerFile . PHP_EOL, 3, LOG_FILE);
	        	createThumbnail($fileNameAndPath, $smallerFile, 2000, 2000);
	        }
	        	
	    }
	}

	return $status;
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

function getParamVal($paramName) {
	$paramVal = "";
	if (isset($_REQUEST[$paramName])) {
		$paramVal = trim(urldecode($_REQUEST[$paramName]));
	}
	return $paramVal;
}

?>
