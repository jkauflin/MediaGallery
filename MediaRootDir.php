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
 * 2020-07-10 JJK   Added extra level to the phpRootReset and home/ to the
 *                  dirs because website it now under subfolder "home"
 * 2020-07-11 JJK   Getting working under /home
 *============================================================================*/
$MediaRootDir = "Media/";
$MediaGalleryRootDir = "MediaGallery/";
// When executing from within PHP files, add this to the front of URI paths to get to the parent directory
$phpRootReset = "../";
?>
