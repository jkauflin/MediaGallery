<?php
/*==============================================================================
 * (C) Copyright 2023 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION:  Get a media gallery menu list based on media type
 *----------------------------------------------------------------------------
 * Modification History
 * 2023-01-15 JJK 	Initial version to return a menu list from database
 *============================================================================*/
// Define a super global constant for the log file (this will be in scope for all functions)
define("LOG_FILE", "./php.log");
// Assume /vendor is 3 levels up from a file in the package root
//require_once dirname(__FILE__, 3) . DIRECTORY_SEPARATOR . 'autoload.php';

// Figure out how many levels up to get to the "public_html" root folder
$webRootDirOffset = substr_count(strstr(dirname(__FILE__),"public_html"),DIRECTORY_SEPARATOR) + 1;
// Get settings and credentials from a file in a directory outside of public_html
// (assume a settings file in the "external_includes" folder one level up from "public_html"
$extIncludePath = dirname(__FILE__, $webRootDirOffset+1).DIRECTORY_SEPARATOR.'external_includes'.DIRECTORY_SEPARATOR;

// Credentials for the Media Gallery database
require_once $extIncludePath.'MediaGallerySecrets.php';

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

function getParamVal($paramName) {
	// REQUEST are variables sent from Input fields in a Form
	// GET are variables from Input fields OR parameter values in the URL
	// *** modify to check both at some point
	// do I need to decode???   (*** no if sent from "internal" call?)
	$paramVal = "";
	if (isset($_REQUEST[$paramName])) {
		$paramVal = trim(urldecode($_REQUEST[$paramName]));
	}
	return $paramVal;
}

class MenuRec
{
	public $mediaTypeDesc;
	public $category;
	public $subMenuList;
}

class SubMenuRec
{
	public $menuItem;
	public $startDate;
	public $endDate;
	public $searchStr;
}

$outputArray = array();
try {

	$mediaTypeId = 1;
	if (isset($_GET["mediaType"])) { 
		$mediaTypeId = $_GET["mediaType"];
	} 

	$sql = "SELECT * FROM MediaType t, MediaCategory c, Menu m WHERE ";
	$sql = $sql . " t.MediaTypeId = ? AND c.MediaTypeId = t.MediaTypeId AND m.CategoryId = c.CategoryId ";
	$sql = $sql . " ORDER BY c.CategoryOrder, m.MenuId; ";
	//error_log(date('[Y-m-d H:i] '). '$sql = ' . $sql . PHP_EOL, 3, 'php.log');

	$conn = getConn($dbHost, $dbUser, $dbPassword, $dbName);
	$stmt = $conn->prepare($sql) or die($mysqli->error);
	$stmt->bind_param("i",$mediaTypeId);
	$stmt->execute();
	$result = $stmt->get_result();
	if ($result->num_rows > 0) {
		$mediaTypeDesc = "";
		$prevCategory = "";
		$category = "";
		$menuRecCnt = 0;
		while($row = $result->fetch_assoc()) {
			$mediaTypeDesc = $row["MediaTypeDesc"];
			$category = $row["CategoryName"];
			if ($category != $prevCategory) {
				if ($menuRecCnt > 0 ) {
					array_push($outputArray,$menuRec);
				}
				$menuRecCnt++;
				$menuRec = new MenuRec();
				$menuRec->mediaTypeDesc = $mediaTypeDesc;
				$menuRec->category = $category;
				$menuRec->subMenuList = array();
				$prevCategory = $category;
			}
				$subMenuRec = new SubMenuRec();
				$subMenuRec->menuItem = $row["MenuItem"];
				$subMenuRec->startDate = $row["StartDate"]; 
				$subMenuRec->endDate = $row["EndDate"]; 
				$subMenuRec->searchStr = $row["SearchStr"];
				array_push($menuRec->subMenuList,$subMenuRec);
		}
		if ($menuRecCnt > 0 ) {
			array_push($outputArray,$menuRec);
		}
	}
	
	$stmt->close();
	$conn->close();
}
catch (Exception $e) {
	//error_log(date('[Y-m-d H:i] '). 'Exception = ' . $e->message . PHP_EOL, 3, 'getDirList.log');
	error_log(date('[Y-m-d H:i] '). 'Exception = ' . $e . PHP_EOL, 3, 'getDirList.log');
}

echo json_encode($outputArray);
?>
