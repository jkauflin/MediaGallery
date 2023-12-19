<?php
/*==============================================================================
 * (C) Copyright 2023 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2023-04-06 JJK 	Initial version to update file info in database
 * 2023-05-24 JJK	Updated for new file list
 * 2023-12-18 JJK	Added insert of new video menu and titles
 * 2023-12-19 JJK   Added check for existing MenuItem
 *============================================================================*/
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");
// Assume /vendor is 3 levels up from a file in the package root
require_once dirname(__FILE__, 3) . DIRECTORY_SEPARATOR . 'autoload.php';

// Figure out how many levels up to get to the "public_html" root folder
$webRootDirOffset = substr_count(strstr(dirname(__FILE__),"public_html"),DIRECTORY_SEPARATOR) + 1;
// Get settings and credentials from a file in a directory outside of public_html
// (assume a settings file in the "external_includes" folder one level up from "public_html"
$extIncludePath = dirname(__FILE__, $webRootDirOffset+1).DIRECTORY_SEPARATOR.'external_includes'.DIRECTORY_SEPARATOR;

// Credentials for the Media Gallery database
require_once $extIncludePath.'MediaGallerySecrets.php';
require_once $extIncludePath.'jjkloginSettings.php';

use \jkauflin\jjklogin\LoginAuth;


function getConn($dbHost, $dbUser, $dbPassword, $dbName) {
	// User variables set in the db connection credentials include and open a connection
	$conn = new mysqli($dbHost, $dbUser, $dbPassword, $dbName);
	// Check connection
	if ($conn->connect_error) {
		error_log(date('[Y-m-d H:i:s] '). "Connection failed: " . $conn->connect_error . PHP_EOL, 3, LOG_FILE);
		die("Connection failed: " . $conn->connect_error);
	}
	return $conn;
}

// Create a wild card parameter string from the tokens in a string
function wildCardStrFromTokens($inStr) {
	$string = $inStr;
	$token = strtok($string, " ");
	$paramStr = '';
	while ($token !== false)
	{
		$paramStr = $paramStr . '%' . $token;
		$token = strtok(" ");
	}
	$paramStr = $paramStr . '%';
	//error_log('$paramStr = ' . $paramStr);
	return strtoupper($paramStr);
}


