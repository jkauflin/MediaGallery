<?php
/*==============================================================================
 * (C) Copyright 2014,2017 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2014-04-03 JJK 	Initial version to return a array of MP3 file data (for
 * 					a JPlayer)
 * 2014-10-30 JJK   Changed to parameters of artist and album and put the 
 *                  definition of the bands root dir here.
 *                  Commented out the getID3 for now - just use file info
 * 2017-04-15 JJK	Got the latest version of getID3 library from 
 * 					http://www.getid3.org/ and used to return enhanced
 * 					MP3 array list
 * 2017-06-01 JJK	Added filename parameter to rule a single specified file
 * 2017-07-01 JJK   Modified to use the filename if song name is blank
 *                  Modified to build list from playlist if M3U file is
 *                  specified
 *============================================================================*/

// Include getID3() library (can be in a different directory if full path is specified)
require_once('getid3/getid3.php');

function checkVal($inVal) {
	$outVal = '';
	if (isset($inVal)) {
		$outVal = trim($inVal);
		// more input string cleanup ???  invalid characters?
	}
	return $outVal;
}

class Song
{
	public $url;
	public $artist;
	public $album;
	public $genre;
	public $title;
	public $track;
	public $year;
	public $comment;
	public $original_artist;
	public $bitrate;
	public $playtime;
	public $coverArt;
}

// Ignore undefined array index errors
error_reporting( error_reporting() & ~E_NOTICE );

