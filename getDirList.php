<?php
/*==============================================================================
 * (C) Copyright 2014,2020,2022 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2014-04-03 JJK 	Initial version to return a directory list
 * 2019-01-12 JJK	Introduced a DirRec and turned the top level as a 
 * 					proper array (to solve the order problem)
 * 2020-03-14 JJK   Added a MediaRootDir include to define variables
 * 2020-12-19 JJK   Hard-coded media root and reset levels
 * 2022-12-31 JJK	Added search string handling with queries to new database
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

class DirRec
{
	public $filename;
	public $contents;
	public $dirSubPath;
}

$MediaRootDir = "Media/";
$phpRootReset = "../../../";
$dir = " ";

$outputArray = array();
try {
    $rootDir = $phpRootReset . $MediaRootDir;
	// 1/13/2023 JJK - local testing
	// http://localhost/jjk/Media/PhotosThumbs/1%20John%20J%20Kauflin/1987-to-1993/1987/1987-12%20049.jpg
    //$rootDir = "D:/";
/*
SELECT `Name`,`Category`,`NameAndPath` FROM `FileInfo` WHERE SUBSTRING(`NameAndPath`,1,47) = 
'Photos/1 John J Kauflin/1987-to-1993/1987/1987/';

SELECT `Name`,`Category`,SUBSTRING(`NameAndPath`,1,47) FROM `FileInfo` WHERE `NameAndPath` = 'Photos/1 John J Kauflin/1987-to-1993/1987/1987/1987-12 001';

WHERE `NameAndPath` = 'Photos/5 Bands/Band Parties/2007-Present/2017-09-02 Rockfest 15/_J4A3717.JPG';

SELECT `Name`,`Category`,`NameAndPath` FROM `FileInfo` WHERE SUBSTRING(`NameAndPath`,1,64) = 
'Photos/5 Bands/Band Parties/2007-Present/2017-09-02 Rockfest 15/';
*/

	if (isset($_GET["dir"])) {
		$dir = $_GET["dir"]; 
        $rootDir = $rootDir . $dir;
	} 

	if (isset($_GET["dir2"])) {
		$dir2 = $_GET["dir2"]; 
        $rootDir = $rootDir . $dir2;
	} 

	$sort = '0';				
	if (isset($_GET["sort"])) { 
		$sort = $_GET["sort"];
	} 

	$searchStr = '';
	if (isset($_GET["searchStr"])) { 
		$searchStr = $_GET["searchStr"];
	} 


	$dirParts = " ";

	if (!empty($searchStr)) {
		$paramStr = wildCardStrFromTokens($searchStr);
		$sql = "SELECT Name,NameAndPath FROM FileInfo WHERE ";
		$sql = $sql . "UPPER(Name) LIKE '" . $paramStr . "'";
		//$sql = $sql . " OR UPPER(Category) LIKE '" . $paramStr . "'";
		$sql = $sql . " OR UPPER(Title) LIKE '" . $paramStr . "'";
		$sql = $sql . " OR UPPER(Description) LIKE '" . $paramStr . "'";
		$sql = $sql . " OR UPPER(People) LIKE '" . $paramStr . "'";
		$sql = $sql . " ORDER BY TakenDateTime LIMIT 100; ";
		//$sql = $sql . " ORDER BY NameAndPath LIMIT 100; ";

		//error_log(date('[Y-m-d H:i] '). '$sql = ' . $sql . PHP_EOL, 3, 'php.log');
		$conn = getConn($dbHost, $dbUser, $dbPassword, $dbName);
		$stmt = $conn->prepare($sql);
		//$stmt->bind_param("s", $paramStr);
		$stmt->execute();
		$result = $stmt->get_result();
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$dirRec = new DirRec();
				$dirRec->filename = $row["Name"];
				//$dirRec->contents = array();

				$dirParts = explode("/", $row["NameAndPath"]);
				//error_log(date('[m-d H:i:s] '). '$dirParts[0] = ' . $dirParts[0] . PHP_EOL, 3, LOG_FILE);
				// Get the subpath, without the root (and without the filename)
				$dirRec->dirSubPath = implode('/',array_slice($dirParts,1,count($dirParts)-2));

				array_push($outputArray,$dirRec);
			}
		}
		
		$stmt->close();
		$conn->close();
	}
	else if (!empty($dir2)) {
		//$dirParts = explode("/", $dir2);
		// Get the subpath, without the root (and without the filename)
		//$subPath2 = implode('/',array_slice($dirParts,1,count($dirParts)-2));
		// Get the path without the filename
		//$dirPath = implode('/',array_slice($dirParts,0,count($dirParts)-1));
		$dirPath = $dir2;

// SELECT Name,NameAndPath FROM FileInfo WHERE SUBSTRING(NameAndPath,1,41) = 'Photos/1 John J Kauflin/1987-to-1993/1987';
// SELECT Name,NameAndPath FROM FileInfo WHERE SUBSTRING(NameAndPath,1,41) = 'Photos/1 John J Kauflin/1987-to-1993/1987';

		$sql = "SELECT Name,NameAndPath FROM FileInfo WHERE ";
		//$sql = $sql . "SUBSTRING(NameAndPath,1,41) = 'Photos/1 John J Kauflin/1987-to-1993/1987' ";
		//$sql = $sql . "SUBSTRING(NameAndPath,1,41) = ? ";
		$sql = $sql . "SUBSTRING(NameAndPath,1,?) = ? ";
		$sql = $sql . " ORDER BY TakenDateTime; ";

		//error_log(date('[Y-m-d H:i] '). '$sql = ' . $sql . PHP_EOL, 3, 'php.log');
		$conn = getConn($dbHost, $dbUser, $dbPassword, $dbName);
		$stmt = $conn->prepare($sql)  or die($mysqli->error);
		//$stmt->bind_param("s",$dirPath);
		//$stmt->bind_param("is", strlen($dirPath),$dirPath);
		$stmt->bind_param("is", 41,$dirPath);
		$stmt->execute();
		$result = $stmt->get_result();
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$dirRec = new DirRec();
				$dirRec->filename = $row["Name"];
				//$dirRec->contents = array();

				$dirParts = explode("/", $row["NameAndPath"]);
				//error_log(date('[m-d H:i:s] '). '$dirParts[0] = ' . $dirParts[0] . PHP_EOL, 3, LOG_FILE);
				// Get the subpath, without the root (and without the filename)
				$dirRec->dirSubPath = implode('/',array_slice($dirParts,1,count($dirParts)-2));

				array_push($outputArray,$dirRec);
			}
		}
		
		$stmt->close();
		$conn->close();
	}
	else {
		if (file_exists($rootDir)) {
			$nextLevelDir = '';
			//error_log(date('[Y-m-d H:i] '). '$rootDir = ' . $rootDir . PHP_EOL, 3, 'php.log');
			$files = scandir($rootDir,$sort);

			$dirParts = explode("/", $dir);
			$dirSubPath = implode('/',array_slice($dirParts,1,count($dirParts)-1));

			$fileURL = '';
			foreach($files as $file)  {
				// Make sure it is a valid directory
				if ($file != "." && $file != "..") {
					//error_log(date('[Y-m-d H:i] '). '$file = ' . $file . PHP_EOL, 3, 'php.log');
					$dirRec = new DirRec();
					$dirRec->filename = $file;
					$dirRec->dirSubPath = $dirSubPath;
					$dirRec->contents = array();

					// Get the contents of the directory
					$fileURL = $rootDir.'/'.$file;
					if (is_dir($fileURL)) {
						$files2 = scandir($fileURL,$sort);
						foreach($files2 as $file2) {
							if ($file2 != "." && $file2 != "..") {
								array_push($dirRec->contents,$file2);
							}
						}
					}

					array_push($outputArray,$dirRec);
					
				} // if ($file != "." && $file != "..") {
			} // foreach($files as $file)  {
		} // End of if (file_exists($rootDir)) {
	}

}
catch (Exception $e) {
	//error_log(date('[Y-m-d H:i] '). 'Exception = ' . $e->message . PHP_EOL, 3, 'getDirList.log');
	error_log(date('[Y-m-d H:i] '). 'Exception = ' . $e . PHP_EOL, 3, 'getDirList.log');
}

