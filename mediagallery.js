/*==============================================================================
(C) Copyright 2016,2023 John J Kauflin, All rights reserved.
--------------------------------------------------------------------------------
DESCRIPTION:    A general media gallery that can organize and display photos,
                auido (MP3s), video (YouTube links), and docs (PDF), using 
                only HTML 5, vanilla js, and Bootstrap (no external libraries)
--------------------------------------------------------------------------------
Modification History
 * 2016-03-12 JJK   Got bootstrap gallery version of blueimp working
    	Extra small devices Phones (<768px)
    	Small devices Tablets (≥768px)
    	Medium devices Desktops (≥992px)
    	Large devices Desktops (≥1200px)
 * 2017-10-08 JJK	Update to HTML5 boilerplate 6, bootstrap 3.3, jquery 3
 * 2018-10-04 JJK   Got newest photo gallery working and kept old docModal
 *                  display for PDF documents
 * 2018-11-23 JJK   Re-factored for modules
 * 2018-12-26 JJK   Brought from hoa web to personal one
 *                  *** work to make it even more abstracted and generic ***
 * 2019-01-12 JJK   Modified to add a title above the video iframe, and 
 *                  solved the order problem by updating the getDirList.php
 * 2020-02-20 JJK   Trying to make it more of a self-contained, configurable
 *                  library.  Starting with a configuration array.
 * 2020-02-22 JJK   Got it working with folders under a parent directory
 *                  (looking for the 2nd slash)
 * 2020-02-23 JJK   Re-working as a single collection of folders under the
 *                  parent Media directory
 * 2020-02-29 JJK   Working on the audio player and playlist, and moving
 *                  files to a media gallery folder (to make a better library)
 *                  Introduced a MediaRootDir
 * 2020-03-05 JJK   Adding ability to copy URL for folders for links to share
 * 2020-03-07 JJK   Adding handling of PDF docs
 * 2020-03-14 JJK   Modified to get the Media root dir from a PHP file
 * 2020-03-21 JJK   Added a MediaConfig button to execute a createThumbnail
 *                  on a media directory (if thumbnails are missing)
 * 2020-07-10 JJK   Modified to handle folder location under a sub-folder
 *                  rather than the web root directory
 * 2020-12-12 JJK   Modified to work with bootstrap 4 and as a PHP composer
 *                  package in packagist
 * 2020-12-18 JJK   Simplified by just using hard-coded locations
 * 2020-12-19 JJK   Corrected some styling and got the music player working
 * 2020-12-26 JJK   Updated left menu for bootstrap 4 and link-tiles
 * 2020-12-29 JJK   Removed media-dir sets in the buttons and links for now
 *                  (it was confusing the display - I will added functions
 *                  for copying the link address a different way)
 * 2020-12-30 JJK   Added the media-page class to respond to nav-link and
 *                  link-tile request (without having to use href)
 * 2021-05-27 JJK   Updated audio player display
 * 2021-05-31 JJK   Added 2 columns to audio playlist display and check to
 *                  display an album image
 * 2022-02-06 JJK   Modified the YouTube video display to strip off the
 *                  first part of the standard share link if it finds it
 *                  (just use the identifier part with the embed link)
 * 2022-05-20 JJK   Update for bootstrap 5
 * 2022-05-21 JJK   Re-did menu panel with new bootstrap 5 accordian
 * 2022-06-02 JJK   Converting JQuery to vanilla javascript (and Fetch)
 * 2022-06-18 JJK   Working on more vanilla js conversion (figured out you
 *                  can't cascade like JQuery).  Removing catch
 *                  of errors at the end of Fetch (would rather have the
 *                  more specific information from uncaught error)
 * 2022-06-25 JJK   Finished testing vanilla javascript version
 * 2022-06-27 JJK   Missed a JQuery reference in loadSong (fixed)
 * 2022-12-31 JJK   Implemented a Search function for the photos display by
 *                  using a Media Gallery database, and updating the 
 *                  getDirList to return the sub-path
 * 2023-01-16 JJK   Implementing new database based menu and file query
 * 2023-01-21 JJK   Implement Menu create based on Media Type
 * 2023-01-23 JJK   Implement Filtered query logic
 * 2023-01-27 JJK   Updated nav tab show logic for link-tile-tab (no longer
 *                  have to set the active manually, just .show() on tab)
 * 2023-01-29 JJK   Getting Videos display working
 * 2023-02-03 JJK   Getting Music display working
 * 2023-02-20 JJK   Re-implemented menu folder concept for start date beyond
 *                  current max. 300 set
 * 2023-04-14 JJK   Implement Admin concepts into main UI (based on users
 *                  authenticated with jjklogin)
 * 2023-04-20 JJK   Implement Prev and Next for thumbnail display
 * 2023-04-25 JJK   Added displayFileList and display function (for Admin functions)
 * 2023-04-27 JJK   Modify to add MediaFilter elements dynamically
 * 2023-05-04 JJK   Working on filter responses
 * 2023-05-05 JJK   Added mediaPageContainer to dynamically build display
 *                  (and be able to create Admin/Edit view), and combined
 *                  queries into getMediaInfo
 * 2023-05-11 JJK   Working on editSwitch toggle
 * 2023-05-14 JJK   Working on edit toggle and update requests
 * 2023-05-21 JJK   Working on Admin Detail and update functions
 * 2023-06-01 JJK   Add Prev/Next (Filter Request) to bottom of thumbnails 
 *                  display
 * 2023-06-11 JJK   Remove the Photos "Smaller" concept and just use original
 *                  photo for all displays
 * 2023-06-13 JJK   Added season buttons to filter requests (before and after
 *                  the thumbnails), and fixed bugs in request queries
 * 2023-06-17 JJK   Working on right-click menu context for thumbnails
 * 2023-07-08 JJK   Working on card and edit displays for all types, and
 *                  Albums
 * 2023-07-22 JJK   Working on changing from blueimp lightbox to bs5-lightbox
 *                  (and conforming to ES6 module standards)
 * 2023-07-29 JJK   Gave up on bs5-lightbox too and implemented by own simple
 *                  bs5 modal-based lightbox
 * 2023-07-30 JJK   Working on differences between desktop and mobile and 
 *                  browser displays for lightbox image, and implemented a 
 *                  caching strategy for the next image
 * 2023-08-03 JJK   Implemented a Media Modal to display img and file details
 * 2023-08-04 JJK   Implemented touch and mouse duration check for img modal

2023-08-06 JJK  Moving components to ES6 modules and using import to pull in
2023-08-22 JJK  Switched to using Smaller for lightbox display.  Working on 
                right-click options for downloading original image
2023-08-25 JJK  Working on Album concept
2023-08-26 JJK  Moved menu and album components to modules
2023-09-01 JJK  Moved context menu to module (working on edit functions)
2023-09-08 JJK  Moved DB access and create pages to modules
2023-09-30 JJK  Added handling for an albumKey passed in the URI
2023-12-16 JJK  Removed the MaxRows parameter for query - just put the logic
                in the service with an override if a parameter is included
================================================================================*/
import {mediaType,setMediaType,queryMediaInfo} from './mg-data-repository.js'