$artistParam = '';
$albumParam = '';	
	$parts = '';
	$extension = '';
	$mp3File = '';
	$artist = '';
	$genre = '';
	$title = '';
	$song = '';
	$year = '';
	
	$tempStr = '';
	$mp3Cnt = 0;

	$rootDir = '';
	if (isset($_REQUEST["dir"])) {
		$rootDir = urldecode($_REQUEST["dir"]);
    }
    
		error_log(date('[Y-m-d H:i] '). "rootDir: " . $rootDir . PHP_EOL, 3, "getMP3Filelist.log");


	if (!file_exists($rootDir)) {
		return;
	}
	if (!is_dir($rootDir)) {
		return;
	}
	
	$filename = '';
	if (isset($_REQUEST["filename"])) {
		$filename = urldecode($_REQUEST["filename"]);
	}

	// If a filename was entered, see if it is a playlist
	$playlist = false;
	if ($filename != '') {
		$parts = explode(".", $filename);                    // pull apart the name and dissect by period
		// Skip if dissected array does not have more than one part
		if (is_array($parts) && count($parts) > 1) {
			$extension = strtoupper(end($parts));        // set to we can see last file extension
			// Skip if not MP3 extension
			if ($extension == "M3U") {
				$playlist = true;
			}
		}
	}

	// Initialize getID3 engine
	$getID3 = new getID3;
	// Tell getID3() to use UTF-8 encoding - must send proper header as well.
	//$getid3->encoding = 'UTF-8';

	$songArray = array();

	if ($playlist) {
		$playlistPath = $rootDir . '/' . $filename;
		$file = fopen($playlistPath,"r");
		$inStr = '';
		while(! feof($file))
  		{
			// Read in the line and strip off the linefeed
			$inStr = rtrim(fgets($file));
			if (substr($inStr,0,1) == "#") {
				continue;
			}
/*
#EXTM3U
#EXTINF:162,Jerry Lee Lewis - Breathless
D:\jjkMusic\Various\Misc\(1999) Loud, Fast & Out Of Control (Disc 4) [Oldies]\16 - Breathless - Jerry Lee Lewis.mp3

#EXTINF:126,Zombies, The - Tell Her No
D:\jjkMusic\Various\Misc\(2007) The British Beat (Disc 2) [Classic Rock]\07 - Tell Her No - Zombies, The.mp3
#EXTINF:572,Firefall - Strange Way
D:\jjkMusic\Easy Listening\Misc\Misc\Firefall - Strange Way.mp3
*/
			$mp3File = substr($inStr,3);
			$mp3File = str_replace('\\','/',$mp3File);
			if ($mp3File == '') {
				continue;
			}

			//error_log("mp3File = " . $mp3File . PHP_EOL, 3, 'getMP3Filelist.log');
			if (!file_exists($mp3File)) {
				continue;
			}

			// Get a new class structure object
			$song = new Song();
			$mp3Cnt = $mp3Cnt + 1;
				
			// Analyze file and store returned data in $ThisFileInfo
			$ThisFileInfo = $getID3->analyze($mp3File);
			getid3_lib::CopyTagsToComments($ThisFileInfo);
			/* if you want to see all the tag data (from all tag formats), uncomment this line: */
			//echo '<br><br>filename = ' . $ThisFileInfo['filename'];
			//echo '<pre>'.htmlentities(print_r($ThisFileInfo['comments'], true), ENT_SUBSTITUTE).'</pre>';
			//echo '<br>fileformat = ' . checkVal($ThisFileInfo['fileformat']);

			$song->url = $mp3File;
			$song->artist = checkVal($ThisFileInfo['comments_html']['artist'][0]);
			$song->album = checkVal($ThisFileInfo['comments_html']['album'][0]);
			$song->genre = checkVal($ThisFileInfo['comments_html']['genre'][0]);
			$song->title = checkVal($ThisFileInfo['comments_html']['title'][0]);
			$song->track = checkVal($ThisFileInfo['comments_html']['track'][0]);
			$song->year = checkVal($ThisFileInfo['comments_html']['year'][0]);
			$song->comment = checkVal($ThisFileInfo['comments_html']['comment'][0]);
			$song->original_artist = checkVal($ThisFileInfo['comments_html']['original_artist'][0]);
			$song->bitrate = '';
			if (!is_null($ThisFileInfo['audio']['bitrate'])) {
				$song->bitrate = (string) intval($ThisFileInfo['audio']['bitrate'])/1000;
			}
			$song->playtime = checkVal($ThisFileInfo['playtime_string']);
			
			if ($song->title == '') {
				/*
				// If a period exists, strip the extension off the filename for the title display
				$pos = stripos($mp3File,'.');
				if ($pos !== false) {
					$song->title = substr($file,0,intval($pos));
				}
				*/
			}
			
			// Set this when needed
			/*
			if (isset($ThisFileInfo['id3v2']['APIC'][0]['data'])) {
				$song->coverArt = @$ThisFileInfo['id3v2']['APIC'][0]['data'];
			}
			*/
			// [data] => ���JFIF��;CREATOR: gd-jpeg v1.0 (using IJG JPEG v80), quality = 80
			/*
			[image_mime] => image/jpeg
			[image_width] => 300
			[image_height] => 300
			[picturetype] => Cover (front)
			[description] =>
			[datalength] => 17729
			*/
			
						/*
			filename = 17 - Do you feel (exerpt).mp3
			fileformat = mp3
			artist = Crunge, The
			album = Basement Tape '89
			genre = Indie
			title = Do you feel (exerpt)
			track = 17
			year = 1989
			comment = JJK ripped by CDex
			last update = JJK update 2010-03-28 08:43:52
			bitrate = 320
			playtime = 6:54
						*/
						
			//echo '<br><br> song = ' . json_encode($song);
			array_push($songArray,$song);

  		} // End of loop to read playlist file

		fclose($file);

	} else {
		// Loop through the files in the directory
        $files = scandir($rootDir);
        

		foreach($files as $file)  {
			// Skip invalid files and directories
			if ($file == "." || $file == ".." || is_dir($file)) {
				continue;
			}

			$parts = explode(".", $file);                    // pull apart the name and dissect by period
			// Skip if dissected array does not have more than one part
			if (!is_array($parts) || count($parts) < 2) {
				continue;
			}

			$extension = strtoupper(end($parts));        // set to we can see last file extension
			// Skip if not MP3 extension
			if ($extension != "MP3") {
				continue;
			}
			
			// If a file was specified, skip all but that one
			if ($filename != '') {
				if ($file != $filename) {
					continue;
				}
			}
			/*
			$title = $file;
			// If a period exists, strip the extension off the filename for the title display
			$pos = stripos($file,'.');
			if ($pos !== false) {
				$title = substr($file,0,intval($pos));
			}
			*/

			$mp3File = $rootDir . '/' . $file;

			// Get a new class structure object
			$song = new Song();
			$mp3Cnt = $mp3Cnt + 1;
				
			// Analyze file and store returned data in $ThisFileInfo
			$ThisFileInfo = $getID3->analyze($mp3File);
			getid3_lib::CopyTagsToComments($ThisFileInfo);
			/* if you want to see all the tag data (from all tag formats), uncomment this line: */
			//echo '<br><br>filename = ' . $ThisFileInfo['filename'];
			//echo '<pre>'.htmlentities(print_r($ThisFileInfo['comments'], true), ENT_SUBSTITUTE).'</pre>';
			//echo '<br>fileformat = ' . checkVal($ThisFileInfo['fileformat']);

			$song->url = $mp3File;
			$song->artist = checkVal($ThisFileInfo['comments_html']['artist'][0]);
			$song->album = checkVal($ThisFileInfo['comments_html']['album'][0]);
			$song->genre = checkVal($ThisFileInfo['comments_html']['genre'][0]);
			$song->title = checkVal($ThisFileInfo['comments_html']['title'][0]);
			$song->track = checkVal($ThisFileInfo['comments_html']['track'][0]);
			$song->year = checkVal($ThisFileInfo['comments_html']['year'][0]);
			$song->comment = checkVal($ThisFileInfo['comments_html']['comment'][0]);
			$song->original_artist = checkVal($ThisFileInfo['comments_html']['original_artist'][0]);
			$song->bitrate = '';
			if (!is_null($ThisFileInfo['audio']['bitrate'])) {
				$song->bitrate = (string) intval($ThisFileInfo['audio']['bitrate'])/1000;
			}
			$song->playtime = checkVal($ThisFileInfo['playtime_string']);
			
			if ($song->title == '') {
				// If a period exists, strip the extension off the filename for the title display
				$pos = stripos($file,'.');
				if ($pos !== false) {
					$song->title = substr($file,0,intval($pos));
				}
			}
			
			// Set this when needed
			/*
			if (isset($ThisFileInfo['id3v2']['APIC'][0]['data'])) {
				$song->coverArt = @$ThisFileInfo['id3v2']['APIC'][0]['data'];
			}
			*/
			// [data] => ���JFIF��;CREATOR: gd-jpeg v1.0 (using IJG JPEG v80), quality = 80
			/*
			[image_mime] => image/jpeg
			[image_width] => 300
			[image_height] => 300
			[picturetype] => Cover (front)
			[description] =>
			[datalength] => 17729
			*/
			
						/*
			filename = 17 - Do you feel (exerpt).mp3
			fileformat = mp3
			artist = Crunge, The
			album = Basement Tape '89
			genre = Indie
			title = Do you feel (exerpt)
			track = 17
			year = 1989
			comment = JJK ripped by CDex
			last update = JJK update 2010-03-28 08:43:52
			bitrate = 320
			playtime = 6:54
						*/
						
			//echo '<br><br> song = ' . json_encode($song);
            array_push($songArray,$song);
            
		    //error_log(date('[Y-m-d H:i] '). "pushed file  " . $mp3File . PHP_EOL, 3, "getMP3Filelist.log");
		    //error_log(date('[Y-m-d H:i] '). "mp3File =  " . $mp3File . PHP_EOL, 3, "getMP3Filelist.log");
			
		} // foreach($files as $file)  {
	} // if NOT playlist

	error_log(date('[Y-m-d H:i] '). "songArray (json) =  " . json_encode($songArray) . PHP_EOL, 3, "getMP3Filelist.log");
	error_log(date('[Y-m-d H:i] '). "after json_encode  " . PHP_EOL, 3, "getMP3Filelist.log");

	echo json_encode($songArray);

?>