$returnMsg = "Record Save started";
try {
    $loginAuth = new LoginAuth($hostJJKLogin, $dbadminJJKLogin, $passwordJJKLogin, $dbnameJJKLogin);
    $userRec = $loginAuth->getUserRec();
    if ($userRec->userName == null || $userRec->userName == '') {
        throw new Exception('User is NOT logged in', 500);
    }
    if ($userRec->userLevel < 9) {
        throw new Exception('User does not have Admin permissions', 500);
    }

	// Get the parameters sent as a JSON structure
	header("Content-Type: application/json; charset=UTF-8");
	// Get JSON as a string
	$json_str = file_get_contents('php://input');
	// Decode the string to get a JSON object
	$param = json_decode($json_str);

	//error_log(date('[Y-m-d H:i] '). '$sql = ' . $sql . PHP_EOL, 3, LOG_FILE);
	$conn = getConn($dbHost, $dbUser, $dbPassword, $dbName);

	$newVideos = false;
	if (!empty($param->newVideos)) {
		$newVideos = $param->newVideos;
	}

	$sql = "";
	$updCnt = 0;
	$tempIndex = -1;
	$categoryId = 0;
	$videoMenuItem = "";
	$videoTitle = "";
	$videoTaken = "";
	$videoDesc = "";
	$videoId = "";
	$currDate = date('[Y-m-d H:i] ');
	$nullDate = "0001-01-01";
	$blankStr = "";
	$pos = -1;
	if ($newVideos) {
		//error_log(date('[Y-m-d H:i] '). 'mediaCategory = ' . $param->mediaCategoryName . PHP_EOL, 3, LOG_FILE);
		//error_log(date('[Y-m-d H:i] '). 'videoMenuItem = ' . $param->videoMenuItem . PHP_EOL, 3, LOG_FILE);

		$videoMenuItem = trim($param->videoMenuItem); 
		$videoTaken = trim($param->videoTaken); 
		$videoDesc = trim($param->videoDescription);

		// Get the CategoryId from the media type and CategoryName
		$sql = "SELECT CategoryId FROM MediaCategory WHERE MediaTypeId = ? AND CategoryName = ?; ";
		$stmt = $conn->prepare($sql)  or die($mysqli->error);
		$stmt->bind_param("is",$param->MediaFilterMediaType,$param->mediaCategoryName);
		$stmt->execute();
		$result = $stmt->get_result();
		$row = $result->fetch_assoc();
		$categoryId = $row["CategoryId"];
		$stmt->close();

		// Check if the MenuItem already exists
		$menuItemFound = false;
		$sql = "SELECT * FROM Menu WHERE CategoryId = ? AND MenuItem = ?; ";
		$stmt = $conn->prepare($sql)  or die($mysqli->error);
		$stmt->bind_param("is",$categoryId,$videoMenuItem);
		$stmt->execute();
		$result = $stmt->get_result();
		if ($result->num_rows > 0) {
			$menuItemFound = true;
		}
		$stmt->close();

		// Insert Menu Item for the new video
		if (!$menuItemFound) {
			$sql = 'INSERT INTO Menu (CategoryId,MenuItem,StartDate,EndDate,SearchStr) VALUES(?,?,?,?,?); ';
			$stmt = $conn->prepare($sql);
			$stmt->bind_param("issss",$categoryId,$videoMenuItem,$nullDate,$nullDate,$blankStr);
			$stmt->execute();
			$stmt->close();
		}

		// Insert Media Info records for the videos in the list
		foreach(explode("\n",$param->videoList) as $video) {
			if (!empty($video)) {
				$videoId = trim($video);
				$videoTitle = $videoMenuItem; 
				$pos = strpos($video,":");
				if ($pos) {
					$videoTitle = trim(substr($video,0,$pos));
					$videoId = trim(substr($video,$pos+1));
				}

				$sql = 'INSERT INTO FileInfo (Name,MediaTypeId,CategoryTags,MenuTags,AlbumTags,FullNameLocal,NameAndPath,FilePath,CreateDateTime,LastModified,'
				.'TakenDateTime,Title,Description,People) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?); ';
				$stmt = $conn->prepare($sql);
				$stmt->bind_param("sissssssssssss",
					$videoId,$param->MediaFilterMediaType,$param->mediaCategoryName,$videoMenuItem,
					$blankStr,$blankStr,$blankStr,$blankStr,$currDate,$currDate,$videoTaken,$videoTitle,$videoDesc,$blankStr);
				$stmt->execute();
				$stmt->close();
				$updCnt++;
			}
		}

	} else {
		$sql = "UPDATE FileInfo SET CategoryTags=?,MenuTags=?,AlbumTags=?,TakenDateTime=?,Title=?,Description=?,People=?,ToBeProcessed=0 WHERE Name=? ";
		$stmt = $conn->prepare($sql);
		foreach ($param->mediaInfoFileList as $fi) {
			$tempIndex++;
			if ($param->index >= 0) {
				if ($tempIndex != $param->index) {
					continue;
				}
			} else {
				if (!$fi->Selected) {
					continue;
				}
			}
	
			$stmt->bind_param("ssssssss",$fi->CategoryTags,$fi->MenuTags,$fi->AlbumTags,$fi->TakenDateTime,$fi->Title,$fi->Description,$fi->People,$fi->Name);
			$stmt->execute();
			$updCnt++;
		}
		$stmt->close();
	}

	$conn->close();
	$returnMsg = "Number of records saved = " . $updCnt;
}
catch (Exception $e) {
	$listInfo->returnMsg = "Error in Update";
	error_log(date('[Y-m-d H:i] '). 'Exception = ' . $e . PHP_EOL, 3, LOG_FILE);
}

echo $returnMsg;

?>
