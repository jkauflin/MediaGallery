<?php
/*==============================================================================
 * (C) Copyright 2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: An example setting file
 *----------------------------------------------------------------------------
 * Modification History
 * 2020-12-13 JJK 	Initial version
 *============================================================================*/

// Set this to include a secrets file from an external (non public-html) file location
require_once "../../../../external_includes/jjkgallery-Secrets.php";

// The secrets file should include the following variables
$MediaRootDir = "Media/";

// When executing from within PHP files, add this to the front of URI paths to get to the parent directory
// for under /vendor/<user>/<package>
$phpRootReset = "../../../";

?>
