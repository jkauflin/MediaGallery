<?php
/*==============================================================================
 * (C) Copyright 2023 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2023-02-24 JJK 	Initial version to return data for Admin functions
 * 2023-03-03 JJK	Working on return structure and list
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


class ListInfo
{
	public $categoryList;
	public $menuList;
	public $albumList;
	public $peopleList;
	public $fileList;
}

/*
class CategoryRec
{
	public $categoryId;
	public $categoryName;
}
*/

// array of tiles for years, seasons, prev, next, (with a start Date)
// FileList
class FileRec
{
	public $filename;
	public $dirSubPath;
	public $CategoryTags;
	public $MenuTags;
	public $AlbumTags;
	public $TakenDateTime;
	public $Title;
	public $Description;
	public $People;
}


$listInfo = new ListInfo();
$filelistArray = array();
$categoryListArray = array();
$menuListArray = array();
$albumListArray = array();
$peopleListArray = array();
$maxRows = 300;
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

	//------------------------------------------------------------------------------------------------------------
	// Check what parameters have been sent and create the appropriate SQL query to get files
	//------------------------------------------------------------------------------------------------------------
	$sql = "SELECT * FROM FileInfo WHERE ";

	if (empty($param->MediaFilterMediaType)) {
		$param->MediaFilterMediaType = 1;
	}
	$sql = $sql . "MediaTypeId = ? and ToBeProcessed = 1 ";
	$sql = $sql . "ORDER BY TakenDateTime,Name; ";

/*
		category
		people
		album
			Misc
				Art
				Famous People
				Funny 
				History
				Music People
				Nature
*/

	//error_log(date('[Y-m-d H:i] '). '$sql = ' . $sql . PHP_EOL, 3, LOG_FILE);
	$conn = getConn($dbHost, $dbUser, $dbPassword, $dbName);

	//-----------------------------------------------------------------------------------
	// FileInfo
	//-----------------------------------------------------------------------------------
	$stmt = $conn->prepare($sql)  or die($mysqli->error);
	$stmt->bind_param("i",
		$param->MediaFilterMediaType);
	$stmt->execute();
	$result = $stmt->get_result();
	$cnt = 0;
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
			$cnt++;
			$fileRec = new FileRec();
			$fileRec->filename = $row["Name"];
			$filePath = $row["FilePath"];
			if ($filePath == null || $filePath == '') {
				$dirParts = explode("/", $row["NameAndPath"]);
				//error_log(date('[m-d H:i:s] '). '$dirParts[0] = ' . $dirParts[0] . PHP_EOL, 3, LOG_FILE);
				// Get the subpath, without the root (and without the filename)
				$filePath = implode('/',array_slice($dirParts,1,count($dirParts)-2));
			}
			$fileRec->dirSubPath = $filePath;

			$fileRec->CategoryTags = $row["CategoryTags"];
			$fileRec->MenuTags = $row["MenuTags"];
			$fileRec->AlbumTags = $row["AlbumTags"];
			$fileRec->TakenDateTime = $row["TakenDateTime"];
			$fileRec->Title = $row["Title"];
		 	$fileRec->Description = $row["Description"];
			$fileRec->People = $row["People"];
		
			array_push($filelistArray,$fileRec);
		}
	}
	$stmt->close();

	//-----------------------------------------------------------------------------------
	// Category
	//-----------------------------------------------------------------------------------
	$sql = "SELECT CategoryName FROM MediaCategory WHERE ";
	$sql = $sql . "MediaTypeId = ? ";
	$sql = $sql . "ORDER BY CategoryOrder; ";
	$stmt = $conn->prepare($sql)  or die($mysqli->error);
	$stmt->bind_param("i",
		$param->MediaFilterMediaType);
	$stmt->execute();
	$result = $stmt->get_result();
	$cnt = 0;
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
			$cnt++;
			//$categoryRec = new CategoryRec();
			//$categoryRec->categoryId = $row["CategoryId"];
			//$categoryRec->categoryName = $row["CategoryName"];
			//array_push($categoryListArray,$categoryRec);
			array_push($categoryListArray,$row["CategoryName"]);
		}
	}
	$stmt->close();

	//-----------------------------------------------------------------------------------
	// Menu
	//-----------------------------------------------------------------------------------
	$sql = "SELECT m.CategoryId,m.MenuItem FROM MediaCategory c, Menu m";
	$sql = $sql . " WHERE c.MediaTypeId = ? AND m.CategoryId = c.CategoryId";
	$sql = $sql . " ORDER BY m.CategoryId,m.MenuId; ";
	$stmt = $conn->prepare($sql)  or die($mysqli->error);
	$stmt->bind_param("i",
		$param->MediaFilterMediaType);
	$stmt->execute();
	$result = $stmt->get_result();
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
			$menuVal = $row["CategoryId"] . " - " . $row["MenuItem"];
			array_push($menuListArray,$menuVal);
		}
	}
	$stmt->close();

	//-----------------------------------------------------------------------------------
	// People
	//-----------------------------------------------------------------------------------
	$sql = "SELECT PeopleName FROM People ";
	$sql = $sql . "ORDER BY PeopleName; ";
	$stmt = $conn->prepare($sql)  or die($mysqli->error);
	$stmt->execute();
	$result = $stmt->get_result();
	if ($result->num_rows > 0) {
		while($row = $result->fetch_assoc()) {
			array_push($peopleListArray,$row["PeopleName"]);
		}
	}
	$stmt->close();

	$conn->close();
}
catch (Exception $e) {
	error_log(date('[Y-m-d H:i] '). 'Exception = ' . $e . PHP_EOL, 3, LOG_FILE);
}

$listInfo->fileList = $filelistArray;
$listInfo->categoryList = $categoryListArray;
$listInfo->menuList = $menuListArray;
$listInfo->albumList = $albumListArray;
$listInfo->peopleList = $peopleListArray;
echo json_encode($listInfo);

?>
