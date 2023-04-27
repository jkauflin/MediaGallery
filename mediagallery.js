/*==============================================================================
 * (C) Copyright 2016,2022,2023 John J Kauflin, All rights reserved.
 *----------------------------------------------------------------------------
 * DESCRIPTION:  A general media gallery that can organize and display photos,
 *              auido (MP3s), video (YouTube links), and docs (PDF)
 * 
 * Photo Gallery depends on blueimp for display - https://github.com/blueimp/Gallery
 *
 *----------------------------------------------------------------------------
 * Modification History
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
 * 2023-04-25 JJK   Modify to add thumbnail display element dynamically
 * 2023-04-27 JJK   Working on Admin functions
 *============================================================================*/
var mgallery = (function(){
    'use strict';  // Force declaration of variables before use (among other things)

    //=================================================================================================================
    // Private variables for the Module

    var adminFileList = []

    //console.log("window.location.pathname = "+window.location.pathname);
    //var tempPath = window.location.pathname;
    //var strPos = tempPath.indexOf('/vendor/jkauflin');
    //const webRootPath = tempPath.substring(0,strPos);
    //const webRootPath = tempPath;

    // MediaRootDir is appended to the front of all URI paths (that limits the PHP work to files under Media as well)
    //var MediaRootDir = webRootPath + "/Media/";
    var MediaRootDir = window.location.pathname + "Media/";
    var jjkgalleryRoot = "vendor/jkauflin/jjkgallery/";

    // Playlist array and index (for audio player/playlist diaplay)
    var playlist = [];
    var plIndex = 0;
    // Create an HTML5 audio element in the DOM
    var audioPlayer = document.createElement('audio');
    audioPlayer.setAttribute('controls', true);
    audioPlayer.setAttribute('id', 'AudioPlayer');
    audioPlayer.setAttribute('style', 'transform: scale(1.1);filter: drop-shadow(2px 3px 3px #333); ');
    audioPlayer.style.border = '0';
    audioPlayer.style.outline = '0'
    //audioPlayer.style.padding = '13px 30px 0 10px';
    //audioPlayer.style.padding = '13px 30px 40px 10px';
    //audioPlayer.style.margin = '0';
    audioPlayer.style.padding = '13px 20px 0 0';
    audioPlayer.style.margin = '0 15px 0 10px';

    var MediaOffcanvasMenuId = "MediaOffcanvasMenu";
    var MediaConfigId = "MediaConfig";
    //var MediaConfigButton = "MediaConfigButton";
    
    var MediaMenuRequestClass = "MediaMenuRequest";
    var MediaFilterRequestClass = "MediaFilterRequest";
    var MediaPageLinkClass = "media-page";
    var imgThumbnailClass = "img-thumbnail";
    var playlistSongClass = "playlistSong";
    var audioPrevClass = "fa-step-backward";
    var audioNextClass = "fa-step-forward";


    //=================================================================================================================
    // Variables cached from the DOM
    var menuHeader = document.getElementById("MediaHeader");

    //var configContainer = document.getElementById(MediaConfigId);
    var filterRequestsContainer = document.getElementById("MediaFilterRequests");
    var thumbnailContainer = document.getElementById("MediaThumbnails");
    //var mediaFilterButton = document.getElementById(MediaFilterButton);

    var mediaFilterMediaType = document.getElementById("MediaFilterMediaType")
    var mediaFilterCategory = document.getElementById("MediaFilterCategory")
    var mediaFilterStartDate = document.getElementById("MediaFilterStartDate")
    var mediaFilterSearchStr = document.getElementById("MediaFilterSearchStr")
    var mediaFilterMenuItem = document.getElementById("MediaFilterMenuItem")
    var mediaFilterAlbumTag = document.getElementById("MediaFilterAlbumTag")


    // Non-Printable characters - Hex 01 to 1F, and 7F
    var nonPrintableCharsStr = "[\x01-\x1F\x7F]";
    // "g" global so it does more than 1 substitution
    var regexNonPrintableChars = new RegExp(nonPrintableCharsStr, "g");
    function cleanStr(inStr) {
        return inStr.replace(regexNonPrintableChars, '');
    }

    // Get random photos (within /Media/images) when the page loads
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

    //=================================================================================================================
    // Bind events

    window.addEventListener('contextmenu', (event) => {
        // *** If I ever want to implement some right-click logic ***
        //console.log(event.button)
        // Prevent other actions for the right-click
        //event.preventDefault()
    })

    // Respond to click on a link-tile-tab button by finding the correct TAB and switching/showing it
    // (These link-tile-tab's also have media-page for creating the Menu, but these handled from the listener on that class)
    document.querySelectorAll(".link-tile-tab").forEach(el => el.addEventListener("click", function (event) {
        let mediaType = event.target.getAttribute('data-MediaType')
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
        let mediaType = event.target.getAttribute('data-MediaType')
        //console.log("media-page click, mediaType = " + mediaType)

        if (typeof mediaType !== "undefined" && mediaType !== null) {
            empty(thumbnailContainer);
            createMenu(mediaType);
            // Query based on default Category and Start Date
            executeFilter()
        }
    }));


    // If there is a data-dir parameter, build and display the page
    /*
    var dataDirName = 'data-dir';
    // Look for parameters on the url
    var results = new RegExp('[\?&]' + dataDirName + '=([^&#]*)').exec(window.location.href);
    if (results != null) {
        var dirName = results[1] || 0;
        //console.log(">>>>> mediaURI dirName = " + dirName);
        dirName = decodeURIComponent(dirName);
        var firstSlashPos = dirName.indexOf("/");
        var mediaTypeDesc = dirName;
        if (firstSlashPos >= 0) {
            mediaTypeDesc = dirName.substring(0, firstSlashPos);
        }
        //displayThumbnails(dirName);
                    empty(thumbnailContainer);

        //createMenu(mediaTypeDesc);

        let targetTabElement = document.querySelector(`.navbar-nav a[data-dir="${mediaTypeDesc}"]`);
        // Find the target tab element
        if (typeof targetTabElement !== "undefined" && targetTabElement !== null) {
            // Remove the active class on the current active tab
            document.querySelector(".nav-link.active").classList.remove("active");
            // Show the target tab page
            new bootstrap.Tab(targetTabElement).show();
            // Make the target tab page active (by adding the class)
            targetTabElement.classList.add("active");
        }
    }
    */

    //-------------------------------------------------------------------------------------------------------
    // Listen for clicks in the document body
    // *** Have to listen to Body instead of individual containers (because there are more than 1)
    //-------------------------------------------------------------------------------------------------------
    document.body.addEventListener("click", function (event) {

        // Check for specific classes
        if (event.target && event.target.classList.contains(MediaFilterRequestClass)) {
            // If click on a media folder, create the thumbnails display for that folder

            mediaFilterMediaType = event.target.getAttribute('data-MediaType')
            //let tempStartDate = event.target.getAttribute('data-startDate')
            //tempStartDate = tempStartDate.substring(0,10)

            // >>>> setting Category drop-down from value
            //let categoryValue = event.target.getAttribute('data-category')

            let paramData = {MediaFilterMediaType:event.target.getAttribute('data-MediaType'),
                             MediaFilterCategory:event.target.getAttribute('data-category'),
                             MediaFilterStartDate:event.target.getAttribute('data-startDate')}
	        displayThumbnails(paramData);

        } else if (event.target && event.target.classList.contains(MediaMenuRequestClass)) {
            // If click on a menu item, create the thumbnails display for that item

            // >>>> setting Category drop-down from value
            /*
            mediaFilterCategory.options[index].selected = true;
            
            for (let i = (mediaFilterCategory.options.length-1); i > -1; i--) {
                mediaFilterCategory.options.remove(i)
            }
            for (let index in listInfo.categoryList) {
                mediaCategorySelect.options[mediaCategorySelect.options.length] = new Option(listInfo.categoryList[index], listInfo.categoryList[index])
            }

            mediaFilterSearchStr.value
            */

            //console.log(">>> Filter mediaFilterMenuItem = "+mediaFilterMenuItem.value)
            //console.log(">>> Filter mediaFilterAlbumTag = "+mediaFilterAlbumTag.value)
    
            //let tempStartDate = event.target.getAttribute('data-startDate')
            //tempStartDate = tempStartDate.substring(0,10)

            let paramData = {MediaFilterMediaType:event.target.getAttribute('data-MediaType'),
                             MediaFilterCategory:event.target.getAttribute('data-category'),
                             MediaFilterMenuItem:event.target.getAttribute('data-menuItem'),
                             MediaFilterStartDate:event.target.getAttribute('data-startDate')}
	        displayThumbnails(paramData);

            bootstrap.Offcanvas.getOrCreateInstance('#MediaMenuCanvas').hide();
        }
    });

    // Listen for clicks in the MediaThumbnails container
    thumbnailContainer.addEventListener("click", function (event) {
        event = event || window.event;
        var target = event.target,
            link = target.src ? target.parentNode : target,
            options = { index: link, event: event },
            links = this.getElementsByTagName('a');

        if (target.classList.contains(imgThumbnailClass)) {
            blueimp.Gallery(links, options);
        } else if (target.classList.contains(audioNextClass)) {
            nextSong();
        } else if (target.classList.contains(audioPrevClass)) {
            prevSong();
        } else if (target.classList.contains(playlistSongClass)) {
            let tempAttr = target.getAttribute('data-plIndex');
            if (typeof tempAttr !== "undefined" && tempAttr !== null) {
                loadSong(tempAttr);
            }
        }
    });

    //-------------------------------------------------------------------------------------------------------
    // Respond to Filter requests
    //-------------------------------------------------------------------------------------------------------
    /*
    mediaFilterButton.addEventListener("click", function () {
        executeFilter()
    });
    */
    mediaFilterCategory.addEventListener("change", function () {
        executeFilter()
    });
    mediaFilterStartDate.addEventListener("change", function () {
        executeFilter()
    });
    mediaFilterSearchStr.addEventListener("keypress", function(event) {
        // If the user presses the "Enter" key on the keyboard
        if (event.key === "Enter") {
            // Cancel the default action, if needed
            event.preventDefault();
            executeFilter()
        }
    });

    function executeFilter() {
        console.log(">>> Execute Filter mediaFilterCategory = "+mediaFilterCategory.value)
        console.log(">>> Filter mediaFilterStartDate = "+mediaFilterStartDate.value)
        console.log(">>> Filter mediaFilterSearchStr = "+mediaFilterSearchStr.value)
        console.log(">>> Filter mediaFilterMenuItem = "+mediaFilterMenuItem.value)
        console.log(">>> Filter mediaFilterAlbumTag = "+mediaFilterAlbumTag.value)
    
        let paramData = {MediaFilterMediaType:mediaFilterMediaType.value,
            MediaFilterCategory:mediaFilterCategory.value,
            MediaFilterStartDate:mediaFilterStartDate.value,
            MediaFilterSearchStr:mediaFilterSearchStr.value}

        displayThumbnails(paramData);
    }


    // Add event listeners to the audio player
    // When a song ends, see if there is a next one to play
    audioPlayer.addEventListener("ended", function () {
        nextSong();
    }, true);


    // Respond to Config button clicks
    /*
    configContainer.addEventListener("click", function (event) {
        var $this = $(this);
        //console.log("Click on MediaConfig, data-dir = " + $this.attr('data-dir'));
        // Create thumbnails and smaller photos for images in a directory
        $.get(jjkgalleryRoot + "createThumbnails.php", "subPath=" + $this.attr('data-dir'), function (result) {
            //console.log("createThumbnails, result = " + result);
        });
    });
    */

    //=====================================================================================
    // Default the blueimp gallery controls to borderless fullscreen with no controls
    //=====================================================================================
    /*
    blueimpGallery.data('useBootstrapModal', false);
    blueimpGallery.toggleClass('blueimp-gallery-controls', false);
    blueimpGallery.data('fullScreen', true);

    // Respond to changes in photo gallery configuration
    $('#borderless-checkbox').on('change', function () {
        var borderless = $(this).is(':checked')
        blueimpGallery.data('useBootstrapModal', !borderless)
        blueimpGallery.toggleClass('blueimp-gallery-controls', borderless)
    })
    */
    /*
    $('#fullscreen-checkbox').on('change', function () {
        $('#blueimp-gallery').data('fullScreen', $(this).is(':checked'))
    })
    */

    //=================================================================================================================
    // Module methods

    // Remove all child nodes from an element
    function empty(node) {
        // Could just set the innerHTML to null, but they say removing the children is faster
        // and better for removing any associated events
        //node.innerHTML = "";
        while (node.firstChild) {
            node.removeChild(node.firstChild)
        }
    }

    //------------------------------------------------------------------------------------------------------------
    // Create a collapsible menu from a directory structure
    //------------------------------------------------------------------------------------------------------------
    function createMenu(mediaType) {
        //console.log("createMenu, dir=" + dirName)
        //console.log("createMenu, mediaType = " + mediaType)

        let url = jjkgalleryRoot + "getMenuList.php"
        let urlParamStr = `?mediaType=${mediaType}`
        fetch(url+urlParamStr)
        .then(response => response.json())
        .then(menuList => {
            //buildMenuElements(mediaType,MediaMenuId,menuList)
            buildMenuElements(mediaType,MediaOffcanvasMenuId,menuList)
        });

    } // function createMenu(mediaType) {

    /*
			<div class="col">
                <div id="MediaFilterInputValues" class="container-fluid my-2">
                    <div class="row">
                        <input id="MediaFilterMediaType" type="hidden" class="form-control" value="1">
                        <input id="MediaFilterMenuItem" type="hidden" class="form-control" value="">
                        <input id="MediaFilterAlbumTag" type="hidden" class="form-control" value="">

                        <div class="col-3" >
                            <button class="btn btn-primary float-start" type="button" data-bs-toggle="offcanvas" data-bs-target="#MediaMenuCanvas">
                                <i class="fa fa-chevron-right" ></i> Menu
                            </button>
                        </div>
                        <div class="col">
                            <select id="MediaFilterCategory" class="form-select float-end shadow-none">
                                <option value="0">ALL</option>
                                <option selected value="1 John J Kauflin">1 John J Kauflin</option>
                                <option value="2 John E Kauflin">2 John E Kauflin</option>
                                <option value="3 Baker Family">3 Baker Family</option>
                                <option value="4 Mann Family">4 Mann Family</option>
                                <option value="5 Bands">5 Bands</option>
                                <option value="Mementos">Mementos</option>
                                <option value="Misc">Misc</option>
                                <option value="Albums">Albums</option>
                            </select>
                        </div>
                        <div class="col-2">
                            <button id="MediaFilterButton" type="button" class="btn btn-success float-end shadow-none" disabled>
                                <i class="fa fa-pencil" ></i>
                            </button>
                        </div>
                    </div>

                    <div class="row mt-2">
                        <div class="col-3 d-none d-sm-block">
                            <h5 id=MediaHeader></h5>
                        </div>
                        <div class="col">
                            <div class="row">
                                <div class="col-5">
                                    <input id="MediaFilterStartDate" type="date" class="form-control shadow-none" value="2023-01-01">
                                </div>
                                <div class="col-7">
                                    <input id="MediaFilterSearchStr" type="text" class="form-control shadow-none" placeholder="Search string">
                                </div>
                            </div>
                        </div>
                        <div class="col-2 d-none d-sm-block">
                            <!--
                            <h6 class="float-end">(Edit Mode)</h6>
                            -->
                        </div>
                    </div>
                </div>

                <div id="MediaFilterRequests">
                </div>
                <div id="MediaThumbnails">
                </div>
            </div>
    */

    //------------------------------------------------------------------------------------------------------------
    // Create thumbnails and entity links (for photos, audio, video, etc.)
    //------------------------------------------------------------------------------------------------------------
    //function displayThumbnails(mediaType,category,menuItem,startDate,endDate,searchStr) {
    function displayThumbnails(paramData) {
        //console.log("$$$ displayThumbnails, category: " + category + ", menuItem: "+menuItem);

        empty(filterRequestsContainer);
        empty(thumbnailContainer);
        //empty(configContainer);

        // Clear out the display file list
        adminFileList = []

        // Assuming the media folder are under a parent media folder (look for 1st slash to get sub-path)
        var mediaTypeDesc = "Photos";
        if (paramData.MediaFilterMediaType == 3) {
            mediaTypeDesc = "Music";
        }

        var photosThumbsRoot = mediaTypeDesc + "Thumbs";
        var photosSmallerRoot = mediaTypeDesc + "Smaller";
        //var photosThumbDir = photosThumbsRoot + subPath;
        //var photosSmallerDir = photosSmallerRoot + subPath;

        // Get a list of files from the media gallery database based on query parameters
        let url = jjkgalleryRoot + "getFileList.php"
        fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(paramData)
        })
        .then(response => response.json())
        .then(listInfo => {
            // loop through the list and display thumbnails in a div
            let periodPos = 0
            let fileExt = ''
            let filePath = ''
            let fileSubPath = ''
            let fileNameNoExt = ''

            let docFiles = false
            let audioFiles = false
            playlist.length = 0
            plIndex = -1
            let doclistTbody = document.createElement("tbody")
            var playlistTbody = document.createElement("tbody")

            // Set the UI filter date to the start date of the first file in the query set
            mediaFilterStartDate.value = listInfo.startDate

            //----------------------------------------------------------------------------------------------------
            // If there is a filter request list, create Filter Request buttons with the start date
            //----------------------------------------------------------------------------------------------------
            if (paramData.MediaFilterMediaType == 1 && listInfo.filterList != null) {
                let fileList = listInfo.filterList
                for (let index in listInfo.filterList) {
                    let FilterRec = listInfo.filterList[index]
                    let button = document.createElement("button")
                    button.setAttribute('type',"button")
                    button.setAttribute('role',"button")
                    button.setAttribute('data-MediaType', paramData.MediaFilterMediaType)   // current media type
                    button.setAttribute('data-category', paramData.MediaFilterCategory)     // current category
                    button.setAttribute('data-startDate', FilterRec.startDate)
                    button.classList.add('btn','btn-primary','btn-sm','shadow-none','me-2','mb-2',MediaFilterRequestClass)
                    button.textContent = FilterRec.filterName
                    filterRequestsContainer.appendChild(button)
                }    
            }

            //----------------------------------------------------------------------------------------------------
            // Display thumbnails for files in file list
            //----------------------------------------------------------------------------------------------------
            let fileList = listInfo.fileList
            for (let index in fileList) {
                let fileRec = fileList[index]

                const fileInfo = {
                    Name: fileRec.filename,
                    DirSubPath: fileRec.dirSubPath,
                    Selected: false,
                    CategoryTags: fileRec.CategoryTags,
                    MenuTags: fileRec.MenuTags,
                    AlbumTags: fileRec.AlbumTags,
                    TakenDateTime: fileRec.TakenDateTime,
                    Title: fileRec.Title,
                    Description: fileRec.Description,
                    People: fileRec.People
                };
    
                // Add the file info objects to the main array
                adminFileList[adminFileList.length] = fileInfo

            } // End of Loop through dir list files
            
            mediaAdminMessage.textContent = "Number of images = " + (adminFileList.length)
            displayFileList()
            //displayFileDetail(0)            

        }); // End of Fetch dir list - fetch(url+urlParamStr)

    } // function displayThumbnails(dirName) {


    function displayFileList() {
        empty(thumbnailContainer);

        let fileSubPath = ''
        for (let index in adminFileList) {
            let fi = adminFileList[index]

            /*
            if (fi.DirSubPath != '') {
                fileSubPath = '/' + fi.DirSubPath + '/' + fi.Name;
            }
            else 
            {
                fileSubPath = '/' + fi.Name;
            }
            //console.log("filePath = " + filePath + ", fileSubPath = " + fileSubPath);

            let card = document.createElement("div")
            card.classList.add('card','w-20','float-start')
            let cardCheckbox = document.createElement("input")
            cardCheckbox.classList.add('form-check-input','shadow-none','mx-1','mb-1',imgCheckboxClass)
            cardCheckbox.setAttribute('type', 'checkbox')
            cardCheckbox.setAttribute('data-index', index)
            cardCheckbox.checked = fi.Selected
            card.appendChild(cardCheckbox)
      
            // Add the photo to the gallery link list
            let img = document.createElement("img");
            img.classList.add(imgThumbnailClass)
            // add a class for event click
            img.setAttribute('onerror', "this.onerror=null; this.remove()")
            img.setAttribute('src', MediaRootDir + photosThumbsRoot + fileSubPath)
            img.setAttribute('data-index', index)
            card.appendChild(img)
            thumbnailContainer.appendChild(card)
            */

            if (paramData.MediaFilterMediaType == 2) {
                // VIDEOS

                // Add a table with a title above the iframe
                let table = document.createElement("table");
                table.classList.add('float-start')
                let td = document.createElement("td");
                td.textContent = fileRec.dirSubPath
                let tr = document.createElement("tr");
                tr.appendChild(td)
                table.appendChild(tr)

                let iframe = document.createElement("iframe")
                // Use the embed link for iframe (without https so it can be run locally for testing)
                iframe.setAttribute('src', "//www.youtube.com/embed/" + fileRec.filename);
                iframe.setAttribute('allowfullscreen', true);
                td = document.createElement("td");
                td.appendChild(iframe);
                tr = document.createElement("tr");
                tr.appendChild(td)
                table.appendChild(tr)
                thumbnailContainer.appendChild(table)

            } else {
                if (fileRec.dirSubPath != '') {
                    filePath = MediaRootDir + mediaTypeDesc + '/' + fileRec.dirSubPath + '/' + fileRec.filename;
                    fileSubPath = '/' + fileRec.dirSubPath + '/' + fileRec.filename;
                }
                else 
                {
                    filePath = MediaRootDir + mediaTypeDesc + '/' + fileRec.filename;
                    fileSubPath = '/' + fileRec.filename;
                }
                //console.log("filePath = " + filePath + ", fileSubPath = " + fileSubPath);

                periodPos = fileRec.filename.indexOf(".");
                if (periodPos >= 0) {
                    fileExt = fileRec.filename.substr(periodPos + 1).toUpperCase();
                    fileNameNoExt = fileRec.filename.substr(0,periodPos);
                }

                if (paramData.MediaFilterMediaType == 1) {
                    // PHOTOS

                    // Add the photo to the gallery link list
                    let img = document.createElement("img");
                    img.setAttribute('onerror', "this.onerror=null; this.remove()")
                    img.setAttribute('src', MediaRootDir + photosThumbsRoot + fileSubPath)
                    img.classList.add(imgThumbnailClass)
                    let a = document.createElement("a")
                    a.href = MediaRootDir + photosSmallerRoot + fileSubPath
                    a.title = fileRec.filename
                    a.appendChild(img);
                    thumbnailContainer.appendChild(a)
                    // *** new functions?: right-click copy link address download full (large) version
                } else if (paramData.MediaFilterMediaType == 3) {
                    // MUSIC

                    //console.log("fileNameNoExt = " + fileNameNoExt+", url = "+filePath);
                    audioFiles = true;
                    plIndex++;
                    playlist.push({ "title": fileNameNoExt, "url": filePath });

                    // add the table rows for the playlist
                    // build a table then append to the thumbnail container
                    let a = document.createElement("a")
                    a.href = "#"
                    a.classList.add('class', `${playlistSongClass}`)
                    a.setAttribute('data-plIndex', plIndex);
                    a.textContent = fileNameNoExt
                    let td = document.createElement("td");
                    td.appendChild(a);
                    let tr = document.createElement("tr");
                    tr.appendChild(td);
                    playlistTbody.appendChild(tr)
                } else if (paramData.MediaFilterMediaType == 4) {
                    // DOCS
                    
                    //console.log("PDF file = " + fileRec.filename + ", filePath = " + filePath);
                    docFiles = true;
                    let a = document.createElement("a")
                    a.href = filePath
                    a.setAttribute('target',"_blank");
                    a.textContent = fileNameNoExt
                    let td = document.createElement("td");
                    td.appendChild(a);
                    let tr = document.createElement("tr");
                    tr.classList.add("smalltext")
                    tr.appendChild(td);
                    doclistTbody.appendChild(tr)
                }
            }

        }

                    // if there were any docs, build a table of the filelinks and append to the Thumbnails container
            if (docFiles) {
                empty(thumbnailContainer);

                let table = document.createElement("table");
                table.classList.add('table','table-sm')
                table.appendChild(doclistTbody)
                thumbnailContainer.appendChild(table)
            }
            else if (audioFiles) {
                empty(thumbnailContainer);

                // if there were any MP3's, build a player with the playlist of MP3's
                let h5 = document.createElement("h5");
                h5.id = 'SongTitle'
                h5.classList.add('font-weight-bold')
                thumbnailContainer.appendChild(h5)

                // Append the audioPlayer element
                thumbnailContainer.appendChild(audioPlayer);

                let i = document.createElement("i");
                i.classList.add('fa',`${audioPrevClass}`,'fa-3x')
                let a = document.createElement("a")
                a.id = "AudioPrev"
                a.href = "#"
                a.appendChild(i)
                thumbnailContainer.appendChild(a)

                i = document.createElement("i");
                i.classList.add('fa',`${audioNextClass}`,'fa-3x','mx-2')
                a = document.createElement("a")
                a.id = "AudioNext"
                a.href = "#"
                a.appendChild(i)
                thumbnailContainer.appendChild(a)

                // append the tbody rows to the table, and the table to the Col1 (and thumbnail container)
                let playlistTable = document.createElement("table");
                playlistTable.id = 'PlaylistDisplay'
                playlistTable.classList.add('table', 'table-sm', 'mt-3')
                playlistTable.appendChild(playlistTbody)

                let row = document.createElement("div");
                row.id = 'PlaylistRow'
                row.classList.add('row')
                let col1 = document.createElement("div");
                col1.classList.add('col-sm-7')
                col1.appendChild(playlistTable)
                row.appendChild(col1)
 
                /* >>> re-do how it finds the related MP3 photos for the 2nd column (check new search functions)
                let col2 = document.createElement("div");
                col2.classList.add('col-sm-5')
                let img = document.createElement("img");
                img.setAttribute('onerror', "this.onerror=null; this.remove()")
                img.setAttribute('src', MediaRootDir + mediaTypeDesc + subPath + '/' + 'album.jpg')
                img.classList.add(`${imgThumbnailClass}`,'m-1','p-2')
                col2.appendChild(img)
                row.appendChild(col2)
                */

                thumbnailContainer.appendChild(row)

                // Load and start playing the 1st song in the list
                loadSong(0);
            } 
    }


    function buildMenuElements(mediaType,menuId,menuList) {
        var menuContainer = document.getElementById(menuId);
        if (menuContainer != null) {
            empty(menuContainer)

            var accordionId = menuId + "AccordianContainer";
            let accordianContainer = document.createElement("div")
            accordianContainer.id = accordionId
            accordianContainer.classList.add('accordion')
            accordianContainer.classList.add('accordion-flush')
    
            let itemId = ''
            let accordianItemHeader
            let accordianItem
            let accordianItemBody
            let accordianItemList
            let collapseState = false
            let collapseShow = false
    
            for (let index in menuList) {
                let menu = menuList[index]
    
                menuHeader.textContent = menu.mediaTypeDesc
    
                // Make the 1st panel item un-collapsed
                if (index == 0) {
                    collapseState = false
                    collapseShow = true
                } else {
                    collapseState = true
                    collapseShow = false
                }
    
                // Create the top level item
                accordianItem = document.createElement("div")
                accordianItem.classList.add('accordion-item')
    
                // Create the header for the item
                itemId = menuId + (index + 1)
                accordianItemHeader = document.createElement("h6")
                accordianItemHeader.classList.add('accordion-header')
    
                let button = document.createElement("button");
                button.classList.add('m-1','p-1','accordion-button','shadow-none')
                if (collapseState) {
                    button.classList.add('collapsed')
                }
                button.setAttribute('type',"button")
                button.setAttribute('role',"button")
                button.setAttribute('data-bs-toggle','collapse')
                button.setAttribute('data-bs-target','#' + itemId)
                button.textContent = menu.category;
                accordianItemHeader.appendChild(button)
    
                // Create the body for the item
                accordianItemBody = document.createElement("div")
                accordianItemBody.id = itemId
                accordianItemBody.classList.add('accordion-collapse','collapse')
                if (collapseShow) {
                    accordianItemBody.classList.add('show')
                }
                accordianItemBody.setAttribute('data-bs-parent', '#' + accordionId)
    
                // Create the list for the body
                accordianItemList = document.createElement("ul")
    
                // Add list entries
                for (let index2 in menu.subMenuList) {
                    //console.log("create menu, fileRec.contents filename = "+filename);
                    // Create a link for the media dir folder
                    let a = document.createElement("a")
                    a.setAttribute('href', "#")
                    a.setAttribute('data-MediaType', mediaType)
                    a.setAttribute('data-category', menu.category)
                    a.setAttribute('data-menuItem', menu.subMenuList[index2].menuItem)
                    a.setAttribute('data-startDate', menu.subMenuList[index2].startDate)
                    a.setAttribute('data-endDate', menu.subMenuList[index2].endDate)
                    a.setAttribute('data-searchStr', menu.subMenuList[index2].searchStr)
                    a.classList.add(MediaMenuRequestClass)
                    a.textContent = menu.subMenuList[index2].menuItem
                    let li = document.createElement('li')
                    li.appendChild(a)
                    accordianItemList.appendChild(li)
                }
    
                // Append the item list to the panel item, and the panel item to the menu
                accordianItemBody.appendChild(accordianItemList);
                accordianItem.appendChild(accordianItemHeader);
                accordianItem.appendChild(accordianItemBody);
                accordianContainer.appendChild(accordianItem);
            }    
    
            // Put the created accordian into the Menu DIV on the parent page
            menuContainer.appendChild(accordianContainer);
        }
    }

    // Audio 
    function loadSong(index) {
        plIndex = index;
        let songTitle = document.getElementById("SongTitle");
        songTitle.textContent = playlist[plIndex].title;
        audioPlayer.setAttribute('src', playlist[plIndex].url);
        audioPlayer.pause();
        audioPlayer.load();//suspends and restores all audio element
        //console.log("loaded audio, plIndex = "+plIndex);
        audioPlayer.oncanplaythrough = audioPlayer.play();
    } // function loadSong(index) {

    function nextSong() {
        if (playlist != null) {
            if (plIndex < playlist.length - 1) {
                loadSong(++plIndex);
            }
        }
    }
    function prevSong() {
        if (plIndex > 0) {
            loadSong(--plIndex);
        }
    }

    // This is what is exposed from this Module
    return {
    };
        
})(); // var mgallery = (function(){
