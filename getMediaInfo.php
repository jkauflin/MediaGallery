<?php
/*==============================================================================
 * (C) Copyright 2023 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION:  Get a media gallery menu list based on media type
 *----------------------------------------------------------------------------
 * Modification History
 * 2023-01-15 JJK 	Initial version to return a menu list from database
 * 2023-04-27 JJK	Added queries for filter functions
 * 2023-05-05 JJK	Rename to getMediaInfo and added file list, also made
 * 					the menu info get controllable by parameter
 * 2023-06-13 JJK   Added max rows as a parameter in all the queries and to
 * 					accept as an input parameter.  Also max the max max
 * 					media type specific
 * 2023-08-26 JJK	Added menu and album string used in the query to the
 * 					output structure
 * 2023-09-17 JJK	Removed currMenu and currAlbum, got AlbumKey working
 * 2023-12-16 JJK	Added logic for MaxRows per media type, but still 
 * 					allowing an included parameter to override (test)
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

class AlbumRec
{
	public $albumKey;
	public $albumName;
	public $albumDesc;
}

// array of tiles for years, seasons, prev, next, (with a start Date)
class FilterRec
{
	public $filterName;
	public $startDate;
}

// FileList
class FileRec
{
	public $Name;
	public $DirSubPath;
	public $Selected;
	public $CategoryTags;
	public $MenuTags;
	public $AlbumTags;
	public $TakenDateTime;
	public $Title;
	public $Description;
	public $People;
}

// Master collection of return info
class MediaInfo
{
	public $categoryList;
	public $menuList;
	public $menuFilter;
	public $albumList;
	public $peopleList;
	public $filterList;
	public $fileList;
	public $startDate;
}

$mediaInfo = new MediaInfo();
$mediaInfo->categoryList = array();
$mediaInfo->menuList = array();
$mediaInfo->menuFilter = array();
$mediaInfo->albumList = array();
$mediaInfo->peopleList = array();
$mediaInfo->fileList = array();
$mediaInfo->filterList = array();

$maxMaxRows = 500;
$maxRows = 200;

// Default to the 1st day of the current year
//$mediaInfo->startDate = date("Y") . "-01-01";
$mediaInfo->startDate = date("Y-m-d", strtotime("-2 months"));
$defaultCategory = "ALL";

try {
	// Get the parameters sent as a JSON structure
	header("Content-Type: application/json; charset=UTF-8");
	// Get JSON as a string
	$json_str = file_get_contents('php://input');
	// Decode the string to get a JSON object
	$param = json_decode($json_str);

	// Get the database connection
	$conn = getConn($dbHost, $dbUser, $dbPassword, $dbName);

	$getMenu = false;
	if (!empty($param->getMenu)) {
		$getMenu = $param->getMenu;
	}

	if (empty($param->MediaFilterMediaType)) {
		$param->MediaFilterMediaType = 1;
	} else {
		$param->MediaFilterMediaType = intval($param->MediaFilterMediaType);
	}

	if ($param->MediaFilterMediaType != 1) {
		$mediaInfo->startDate = "1900-01-01";
	}

	//  If media type is Videos, set the max display thumbnails to less than other thumbnail max
	if ($param->MediaFilterMediaType == 2) {
		$maxRows = 12;
	}
	// Check the max rows setting from parameters to override the default
	if (!empty($param->MaxRows)) {
		$maxRows = intval($param->MaxRows);
		if ($maxRows > $maxMaxRows) {
			$maxRows = $maxMaxRows;
		}
	}

	if ($getMenu) {
		$sql = "SELECT * FROM MediaType t, MediaCategory c, Menu m WHERE ";
		$sql = $sql . " t.MediaTypeId = ? AND c.MediaTypeId = t.MediaTypeId AND m.CategoryId = c.CategoryId ";
		$sql = $sql . " ORDER BY c.CategoryOrder, m.MenuId; ";
		//error_log(date('[Y-m-d H:i] '). '$sql = ' . $sql . PHP_EOL, 3, 'php.log');
	
		$stmt = $conn->prepare($sql) or die($mysqli->error);
		$stmt->bind_param("i", $param->MediaFilterMediaType);
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
						array_push($mediaInfo->menuList,$menuRec);
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
				array_push($mediaInfo->menuList,$menuRec);
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
				//array_push($mediaInfo->categoryList,$categoryRec);
				array_push($mediaInfo->categoryList,$row["CategoryName"]);
				if ($param->MediaFilterMediaType == 1) {
					if ($cnt == 2) {
						$defaultCategory = $row["CategoryName"];
					}
				} else {
					if ($cnt == 1) {
						$defaultCategory = $row["CategoryName"];
					}
				}
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
				array_push($mediaInfo->menuFilter,$menuVal);
			}
		}
		$stmt->close();

		//-----------------------------------------------------------------------------------
		// Album
		//-----------------------------------------------------------------------------------
		$sql = "SELECT * FROM Album";
		$sql = $sql . " ORDER BY AlbumId; ";
		$stmt = $conn->prepare($sql)  or die($mysqli->error);
		$stmt->execute();
		$result = $stmt->get_result();
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$albumRec = new AlbumRec();
				$albumRec->albumKey =$row["AlbumKey"];
				$albumRec->albumName = $row["AlbumName"];
				$albumRec->albumDesc = $row["AlbumDesc"];
				array_push($mediaInfo->albumList,$albumRec);
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
				array_push($mediaInfo->peopleList,$row["PeopleName"]);
			}
		}
		$stmt->close();
	} // if ($param->getMenu) {


	//------------------------------------------------------------------------------------------------------------
	// Check what parameters have been sent and create the appropriate SQL query to get files
	//------------------------------------------------------------------------------------------------------------
	$sql = "SELECT * FROM FileInfo WHERE ";
	$sql = $sql . "MediaTypeId = ? ";

	$wildCategory = "";
	$categoryExists = false;
	if (!empty($param->MediaFilterCategory)) {
		//if ($param->MediaFilterCategory != "0") {
		if ($param->MediaFilterCategory != "ALL") {
			if ($param->MediaFilterCategory == "DEFAULT") {
				$wildCategory = wildCardStrFromTokens($defaultCategory);
			} else {
				$wildCategory = wildCardStrFromTokens($param->MediaFilterCategory);
			}
			$categoryExists = true;
		}
	}

	$startDateExists = false;
	if (!empty($param->MediaFilterStartDate)) {
		if ($param->MediaFilterStartDate == "DEFAULT") {
			$param->MediaFilterStartDate = $mediaInfo->startDate;
		}
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

	$albumKeyExists = false;
	$wildAlbumKey = "";
	if (!empty($param->MediaFilterAlbumKey)) {
		$wildAlbumKey = wildCardStrFromTokens($param->MediaFilterAlbumKey);
		$albumKeyExists = true;
	}

	$searchStrExists = false;
	$wildSearchStr = "";
	if (!empty($param->MediaFilterSearchStr)) {
		$wildSearchStr = wildCardStrFromTokens($param->MediaFilterSearchStr);
		$searchStrExists = true;
	}

	$getNew = false;
	if (!empty($param->getNew)) {
		$getNew = $param->getNew;
	}

	if ($getNew) {
		$sql = $sql . "AND ToBeProcessed = 1 ";

	} else if ($albumKeyExists && $startDateExists) {
		$sql = $sql . "AND AlbumTags LIKE ? ";
		$sql = $sql . "AND TakenDateTime >= ? ";
	} else if ($albumKeyExists) {
		$sql = $sql . "AND AlbumTags LIKE ? ";
	} else if ($categoryExists && $startDateExists && $menuItemExists && $searchStrExists) {
		$sql = $sql . "AND CategoryTags LIKE ? ";
		$sql = $sql . "AND MenuTags LIKE ? ";
		$sql = $sql . "AND TakenDateTime >= ? ";
		$sql = $sql . "AND (UPPER(Name) LIKE ? ";
		$sql = $sql . "OR UPPER(Title) LIKE ? ";
		$sql = $sql . "OR UPPER(Description) LIKE ? ";
		$sql = $sql . "OR UPPER(People) LIKE ?) ";
	} else if ($categoryExists && $menuItemExists && $startDateExists) {
		$sql = $sql . "AND CategoryTags LIKE ? ";
		$sql = $sql . "AND MenuTags LIKE ? ";
		$sql = $sql . "AND TakenDateTime >= ? ";

	} else if ($categoryExists && $menuItemExists) {
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

	$sql = $sql . "ORDER BY TakenDateTime,Name LIMIT ?; ";

	//error_log(date('[Y-m-d H:i] '). '$sql = ' . $sql . PHP_EOL, 3, LOG_FILE);
	$stmt = $conn->prepare($sql)  or die($mysqli->error);

	if ($albumKeyExists && $startDateExists) {
		$stmt->bind_param("issi",
			$param->MediaFilterMediaType,
			$wildAlbumKey,
			$param->MediaFilterStartDate,
			$maxRows);
	} else if ($albumKeyExists) {
		$stmt->bind_param("isi",
			$param->MediaFilterMediaType,
			$wildAlbumKey,
			$maxRows);
	} else if ($categoryExists && $startDateExists && $menuItemExists && $searchStrExists) {
		$stmt->bind_param("isssssssi",
			$param->MediaFilterMediaType,
			$wildCategory,
			$wildMenuItem,
			$param->MediaFilterStartDate,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr,
			$maxRows);
	} else if ($categoryExists && $menuItemExists && $startDateExists) {
		$stmt->bind_param("isssi",
			$param->MediaFilterMediaType,
			$wildCategory,
			$wildMenuItem,
			$param->MediaFilterStartDate,
			$maxRows);
	} else if ($categoryExists && $menuItemExists) {
		$stmt->bind_param("issi",
			$param->MediaFilterMediaType,
			$wildCategory,
			$wildMenuItem,
			$maxRows);
	} else if ($categoryExists && $startDateExists && $searchStrExists) {
		$stmt->bind_param("issssssi",
			$param->MediaFilterMediaType,
			$wildCategory,
			$param->MediaFilterStartDate,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr,
			$maxRows);
	} else if ($categoryExists && $startDateExists) {
		$stmt->bind_param("issi",
			$param->MediaFilterMediaType,
			$wildCategory,
			$param->MediaFilterStartDate,
			$maxRows);
	} else if ($categoryExists && $searchStrExists) {
		$stmt->bind_param("isssssi",
			$param->MediaFilterMediaType,
			$wildCategory,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr,
			$maxRows);
	} else if ($startDateExists && $searchStrExists) {
		$stmt->bind_param("isssssi",
			$param->MediaFilterMediaType,
			$param->MediaFilterStartDate,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr,
			$maxRows);
	} else if ($categoryExists) {
		$stmt->bind_param("isi",
			$param->MediaFilterMediaType,
			$wildCategory,
			$maxRows);
	} else if ($searchStrExists) {
		$stmt->bind_param("issssi",
			$param->MediaFilterMediaType,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr,
			$wildSearchStr,
			$maxRows);
	} else if ($startDateExists) {
		$stmt->bind_param("isi",
			$param->MediaFilterMediaType,
			$param->MediaFilterStartDate,
			$maxRows);
	} else {
		$stmt->bind_param("ii",
			$param->MediaFilterMediaType,
			$maxRows);
	}

	$stmt->execute();
	$result = $stmt->get_result();
	$cnt = 0;
	if ($result->num_rows > 0) {
		$firstTakenDateTime = null;
		$lastTakenDateTime = null;
		while($row = $result->fetch_assoc()) {
			$cnt++;
			$fileRec = new FileRec();
			$fileRec->Name = $row["Name"];
			$filePath = $row["FilePath"];
			if ($filePath == null || $filePath == '') {
				$dirParts = explode("/", $row["NameAndPath"]);
				//error_log(date('[m-d H:i:s] '). '$dirParts[0] = ' . $dirParts[0] . PHP_EOL, 3, LOG_FILE);
				// Get the subpath, without the root (and without the filename)
				$filePath = implode('/',array_slice($dirParts,1,count($dirParts)-2));
			}
			$fileRec->DirSubPath = $filePath;
			$fileRec->Selected = false;
			$fileRec->CategoryTags = $row["CategoryTags"];
			$fileRec->MenuTags = $row["MenuTags"];
			$fileRec->AlbumTags = $row["AlbumTags"];
			$fileRec->TakenDateTime = $row["TakenDateTime"];
			$fileRec->Title = $row["Title"];
		 	$fileRec->Description = $row["Description"];
			$fileRec->People = $row["People"];
			array_push($mediaInfo->fileList,$fileRec);

			// Save the first and last timestamps
			if ($cnt == 1) {
				$firstTakenDateTime = $row["TakenDateTime"];
				$mediaInfo->startDate = substr($firstTakenDateTime,0,10);
			}
			$lastTakenDateTime = $row["TakenDateTime"];
		}

		//if ($result->num_rows == $maxRows && $param->MediaFilterMediaType == 1) {
		//if ($param->MediaFilterMediaType == 1) {
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

			$tempStartDate = date_parse($firstTakenDateTime);
			$tempEndDate = strtotime($lastTakenDateTime);

			$FilterRec = new FilterRec();
			$FilterRec->filterName = "Prev Year";
			$Year = $tempStartDate["year"] - 1;
			$FilterRec->startDate = (string)$Year . "-01-01";
			array_push($mediaInfo->filterList,$FilterRec);

			$FilterRec = new FilterRec();
			$FilterRec->filterName = "Next";
			$FilterRec->startDate = date("Y-m-d",$tempEndDate);
			array_push($mediaInfo->filterList,$FilterRec);

			if ($param->MediaFilterMediaType == 1 && !$albumKeyExists && $cnt > 50) {
				// add some hard coded Season buttons - Winter, Spring, Summer, Fall, Winter ?
				$Year = $tempStartDate["year"];
				$FilterRec = new FilterRec();
				$FilterRec->filterName = "Winter";
				$FilterRec->startDate = (string)$Year . "-01-01";
				array_push($mediaInfo->filterList,$FilterRec);
				$FilterRec = new FilterRec();
				$FilterRec->filterName = "Spring";
				$FilterRec->startDate = (string)$Year . "-04-01";
				array_push($mediaInfo->filterList,$FilterRec);
				$FilterRec = new FilterRec();
				$FilterRec->filterName = "Summer";
				$FilterRec->startDate = (string)$Year . "-07-01";
				array_push($mediaInfo->filterList,$FilterRec);
				$FilterRec = new FilterRec();
				$FilterRec->filterName = "Fall";
				$FilterRec->startDate = (string)$Year . "-10-01";
				array_push($mediaInfo->filterList,$FilterRec);
				$FilterRec = new FilterRec();
				$FilterRec->filterName = "Winter";
				$FilterRec->startDate = (string)$Year . "-12-01";
				array_push($mediaInfo->filterList,$FilterRec);
			}

		//}
	}
	$stmt->close();


	// Close the database connection
	$conn->close();
}
catch (Exception $e) {
	//error_log(date('[Y-m-d H:i] '). 'Exception = ' . $e->message . PHP_EOL, 3, 'getDirList.log');
	error_log(date('[Y-m-d H:i] '). 'Exception = ' . $e . PHP_EOL, 3, LOG_FILE);
}

echo json_encode($mediaInfo);
?>
