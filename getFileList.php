<?php
/*==============================================================================
 * (C) Copyright 2014,2020,2022,2023 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2014-04-03 JJK 	Initial version to return a directory list
 * 2019-01-12 JJK	Introduced a FileRec and turned the top level as a 
 * 					proper array (to solve the order problem)
 * 2020-03-14 JJK   Added a MediaRootDir include to define variables
 * 2020-12-19 JJK   Hard-coded media root and reset levels
 * 2022-12-31 JJK	Added search string handling with queries to new database
 * 2023-01-16 JJK	Rename getFileList to return a list of files from the
 * 					database query according to parameters
 * 2023-01-23 JJK   Implementing logic to handle Filter parameters POSTed
 * 					in a JSON string
 * 2023-02-19 JJK	Modified to return a structure of both the file list and
 * 					a menu list with other start dates
 * 2023-04-20 JJK	Changed menu list to filter request list and added
 * 					Prev and Next filter requests
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


class ListInfo
{
	public $filterList;
	public $fileList;
	public $startDate;
}

class FilterRec
{
	public $filterName;
	public $startDate;
}

// array of tiles for years, seasons, prev, next, (with a start Date)
// FileList
class FileRec
{
	public $filename;
	public $dirSubPath;
}

$listInfo = new ListInfo();
$filelistArray = array();
$maxRows = 100;
try {
	header("Content-Type: application/json; charset=UTF-8");
	// Get JSON as a string
	$json_str = file_get_contents('php://input');
	// Decode the string to get a JSON object
	$param = json_decode($json_str);

	//------------------------------------------------------------------------------------------------------------
	// Check what parameters have been sent and create the appropriate SQL query to get files
	//------------------------------------------------------------------------------------------------------------
	$sql = "SELECT Name,NameAndPath,FilePath,TakenDateTime FROM FileInfo WHERE ";

	if (empty($param->MediaFilterMediaType)) {
		$param->MediaFilterMediaType = 1;
	}
	$sql = $sql . "MediaTypeId = ? ";

	$wildCategory = "";
	$categoryExists = false;
	if (!empty($param->MediaFilterCategory)) {
		if ($param->MediaFilterCategory != "0") {
			$wildCategory = wildCardStrFromTokens($param->MediaFilterCategory);
			$categoryExists = true;
		}
	}

	$startDateExists = false;
	if (!empty($param->MediaFilterStartDate)) {
		if ($param->MediaFilterStartDate != "0001-01-01 00:00:00") {
			$startDateExists = true;
		}
	}

	//if (!empty($param->MediaFilterEndDate)) {
	//}

	$menuItemExists = false;
	$wildMenuItem = "";
	if (!empty($param->MediaFilterMenuItem)) {
		$wildMenuItem = wildCardStrFromTokens($param->MediaFilterMenuItem);
		$menuItemExists = true;
	}

	$albumTagExists = false;
	$wildAlbumTag = "";
	if (!empty($param->MediaFilterAlbumTag)) {
		$wildAlbumTag = wildCardStrFromTokens($param->MediaFilterAlbumTag);
		$albumTagExists = true;
	}

	$searchStrExists = false;
	$wildSearchStr = "";
	if (!empty($param->MediaFilterSearchStr)) {
		$wildSearchStr = wildCardStrFromTokens($param->MediaFilterSearchStr);
		$searchStrExists = true;
	}

	/*
	$categoryExists
	$startDateExists
	$menuItemExists
	$albumTagExists
	$searchStrExists

	$wildMenuItem
	$wildAlbumTag
	$wildSearchStr
	*/

	if ($categoryExists && $menuItemExists) {
		$sql = $sql . "AND CategoryTags LIKE ? ";
		$sql = $sql . "AND MenuTags LIKE ? ";
	} else if ($categoryExists && $startDateExists && $searchStrExists) {
		$sql = $sql . "AND CategoryTags LIKE ? ";
		$sql = $sql . "AND TakenDateTime >= ? ";
		$sql = $sql . "AND (UPPER(Name) LIKE ? ";
		$sql = $sql . "OR UPPER(Title) LIKE ? ";
		$sql = $sql . "OR UPPER(Description) LIKE ? ";
		$sql = $sql . "OR UPPER(People) LIKE ?) ";
	} else if ($categoryExists && $startDateExists) {
		$sql = $sql . "AND CategoryTags LIKE ? ";
		$sql = $sql . "AND TakenDateTime >= ? ";
	} else if ($categoryExists && $searchStrExists) {
		$sql = $sql . "AND CategoryTags LIKE ? ";
		$sql = $sql . "AND (UPPER(Name) LIKE ? ";
		$sql = $sql . "OR UPPER(Title) LIKE ? ";
		$sql = $sql . "OR UPPER(Description) LIKE ? ";
		$sql = $sql . "OR UPPER(People) LIKE ?) ";
	} else if ($startDateExists && $searchStrExists) {
		$sql = $sql . "AND TakenDateTime >= ? ";
		$sql = $sql . "AND (UPPER(Name) LIKE ? ";
		$sql = $sql . "OR UPPER(Title) LIKE ? ";
		$sql = $sql . "OR UPPER(Description) LIKE ? ";
		$sql = $sql . "OR UPPER(People) LIKE ?) ";
	} else if ($categoryExists) {
		$sql = $sql . "AND CategoryTags LIKE ? ";
	} else if ($searchStrExists) {
		$sql = $sql . " AND (UPPER(Name) LIKE ? ";
		$sql = $sql . "OR UPPER(Title) LIKE ? ";
		$sql = $sql . "OR UPPER(Description) LIKE ? ";
		$sql = $sql . "OR UPPER(People) LIKE ?) ";
	} else if ($startDateExists) {
		$sql = $sql . "AND TakenDateTime >= ? ";
	}

	$sql = $sql . "ORDER BY TakenDateTime,Name LIMIT 100; ";

	//error_log(date('[Y-m-d H:i] '). '$sql = ' . $sql . PHP_EOL, 3, LOG_FILE);
	$conn = getConn($dbHost, $dbUser, $dbPassword, $dbName);
	$stmt = $conn->prepare($sql)  or die($mysqli->error);

	if ($categoryExists && $menuItemExists) {
		$stmt->bind_param("iss",
			$param->MediaFilterMediaType,
			$wildCategory,
			$wildMenuItem);
	} else if ($categoryExists && $startDateExists && $searchStrExists) {
		$stmt->bind_param("issssss",
			$param->MediaFilterMediaType,
			$wildCategory,
			$param->MediaFilterStartDate,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr);
	} else if ($categoryExists && $startDateExists) {
		$stmt->bind_param("iss",
			$param->MediaFilterMediaType,
			$wildCategory,
			$param->MediaFilterStartDate);
	} else if ($categoryExists && $searchStrExists) {
		$stmt->bind_param("isssss",
			$param->MediaFilterMediaType,
			$wildCategory,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr);
	} else if ($startDateExists && $searchStrExists) {
		$stmt->bind_param("isssss",
			$param->MediaFilterMediaType,
			$param->MediaFilterStartDate,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr);
	} else if ($categoryExists) {
		$stmt->bind_param("is",
			$param->MediaFilterMediaType,
			$wildCategory);
	} else if ($searchStrExists) {
		$stmt->bind_param("issss",
			$param->MediaFilterMediaType,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr);
	} else if ($startDateExists) {
		$stmt->bind_param("is",
			$param->MediaFilterMediaType,
			$param->MediaFilterStartDate);
	} else {
		$stmt->bind_param("i",
			$param->MediaFilterMediaType);
	}


	// do a query that gets the count of records first
	// then plan the first file query, and sub-menu items to be included at the top
	// (as well as NEXT and PREV page???)


	$stmt->execute();
	$result = $stmt->get_result();
	$cnt = 0;
	if ($result->num_rows > 0) {
		$firstTakenDateTime = null;
		$lastTakenDateTime = null;
		while($row = $result->fetch_assoc()) {
			$cnt++;
			$fileRec = new FileRec();
			$fileRec->filename = $row["Name"];
			//$fileRec->contents = array();

			$filePath = $row["FilePath"];
			if ($filePath == null || $filePath == '') {
				$dirParts = explode("/", $row["NameAndPath"]);
				//error_log(date('[m-d H:i:s] '). '$dirParts[0] = ' . $dirParts[0] . PHP_EOL, 3, LOG_FILE);
				// Get the subpath, without the root (and without the filename)
				$filePath = implode('/',array_slice($dirParts,1,count($dirParts)-2));
			}

			$fileRec->dirSubPath = $filePath;

			array_push($filelistArray,$fileRec);

			// Save the first and last timestamps
			if ($cnt == 1) {
				$firstTakenDateTime = $row["TakenDateTime"];
				$listInfo->startDate = substr($firstTakenDateTime,0,10);
			}
			$lastTakenDateTime = $row["TakenDateTime"];
		}

		//if ($result->num_rows == $maxRows && $param->MediaFilterMediaType == 1) {
		if ($param->MediaFilterMediaType == 1) {
				// figure out from 1st and last timestamp if list is multiple years or just 1 year
			// if multiple, add menu boxes for years, if one add season boxes?
			// *** No, can just use the first and last from the limited set, have to get "whole" set for
			// *** category from start to full list

			// query by category and start date - for COUNT
			// or somehow just figure out "years" - from the year of the starting date +1 util the current year

			// $param->MediaFilterCategory
			// $param->MediaFilterStartDate

			// $firstTakenDateTime
			//$tempStartDate = $param->MediaFilterStartDate;
			//$tempEndDate = $lastTakenDateTime;

			$listInfo->filterList = array();

			$FilterRec = new FilterRec();
			$FilterRec->filterName = "Prev";
			// Just do prev year for now?
			$tempStartDate = date_parse($firstTakenDateTime);
			$tempEndDate = strtotime($lastTakenDateTime);

			$Year = $tempStartDate["year"] - 1;
			$FilterRec->startDate = (string)$Year . "-01-01";
			array_push($listInfo->filterList,$FilterRec);

			$FilterRec = new FilterRec();
			$FilterRec->filterName = "Next";
			$FilterRec->startDate = date("Y-m-d",$tempEndDate);
			array_push($listInfo->filterList,$FilterRec);
		}
	}
		
	$stmt->close();
	$conn->close();
}
catch (Exception $e) {
	error_log(date('[Y-m-d H:i] '). 'Exception = ' . $e . PHP_EOL, 3, LOG_FILE);
}

//echo json_encode($filelistArray);
$listInfo->fileList = $filelistArray;
echo json_encode($listInfo);

?>
