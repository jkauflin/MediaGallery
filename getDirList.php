<?php
/*==============================================================================
 * (C) Copyright 2014,2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2014-04-03 JJK 	Initial version to return a directory list
 * 2019-01-12 JJK	Introduced a DirRec and turned the top level as a 
 * 					proper array (to solve the order problem)
 * 2020-03-14 JJK   Added a MediaRootDir include to define variables
 * 2020-12-19 JJK   Hard-coded media root and reset levels
 *============================================================================*/
$MediaRootDir = "Media/";
$phpRootReset = "../../../";

class DirRec
{
	public $filename;
	public $contents;
}
										
$outputArray = array();
try {
    $rootDir = $phpRootReset . $MediaRootDir;
	if (isset($_GET["dir"])) { 
        $rootDir = $rootDir . $_GET["dir"];
	} 

	$sort = '0';				
	if (isset($_GET["sort"])) { 
		$sort = $_GET["sort"];
	} 

	$fileNamePart = '';
	$extension = '';

    //$rootDir = '..' . $rootDir;
	//error_log(date('[Y-m-d H:i] '). '$rootDir = ' . $rootDir . PHP_EOL, 3, 'php.log');

	if (file_exists($rootDir)) {
		$nextLevelDir = '';
		//error_log(date('[Y-m-d H:i] '). '$rootDir = ' . $rootDir . PHP_EOL, 3, 'php.log');
		$files = scandir($rootDir,$sort);

		$fileURL = '';
		foreach($files as $file)  {
			// Make sure it is a valid directory
			if ($file != "." && $file != "..") {
				//error_log(date('[Y-m-d H:i] '). '$file = ' . $file . PHP_EOL, 3, 'php.log');
    			$dirRec = new DirRec();
				$dirRec->filename = $file;
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
catch (Exception $e) {
	error_log(date('[Y-m-d H:i] '). 'Exception = ' . $e->message . PHP_EOL, 3, 'getDirList.log');
}

echo json_encode($outputArray);
?>