echo json_encode($outputArray);

/*
		// Default SQL
		$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(p.Parcel_ID) ";
		$paramStr = " ";
		
		if (!empty($parcelId)) {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(p.Parcel_ID) ";
			$paramStr = wildCardStrFromTokens($parcelId);
		} elseif (!empty($lotNo)) {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND p.LotNo ";
			$paramStr = wildCardStrFromTokens($lotNo);
		} elseif (!empty($address)) {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(p.Parcel_Location) ";
			$paramStr = wildCardStrFromTokens($address);
		} elseif (!empty($ownerName)) {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND UPPER(CONCAT(o.Owner_Name1,' ',o.Owner_Name2,' ',o.Mailing_Name)) ";
			// Check if a tokenized string was entered, break it into token and put wildcards between each token?
			// search need to be bullitproof if you are using it for members
			$paramStr = wildCardStrFromTokens($ownerName);
		} elseif (!empty($phoneNo)) {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND UPPER(o.Owner_Phone) ";
			$paramStr = wildCardStrFromTokens($phoneNo);
		} elseif (!empty($altAddress)) {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND UPPER(o.Alt_Address_Line1) ";
			$paramStr = wildCardStrFromTokens($altAddress);
		} elseif (!empty($checkNo)) {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o, hoa_assessments a WHERE p.Parcel_ID = o.Parcel_ID AND p.Parcel_ID = a.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(a.Comments) ";
			$paramStr = wildCardStrFromTokens($checkNo);
		} else {
			$sql = "SELECT * FROM hoa_properties p, hoa_owners o WHERE p.Parcel_ID = o.Parcel_ID AND o.CurrentOwner = 1 AND UPPER(p.Parcel_ID) ";
			// Hardcode the default to find all parcels
			$paramStr = '%r%';
		}
		
		$sql = $sql . "LIKE UPPER(?) ORDER BY p.Parcel_ID; ";
		//error_log('$sql = ' . $sql);
		
		$conn = getConn($host, $dbadmin, $password, $dbname);
		$stmt = $conn->prepare($sql);
		$stmt->bind_param("s", $paramStr);
		$stmt->execute();
		$result = $stmt->get_result();
		
		$outputArray = array();
		if ($result->num_rows > 0) {
			while($row = $result->fetch_assoc()) {
				$hoaPropertyRec = new HoaPropertyRec();
		
				$hoaPropertyRec->parcelId = $row["Parcel_ID"];
				$hoaPropertyRec->lotNo = $row["LotNo"];
				$hoaPropertyRec->subDivParcel = $row["SubDivParcel"];
				$hoaPropertyRec->parcelLocation = $row["Parcel_Location"];
				$hoaPropertyRec->ownerName = $row["Owner_Name1"] . ' ' . $row["Owner_Name2"];
				$hoaPropertyRec->ownerPhone = $row["Owner_Phone"];
		
				array_push($outputArray,$hoaPropertyRec);
			}
		}
		
		$stmt->close();
		$conn->close();
*/

?>