const MediaPageLinkClass = "media-page";

//=================================================================================================================
// Bind events

    // Respond to click on a link-tile-tab button by finding the correct TAB and switching/showing it
    // (These link-tile-tab's also have media-page for creating the Menu, but these handled from the listener on that class)
    document.querySelectorAll(".link-tile-tab").forEach(el => el.addEventListener("click", function (event) {
        setMediaType(event.target.getAttribute('data-MediaType'))
        //console.log("link-tile-tab click, mediaType = " + mediaType)

        // Get the target tab based on the the MediaType specified, and use the new Bootstrap v5.2 js for showing the tab
        // the link ('a') with the correct MediaType, within the ".navbar-nav" list
        let targetTabElement = document.querySelector(`.navbar-nav a[data-MediaType="${mediaType}"]`);

        // If the target tab element is found, create a Tab object and call the show() method
        if (typeof targetTabElement !== "undefined" && targetTabElement !== null) {
            bootstrap.Tab.getOrCreateInstance(targetTabElement).show();
        }
    }));

    // Respond to click on a media-page link tab by dynamically building the menu display
    document.querySelectorAll("."+MediaPageLinkClass).forEach(el => el.addEventListener("click", function (event) {
        setMediaType(event.target.getAttribute('data-MediaType'))
        //console.log("media-page click, mediaType = " + mediaType)

        if (typeof mediaType !== "undefined" && mediaType !== null) {
            // >>>>>>>>>>>>>>>>>>>>>>>> this is the START of things <<<<<<<<<<<<<<<<<<<
            let paramData = {
                MediaFilterMediaType: mediaType, 
                getMenu: true,
                MediaFilterCategory: "DEFAULT",
                MediaFilterStartDate: "DEFAULT"}
    
            queryMediaInfo(paramData);
        }
    }));


    // If there is a data-dir parameter, build and display the page
    var paramName = 'albumKey';
    // Look for parameters on the url
    var results = new RegExp('[\?&]' + paramName + '=([^&#]*)').exec(window.location.search);
    if (results != null) {
        let albumKey = results[1] || 0;
        //console.log(">>>>> mediaURI albumKey = " + albumKey);
        albumKey = decodeURIComponent(albumKey);
        setMediaType(1)

        // Clear the parameters from the url
        window.history.replaceState({}, document.title, "/home/");

        let paramData = {
            MediaFilterMediaType: mediaType, 
            getMenu: true,
            MediaFilterAlbumKey: albumKey}
        queryMediaInfo(paramData);

        // Get the target tab based on the the MediaType specified, and use the new Bootstrap v5.2 js for showing the tab
        // the link ('a') with the correct MediaType, within the ".navbar-nav" list
        let targetTabElement = document.querySelector(`.navbar-nav a[data-MediaType="${mediaType}"]`);

        // If the target tab element is found, create a Tab object and call the show() method
        if (typeof targetTabElement !== "undefined" && targetTabElement !== null) {
            bootstrap.Tab.getOrCreateInstance(targetTabElement).show();
        }
    }


    // Get random photos (within /Media/images) when the page loads
    /*
    var homePhotoElement = document.getElementById("HomePhoto");
    if (typeof homePhotoElement !== "undefined" && homePhotoElement !== null) {
        let url = jjkgalleryRoot + "getRandomImage.php";
        let urlParamStr = "?mediaTypeDesc=Home";
        fetch(url+urlParamStr)
        .then(response => response.text())
        .then(photoURL => {
            homePhotoElement.setAttribute("src", photoURL);
        })
    }
    var currentPhotoElement = document.getElementById("CurrentPhoto");
    if (typeof currentPhotoElement !== "undefined" && currentPhotoElement !== null) {
        let url = jjkgalleryRoot + "getRandomImage.php";
        let urlParamStr = "?mediaTypeDesc=Current";
        fetch(url+urlParamStr)
        .then(response => response.text())
        .then(photoURL => {
            currentPhotoElement.setAttribute("src", photoURL);
        })
    }
    */

