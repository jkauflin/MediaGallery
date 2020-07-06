<?php
/*==============================================================================
 * (C) Copyright 2020 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION:  Define variables pointing to the media root directory to be
 *              included in other PHP files.  Define in one place for PHP
 *              and JS use and limit access in PHP's to a single root folder
 *----------------------------------------------------------------------------
 * Modification History
 * 2020-03-14 JJK	Initial version
 *============================================================================*/
$MediaRootDir = "Media/";
$MediaGalleryRootDir = "MediaGallery/";
// When executing from within PHP files, add this to the front of URI paths to get to the parent directory
$phpRootReset = "../";
?>
