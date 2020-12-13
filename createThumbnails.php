<?php
/*==============================================================================
 * (C) Copyright 2019 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Utility to create a smaller web version and a thumbnail of a
 * 				given image file (from the images in a directory)
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
 * 2020-03-21 JJK   Adjusted to get the paths right
 * 2020-03-22 JJK   Added ability to process a directory
 * 2020-12-13 JJK  Modified to use a settings include 
 *============================================================================*/
require_once '../../../jjkgallerySettings.php';
define("LOG_FILE", "./createThumbnails.log");

try {
    $subPath = getParamVal("subPath");
    $dirRoot = $phpRootReset . $MediaRootDir;
    $fullDirPath = $dirRoot . $subPath;
    //error_log(date('[m-d H:i:s] '). '*** $fullDirPath = ' . $fullDirPath . PHP_EOL, 3, LOG_FILE);

    if (!file_exists($fullDirPath)) {
        //error_log(date('[m-d H:i:s] '). 'Dir does not exist, fullDirPath = ' . $fullDirPath . PHP_EOL, 3, LOG_FILE);
        echo 'Dir does not exist, fullDirPath = '. $fullDirPath;
        return;
    }

	$dirParts = explode("/", $subPath);
	//error_log(date('[m-d H:i:s] '). '$dirParts[0] = ' . $dirParts[0] . PHP_EOL, 3, LOG_FILE);
	// Get the subpath, without the root
	$subPath2 = implode('/',array_slice($dirParts,1,count($dirParts)-1));
	//error_log(date('[m-d H:i:s] '). '$subPath2 = ' . $subPath2 . PHP_EOL, 3, LOG_FILE);

	// Set roots for separate Thumbs and Smaller files
	$thumbRoot = $dirRoot . $dirParts[0] . 'Thumbs';
	makedirs($thumbRoot);
	$smallerRoot = $dirRoot . $dirParts[0] . 'Smaller';
	makedirs($smallerRoot);

    $fileNamePart = '';
    $extension = '';
    $thumbFile = '';
    $thumbPath = '';
    $smallerFile = '';
    $smallerPath = '';
    $fullFilePath = '';

    // Loop through all the files in the directory
    $files = scandir($fullDirPath);
    foreach($files as $file)  {
        // Skip invalid files
        if ($file == "." || $file == "..") {
            continue;
        }

            $fullFilePath = $fullDirPath . '/' . $file;
            error_log(date('[m-d H:i:s] '). '$fullFilePath = ' . $fullFilePath . PHP_EOL, 3, LOG_FILE);

            $parts = explode(".", $file);                   // pull apart the name and dissect by period 
            if (is_array($parts) && count($parts) > 1) {    // does the dissected array have more than one part 
                $fileNamePart = $parts[0];
                $extension = strtoupper(end($parts));       // set to we can see last file extension
                if ($extension == "JPEG" || $extension == "JPG" || $extension == "PNG" || $extension == "GIF") {
                    // Create a thumbnail of the photo image
                    $thumbPath = $thumbRoot . '/' . $subPath2;
                    $thumbFile = $thumbPath . '/' . $file;
                    makedirs($thumbPath);
                    if (!file_exists($thumbFile)) {
                        //error_log(date('[m-d H:i:s] '). 'THUMB for ' . $thumbFile . PHP_EOL, 3, LOG_FILE);
                        createThumbnail($fullFilePath, $thumbFile, 130, 130);
                    }
                        
                    // Create a medium sized version of the photo image
                    $smallerPath = $smallerRoot . '/' . $subPath2;
                    $smallerFile = $smallerPath . '/' . $file;
                    makedirs($smallerPath);
                    if (!file_exists($smallerFile)) {
                        //error_log(date('[Y-m-d H:i] '). 'Creating SMALLER for ' . $smallerFile . PHP_EOL, 3, LOG_FILE);
                        createThumbnail($fullFilePath, $smallerFile, 2000, 2000);
                    }
                        
                } //  if ($extension == "JPEG" || $extension == "JPG" || $extension == "PNG" || $extension == "GIF") {
            } // if (is_array($parts) && count($parts) > 1) {  

    } // foreach($files as $file)  {
    
    echo 'Success';
}
catch (Exception $e) {
    error_log(date('[m-d H:i:s] '). 'Exception: ' .  $e->message . PHP_EOL, 3, LOG_FILE);
	echo 'Error';
}

return;


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

    return;
}

// Recursive make dir function
function makedirs($dirpath, $mode=0755) {
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
