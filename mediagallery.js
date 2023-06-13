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
 *============================================================================*/
var mgallery = (function(){
    'use strict';  // Force declaration of variables before use (among other things)

    //=================================================================================================================
    // Private variables for the Module

    var mediaType = 1
    var mediaInfo
    var menuList = []
    var categoryList = []
    var menuFilter = []
    var albumList = []
    var peopleList = []

    //console.log("window.location.pathname = "+window.location.pathname);
    //var tempPath = window.location.pathname;
    //var strPos = tempPath.indexOf('/vendor/jkauflin');
    //const webRootPath = tempPath.substring(0,strPos);
    //const webRootPath = tempPath;

    // MediaRootDir is appended to the front of all URI paths (that limits the PHP work to files under Media as well)
    //var MediaRootDir = webRootPath + "/Media/";
    //var MediaRootDir = window.location.pathname + "Media/";
    var MediaRootDir = "Media/";
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

    var MediaConfigId = "MediaConfig";
    //var MediaConfigButton = "MediaConfigButton";
    
    var MediaMenuRequestClass = "MediaMenuRequest";
    var MediaFilterRequestClass = "MediaFilterRequest";
    var MediaPageLinkClass = "media-page";
    var currIndex = 0
    var imgThumbnailClass = "img-thumbnail"
    var imgCheckboxClass = "img-checkbox"

    var playlistSongClass = "playlistSong";
    var audioPrevClass = "fa-step-backward";
    var audioNextClass = "fa-step-forward";

    //=================================================================================================================
    // Variables cached from the DOM

    var mediaPageContainer = document.getElementById("MediaPage");
    //var configContainer = document.getElementById(MediaConfigId);
    var filterContainer = document.createElement("div")
    var thumbnailContainer = document.createElement("div")
    var editRow1 = document.createElement("div")

    var mediaAdminMessage

    var mediaCategorySelect
    var mediaMenuSelect
    var mediaPeopleInput
    var mediaPeopleSelect
    var mediaPeopleList

    var mediaFilterMediaType
    var mediaTypeDesc = "Photos"
    var photosThumbsRoot = mediaTypeDesc + "Thumbs";
    //var photosSmallerRoot = mediaTypeDesc + "Smaller";

    var mediaFilterCategory
    var mediaFilterStartDate
    var mediaFilterSearchStr
    var mediaFilterMenuItem
    var mediaFilterAlbumTag

    var mediaDetailFilename
    var mediaDetailTitle
    var mediaDetailTaken
    var mediaDetailImg
    var mediaDetailCategoryTags
    var mediaDetailMenuTags
    var mediaDetailAlbumTags
    var mediaDetailPeopleList
    var mediaDetailDescription

    var getMenu = false
    var editMode = false
    var currSelectAll = false

    var queryCategory = ""
    var querySearchStr = ""
    var queryMenuItem = ""

    // Non-Printable characters - Hex 01 to 1F, and 7F
    var nonPrintableCharsStr = "[\x01-\x1F\x7F]";
    // "g" global so it does more than 1 substitution
    var regexNonPrintableChars = new RegExp(nonPrintableCharsStr, "g");
    function cleanStr(inStr) {
        return inStr.replace(regexNonPrintableChars, '');
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

    //=================================================================================================================
    // Bind events

    var jjkloginEventElement = document.getElementById("jjkloginEventElement")
    jjkloginEventElement.addEventListener('userJJKLoginAuth', function (event) {
        if (event.detail.userLevel >= 9) {
            // If the user is authenticated and has the right security level, add an "Edit" switch
            let editSwitchDiv = document.createElement("div")
            editSwitchDiv.classList.add('form-check','form-switch','float-end','shadow-none')

            let editSwitch = document.createElement("input")
            editSwitch.id = "editSwitch"
            editSwitch.classList.add('form-check-input','shadow-none')
            editSwitch.setAttribute('type',"checkbox")
            editSwitch.setAttribute('role',"switch")
            editSwitchDiv.appendChild(editSwitch)

            let editSwitchLabel = document.createElement("label")
            editSwitchLabel.classList.add('form-check-label')
            editSwitchLabel.setAttribute('for',editSwitch.id)
            editSwitchLabel.textContent = "Edit"
            editSwitchDiv.appendChild(editSwitchLabel)

            mediaPageContainer.appendChild(editSwitchDiv);

            editSwitch.addEventListener("change", function () {
                //console.log(">>> editSwitch.checked = "+editSwitch.checked)
                editMode = editSwitch.checked
                createMediaPage(false)
            });
        }
    });

    window.addEventListener('contextmenu', (event) => {
        // *** If I ever want to implement some right-click logic ***
        //console.log(event.button)
        // Prevent other actions for the right-click
        //event.preventDefault()
    })

    // Respond to click on a link-tile-tab button by finding the correct TAB and switching/showing it
    // (These link-tile-tab's also have media-page for creating the Menu, but these handled from the listener on that class)
    document.querySelectorAll(".link-tile-tab").forEach(el => el.addEventListener("click", function (event) {
        mediaType = event.target.getAttribute('data-MediaType')
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
        mediaType = event.target.getAttribute('data-MediaType')
        //console.log("media-page click, mediaType = " + mediaType)

        if (typeof mediaType !== "undefined" && mediaType !== null) {
            getMenu = true
            // >>>>>>>>>>>>>>>>>>>>>>>> this is the START of things <<<<<<<<<<<<<<<<<<<
            let paramData = {
                MediaFilterMediaType: mediaType, 
                getMenu: getMenu,
                MediaFilterCategory: "DEFAULT",
                MediaFilterStartDate: "DEFAULT"}
    
            queryMediaInfo(paramData);
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
            // If click on a Filter Request (like Next or Prev), query the data and build the thumbnail display
            //console.log(">>> FilterRequest data-category = "+event.target.getAttribute('data-category'))
            //console.log(">>> FilterRequest data-startDate = "+event.target.getAttribute('data-startDate'))
            //console.log(">>> FilterRequest data-searchStr = "+event.target.getAttribute('data-searchStr'))
            //console.log(">>> FilterRequest data-menuItem = "+event.target.getAttribute('data-menuItem'))

            let paramData = {
                MediaFilterMediaType: mediaType, 
                getMenu: false,
                MaxRows: 200,
                MediaFilterCategory:  event.target.getAttribute('data-category'),
                MediaFilterStartDate: event.target.getAttribute('data-startDate'),
                MediaFilterMenuItem: event.target.getAttribute('data-menuItem'),
                MediaFilterSearchStr: event.target.getAttribute('data-searchStr')}

            queryMediaInfo(paramData);

        } else if (event.target && event.target.classList.contains(MediaMenuRequestClass)) {
            // If click on a menu item, query the data and build the thumbnail display
            let paramData = {
                MediaFilterMediaType: mediaType, 
                getMenu: false,
                MediaFilterCategory:  event.target.getAttribute('data-category'),
                MediaFilterMenuItem:  event.target.getAttribute('data-menuItem'),
                MediaFilterStartDate: event.target.getAttribute('data-startDate')}

            queryMediaInfo(paramData);

            bootstrap.Offcanvas.getOrCreateInstance('#MediaMenuCanvas').hide();
        }
    });

    //-------------------------------------------------------------------------------------------------------------------
    // Listen for clicks in the MediaThumbnails container
    //-------------------------------------------------------------------------------------------------------------------
    thumbnailContainer.addEventListener("click", function (event) {
            event = event || window.event
            //let target = event.target
            let target = event.target,
            link = target.src ? target.parentNode : target,
            options = { index: link, event: event },
            links = this.getElementsByTagName('a')

            if (target.classList.contains(imgThumbnailClass)) {
                //console.log("Clicked on image thumbnail")
                if (editMode) {
                    let index = parseInt(target.getAttribute('data-index'))
                    if (typeof index !== "undefined" && index !== null) {
                        //console.log(">>> click on thumbnail img class ")
                        displayFileDetail(index)
                    }
                } else {
                    blueimp.Gallery(links, options);
                }

            } else if (target.classList.contains(imgCheckboxClass)) {
                //console.log("Clicked on image checkbox")
                let index = parseInt(target.getAttribute('data-index'))
                if (typeof index !== "undefined" && index !== null) {
                    mediaInfo.fileList[index].Selected = true
                }
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
    function executeFilter() {
        //console.log(">>> Execute Filter mediaFilterMediaType = "+mediaType)
        //console.log(">>> Execute Filter mediaFilterCategory = "+mediaFilterCategory.value)
        //console.log(">>> Filter mediaFilterStartDate = "+mediaFilterStartDate.value)
        //console.log(">>> Filter mediaFilterSearchStr = "+mediaFilterSearchStr.value)
        //console.log(">>> Filter mediaFilterMenuItem = "+mediaFilterMenuItem.value)
        //console.log(">>> Filter mediaFilterAlbumTag = "+mediaFilterAlbumTag.value)
    
        let paramData = {
            MediaFilterMediaType: mediaType, 
            getMenu: false,
            MediaFilterCategory:  mediaFilterCategory.value,
            MediaFilterStartDate: mediaFilterStartDate.value,
            MediaFilterSearchStr: mediaFilterSearchStr.value}

        queryMediaInfo(paramData);
        // After query has retreived data, it will kick off the display page create
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
    // Query the database for menu and file information and store in js variables
    //------------------------------------------------------------------------------------------------------------
    function queryMediaInfo(paramData) {
        let url = jjkgalleryRoot + "getMediaInfo.php"
        fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(paramData)
        })
        .then(response => response.json())
        .then(responseMediaInfo => {
            // Save the media information in the response
            mediaInfo = responseMediaInfo
            getMenu = paramData.getMenu
            if (getMenu) {
                // Save the menu lists
                menuList = mediaInfo.menuList
                categoryList = mediaInfo.categoryList
                menuFilter = mediaInfo.menuFilter
                albumList = mediaInfo.albumList
                peopleList = mediaInfo.peopleList

                // Set the top level variables from the media type descriptions
                mediaTypeDesc = mediaInfo.menuList[0].mediaTypeDesc
                photosThumbsRoot = mediaTypeDesc + "Thumbs";
            }

            // Save the parameters from the laste query
            queryCategory = paramData.MediaFilterCategory
            querySearchStr = ""
            if (paramData.MediaFilterSearchStr != null && paramData.MediaFilterSearchStr != "") {
                querySearchStr = paramData.MediaFilterSearchStr
            }
            queryMenuItem = ""
            if (paramData.MediaFilterMenuItem != null & paramData.MediaFilterMenuItem != "") {
                queryMenuItem = paramData.MediaFilterMenuItem
            }

            createMediaPage()
        });
    }


    //------------------------------------------------------------------------------------------------------------
    // Dynamically create the DOM elements to add to the Media Page div (either regular display or EDIT mode)
    //------------------------------------------------------------------------------------------------------------
    function createMediaPage() {
        //console.log("$$$$ in the createMediaPage")
        empty(filterContainer)
        empty(thumbnailContainer)
        empty(editRow1)

        if (getMenu) {
            buildMenuElements(mediaType)
        }
        buildFilterElements(mediaType)

        if (editMode) {
            // Create Row and columns
            editRow1.classList.add('row')

            // Col 1
            let editRow1Col1 = document.createElement("div")
            editRow1Col1.classList.add('col-sm-5','col-md-5')

            editRow1Col1.appendChild(thumbnailContainer);
            editRow1.appendChild(editRow1Col1)

            // Col 2
            let editRow1Col2 = document.createElement("div")
            editRow1Col2.classList.add('col-sm-4','col-md-4')

            // GetNEW
            let getNewButton = document.createElement("button")
            getNewButton.classList.add('btn','btn-success','btn-sm','float-start','shadow-none','me-2','my-2')
            getNewButton.setAttribute('type',"button")
            getNewButton.setAttribute('role',"button")
            getNewButton.textContent = "Get NEW"
            editRow1Col2.appendChild(getNewButton)
            getNewButton.addEventListener("click", function () {
                let paramData = {
                    MediaFilterMediaType: mediaType, 
                    getNew: true}
                queryMediaInfo(paramData);
            });

            // SelectALL
            let selectAllButton = document.createElement("button")
            selectAllButton.classList.add('btn','btn-primary','btn-sm','float-start','shadow-none','me-2','my-2')
            selectAllButton.setAttribute('type',"button")
            selectAllButton.setAttribute('role',"button")
            selectAllButton.textContent = "Select ALL"
            editRow1Col2.appendChild(selectAllButton)
            selectAllButton.addEventListener("click", function () {
                currIndex = 0
                if (currSelectAll == true) {
                    currSelectAll = false
                } else {
                    currSelectAll = true
                }
                // Loop through the current file list and set all to Selected
                for (let index in mediaInfo.fileList) {
                    mediaInfo.fileList[index].Selected = currSelectAll
                }        
                //displayFileDetail(currIndex) <<<<< can't select the 1st one because that will turn off the selected for all the rest
                displayCurrFileList()
            });

            // Prev
            let detailPrevButton = document.createElement("button")
            //detailPrevButton.id = "MediaAdminSelectAllButton"
            detailPrevButton.classList.add('btn','btn-warning','btn-sm','float-start','shadow-none','me-2','my-2')
            detailPrevButton.setAttribute('type',"button")
            detailPrevButton.setAttribute('role',"button")
            detailPrevButton.textContent = "Prev"
            editRow1Col2.appendChild(detailPrevButton)
            detailPrevButton.addEventListener("click", function () {
                if (currIndex > 0) {
                    currIndex -= 1
                    displayFileDetail(currIndex)
                }            
            });

            // Next
            let detailNextButton = document.createElement("button")
            //detailNextButton.id = "MediaAdminGetNewButton"
            detailNextButton.classList.add('btn','btn-info','btn-sm','float-start','shadow-none','me-2','my-2')
            detailNextButton.setAttribute('type',"button")
            detailNextButton.setAttribute('role',"button")
            detailNextButton.textContent = "Next"
            editRow1Col2.appendChild(detailNextButton)
            detailNextButton.addEventListener("click", function () {
                if (currIndex < mediaInfo.fileList.length-1) {
                    currIndex += 1
                    displayFileDetail(currIndex)
                }            
            });

            // *** Detail TAGS ***
            mediaDetailFilename = document.createElement("div")
            editRow1Col2.appendChild(mediaDetailFilename)
    
            mediaDetailTitle = document.createElement("input")
            mediaDetailTitle.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailTitle.setAttribute('type', "text")
            mediaDetailTitle.setAttribute('placeholder', "Title")
            editRow1Col2.appendChild(mediaDetailTitle)
    
            mediaDetailTaken = document.createElement("input")
            mediaDetailTaken.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailTaken.setAttribute('type', "text")
            mediaDetailTaken.setAttribute('placeholder', "Taken DateTime")
            editRow1Col2.appendChild(mediaDetailTaken)
    
            mediaDetailImg = document.createElement("img")
            mediaDetailImg.classList.add('img-fluid','rounded','mx-auto','d-block')
            //mediaDetailImg.setAttribute('onerror', "this.onerror=null; this.remove()")
            mediaDetailImg.setAttribute('onerror', "this.onerror=null;this.src='https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';")
            editRow1Col2.appendChild(mediaDetailImg)

            editRow1.appendChild(editRow1Col2)

            // Col 3
            let editRow1Col3 = document.createElement("div")
            editRow1Col3.classList.add('col-sm-3','col-md-3')
            // Category
            mediaCategorySelect = document.createElement("select")
            mediaCategorySelect.classList.add('form-select','float-start','shadow-none','mt-2','py-1')
            for (let index in categoryList) {
                if (index == 1) {
                    mediaCategorySelect.options[mediaCategorySelect.options.length] = new Option(categoryList[index], categoryList[index], true, true)
                } else {
                    mediaCategorySelect.options[mediaCategorySelect.options.length] = new Option(categoryList[index], categoryList[index])
                }
            }
            editRow1Col3.appendChild(mediaCategorySelect);

            mediaMenuSelect = document.createElement("select")
            mediaMenuSelect.classList.add('form-select','float-start','shadow-none','mt-2','py-1')
            for (let index in menuFilter) {
                let tempPos = menuFilter[index].indexOf(' - ')
                mediaMenuSelect.options[mediaMenuSelect.options.length] = new Option(menuFilter[index], menuFilter[index].substring(tempPos+3))
            }
            editRow1Col3.appendChild(mediaMenuSelect);

            //-------------------------------------------------------------------------------------------------------------
            // *** People list ***
            //-------------------------------------------------------------------------------------------------------------
            mediaPeopleSelect = document.createElement("select")
            mediaPeopleSelect.classList.add('form-select','float-start','shadow-none','py-1')
            for (let index in peopleList) {
                mediaPeopleSelect.options[mediaPeopleSelect.options.length] = new Option(peopleList[index], index)
            }

            mediaPeopleInput = document.createElement("input")
            mediaPeopleInput.classList.add('form-control','shadow-none','mt-2','py-1')
            mediaPeopleInput.setAttribute('type',"text")
            mediaPeopleInput.setAttribute('placeholder',"People filter")
            editRow1Col3.appendChild(mediaPeopleInput);
            // Filter the people list from entered value (checked after every key is typed)
            mediaPeopleInput.addEventListener("keyup", function(event) {
                //console.log("mediaPeopleInput.value = "+mediaPeopleInput.value);
                let peopleInputVal = ""
                if (mediaPeopleInput.value != null) {
                    peopleInputVal = mediaPeopleInput.value
                }

                // Remove all options
                for (let i = (mediaPeopleSelect.options.length-1); i > -1; i--) {
                    mediaPeopleSelect.options.remove(i)
                }

                //let searchEx = new RegExp(`//${mediaPeopleInput.value}//i`);
                //string pattern = @"\b[M]\w+";

                //let searchStr = '/'+mediaPeopleInput.value+'/i'
                //let re = new RegExp(`\b${mediaPeopleInput.value}\b`, 'i');
                //let re = new RegExp(`\badam\b`, 'i');

                // Add the ones that match the input value
                for (let index in peopleList) {
                    //if (peopleList[index].search(searchEx) >= 0) {
                    //if (peopleList[index].search(/adam/i) >= 0) {
                    //if (peopleList[index].search(re) >= 0) {
                    if (peopleInputVal != "") {
                        if (peopleList[index].indexOf(peopleInputVal) >= 0) {
                            mediaPeopleSelect.options[mediaPeopleSelect.options.length] = new Option(peopleList[index], index)
                        }
                    } else {
                        mediaPeopleSelect.options[mediaPeopleSelect.options.length] = new Option(peopleList[index], index)
                    }
                }
            });

            editRow1Col3.appendChild(mediaPeopleSelect);

            mediaPeopleList = document.createElement("input")
            mediaPeopleList.classList.add('form-control','shadow-none','py-1')
            mediaPeopleList.setAttribute('type',"text")
            mediaPeopleList.setAttribute('placeholder',"People list")

            let replacePeopleButton = document.createElement("button")
            replacePeopleButton.classList.add('btn','btn-primary','btn-sm','float-start','shadow-none','me-2','my-1')
            replacePeopleButton.setAttribute('type',"button")
            replacePeopleButton.setAttribute('role',"button")
            replacePeopleButton.textContent = "Replace"
            editRow1Col3.appendChild(replacePeopleButton)
            replacePeopleButton.addEventListener("click", function () {
                mediaPeopleList.value = peopleList[mediaPeopleSelect.value]
            });

            let appendPeopleButton = document.createElement("button")
            appendPeopleButton.classList.add('btn','btn-warning','btn-sm','float-start','shadow-none','me-2','my-1')
            appendPeopleButton.setAttribute('type',"button")
            appendPeopleButton.setAttribute('role',"button")
            appendPeopleButton.textContent = "Append"
            editRow1Col3.appendChild(appendPeopleButton)
            appendPeopleButton.addEventListener("click", function () {
                if (mediaPeopleList.value) {
                    mediaPeopleList.value = mediaPeopleList.value + ',' + peopleList[mediaPeopleSelect.value]
                } else {
                    mediaPeopleList.value = peopleList[mediaPeopleSelect.value]
                }
            });

            editRow1Col3.appendChild(mediaPeopleList);

            // Update
            let editUpdateButton = document.createElement("button")
            editUpdateButton.classList.add('btn','btn-info','btn-sm','float-start','shadow-none','mt-3','me-2')
            editUpdateButton.setAttribute('type',"button")
            editUpdateButton.setAttribute('role',"button")
            editUpdateButton.textContent = "Update Selected"
            editRow1Col3.appendChild(editUpdateButton)
            editUpdateButton.addEventListener("click", function () {
                //console.log("mediaCategorySelect.value = "+mediaCategorySelect.value)
                //console.log("mediaMenuSelect.value = "+mediaMenuSelect.value)
                //console.log("mediaPeopleList.value = "+mediaPeopleList.value)
                mediaAdminMessage.textContent = ""

                // update to selected objects in adminFileList
                for (let index in mediaInfo.fileList) {
                    let fi = mediaInfo.fileList[index]
                    if (fi.Selected) {
                        fi.Title = mediaDetailTitle.value
                        fi.TakenDateTime = mediaDetailTaken.value
                        fi.CategoryTags = mediaCategorySelect.value
                        mediaDetailCategoryTags.value = mediaCategorySelect.value
                        fi.MenuTags = mediaMenuSelect.value
                        mediaDetailMenuTags.value = mediaMenuSelect.value
                        fi.AlbumTags = mediaDetailAlbumTags.value
                        fi.People = mediaPeopleList.value
                        mediaDetailPeopleList.value = mediaPeopleList.value
                        fi.Description = mediaDetailDescription.value
                    }
                }
            });
        
            // Save
            let editSaveButton = document.createElement("button")
            //editSaveButton.id = "MediaAdminSaveButton"
            editSaveButton.classList.add('btn','btn-success','btn-sm','float-start','shadow-none','mt-3','me-2','mb-3')
            editSaveButton.setAttribute('type',"button")
            editSaveButton.setAttribute('role',"button")
            editSaveButton.textContent = "Save to DB"
            editRow1Col3.appendChild(editSaveButton)
            editSaveButton.addEventListener("click", function () {
                let paramData = {MediaFilterMediaType: mediaType,
                                 mediaInfoFileList: mediaInfo.fileList}

                let url = jjkgalleryRoot + "updateMediaInfo.php"
                fetch(url, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(paramData)
                })
                .then(response => response.text())
                .then(returnMsg => {
                    //console.log("returnMsg = "+returnMsg)
                    mediaAdminMessage.textContent = returnMsg

                    // Filter out the Selected files (that were updated)
                    mediaInfo.fileList = mediaInfo.fileList.filter(checkSelected);
                    currIndex = 0
                    displayCurrFileList()
                    
                }); // End of Fetch
            });

            // Category Tags
            mediaDetailCategoryTags = document.createElement("input")
            //mediaDetailCategoryTags.id = "MediaDetailCategoryTags"
            mediaDetailCategoryTags.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailCategoryTags.setAttribute('type', "text")
            mediaDetailCategoryTags.setAttribute('placeholder', "Category tags")
            mediaDetailCategoryTags.disabled = true
            editRow1Col3.appendChild(mediaDetailCategoryTags)

            // Menu Tags
            mediaDetailMenuTags = document.createElement("input")
            //mediaDetailMenuTags.id = "MediaDetailMenuTags"
            mediaDetailMenuTags.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailMenuTags.setAttribute('type', "text")
            mediaDetailMenuTags.setAttribute('placeholder', "Menu tags")
            mediaDetailMenuTags.disabled = true
            editRow1Col3.appendChild(mediaDetailMenuTags)

            // Album Tags
            mediaDetailAlbumTags = document.createElement("input")
            //mediaDetailAlbumTags.id = "MediaDetailAlbumTags"
            mediaDetailAlbumTags.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailAlbumTags.setAttribute('type', "text")
            mediaDetailAlbumTags.setAttribute('placeholder', "Album tags")
            editRow1Col3.appendChild(mediaDetailAlbumTags)

            // People List
            mediaDetailPeopleList = document.createElement("input")
            //mediaDetailPeopleList.id = "MediaDetailPeopleList"
            mediaDetailPeopleList.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailPeopleList.setAttribute('type', "text")
            mediaDetailPeopleList.setAttribute('placeholder', "People list")
            mediaDetailPeopleList.disabled = true
            editRow1Col3.appendChild(mediaDetailPeopleList)

            // Description
            mediaDetailDescription = document.createElement("textarea")
            //mediaDetailDescription.id = "MediaDetailDescription"
            mediaDetailDescription.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailDescription.setAttribute('rows', "6")
            mediaDetailDescription.setAttribute('placeholder', "Description")
            //mediaDetailDescription.value = fi.Description
            editRow1Col3.appendChild(mediaDetailDescription)

            // Admin Message
            mediaAdminMessage = document.createElement("div")
            mediaAdminMessage.id = "MediaAdminMessage"
            mediaAdminMessage.classList.add('float-start')
            mediaAdminMessage.textContent = "Number of images = " + (mediaInfo.fileList.length)
            editRow1Col3.appendChild(mediaAdminMessage)
            editRow1.appendChild(editRow1Col3)

            mediaPageContainer.appendChild(editRow1);

        } else {
            mediaPageContainer.appendChild(filterContainer);
            mediaPageContainer.appendChild(thumbnailContainer);
        }

        displayCurrFileList()
    }


        //------------------------------------------------------------------------------------------------------------
    // Create a collapsible menu from a directory structure
    //------------------------------------------------------------------------------------------------------------
    function buildFilterElements(mediaType) {
        empty(filterContainer)

        // Row 1
        let filterRow1 = document.createElement("div")
        filterRow1.classList.add('row','mt-2')
        let filterRow1Col1 = document.createElement("div")
        filterRow1Col1.classList.add('col-3')

        let menuButton = document.createElement("button")
        menuButton.classList.add('btn','btn-primary','btn-sm','float-start')
        menuButton.setAttribute('type',"button")
        menuButton.setAttribute('role',"button")
        menuButton.setAttribute('data-bs-toggle', "offcanvas")
        menuButton.setAttribute('data-bs-target', "#MediaMenuCanvas")
        //menuButton.textContent = "Menu"
        let icon1 = document.createElement("i")
        icon1.classList.add('fa','fa-chevron-right')
        icon1.textContent = "Menu"
        menuButton.appendChild(icon1)
        filterRow1Col1.appendChild(menuButton)
        filterRow1.appendChild(filterRow1Col1)

        let filterRow1Col2 = document.createElement("div")
        filterRow1Col2.classList.add('col')
        // Category
        mediaFilterCategory = document.createElement("select")
        mediaFilterCategory.classList.add('form-select','float-start','shadow-none')
        let tempSelected = false
        for (let index in categoryList) {
            tempSelected = false
            if (queryCategory != null && queryCategory != "" && queryCategory != "DEFAULT") {
                if (categoryList[index] == queryCategory) {
                    tempSelected = true
                }
            } else {
                if (mediaType == 1) {
                    if (index == 1) {
                        tempSelected = true
                    }
                } else {
                    if (index == 0) {
                        tempSelected = true
                    }
                }
            }

            if (tempSelected) {
                mediaFilterCategory.options[mediaFilterCategory.options.length] = new Option(categoryList[index], categoryList[index], true, true)
            } else {
                mediaFilterCategory.options[mediaFilterCategory.options.length] = new Option(categoryList[index], categoryList[index])
            }
        }
        filterRow1Col2.appendChild(mediaFilterCategory);
        mediaFilterCategory.addEventListener("change", function () {
            executeFilter()
        });
        filterRow1.appendChild(filterRow1Col2)

        let filterRow1Col3 = document.createElement("div")
        filterRow1Col3.classList.add('col-1')
        filterRow1.appendChild(filterRow1Col3)

        // Row 2
        let filterRow2 = document.createElement("div")
        filterRow2.classList.add('row','mt-2')
        let filterRow2Col1 = document.createElement("div")
        filterRow2Col1.classList.add('col-3','d-none','d-sm-block')
        let header2 = document.createElement("h5")
        header2.textContent = mediaTypeDesc
        filterRow2Col1.appendChild(header2)
        filterRow2.appendChild(filterRow2Col1)

        let filterRow2Col2 = document.createElement("div")
        filterRow2Col2.classList.add('col')
        let tRow = document.createElement("div")
        tRow.classList.add('row')
        let tCol1 = document.createElement("div")
        tCol1.classList.add('col-5')
        mediaFilterStartDate = document.createElement("input")
        mediaFilterStartDate.classList.add('form-control','shadow-none')
        mediaFilterStartDate.setAttribute('type',"date")
        mediaFilterStartDate.value = mediaInfo.startDate
        tCol1.appendChild(mediaFilterStartDate);
        tRow.appendChild(tCol1)
        mediaFilterStartDate.addEventListener("change", function () {
            executeFilter()
        });

        let tCol2 = document.createElement("div")
        tCol2.classList.add('col-7')
        mediaFilterSearchStr = document.createElement("input")
        //mediaFilterSearchStr.id = "MediaFilterSearchStr"
        mediaFilterSearchStr.classList.add('form-control','shadow-none')
        mediaFilterSearchStr.setAttribute('type',"text")
        mediaFilterSearchStr.setAttribute('placeholder',"Search string")
        mediaFilterSearchStr.value = querySearchStr
        tCol2.appendChild(mediaFilterSearchStr);
        tRow.appendChild(tCol2)
        filterRow2Col2.appendChild(tRow)
        filterRow2.appendChild(filterRow2Col2)
        mediaFilterSearchStr.addEventListener("keypress", function(event) {
            // If the user presses the "Enter" key on the keyboard
            if (event.key === "Enter") {
                // Cancel the default action, if needed
                event.preventDefault();
                executeFilter()
            }
        });
    
        let filterRow2Col3 = document.createElement("div")
        filterRow2Col3.classList.add('col-2','d-none','d-sm-block')
        let header3 = document.createElement("h6")
        header3.classList.add('float-end')
        //header3.textContent = "(Edit Mode)"
        header3.textContent = ""   // >>>>>>>>>>>>>>>>>>>>>>> use if you need to display something <<<<<<<<<<<<<<<<<<<<<
        filterRow2Col3.appendChild(header3)
        filterRow2.appendChild(filterRow2Col3)

        // Add Rows to Filter Container
        filterContainer.appendChild(filterRow1);
        filterContainer.appendChild(filterRow2);
    }

    function checkSelected(fileInfo) {
        return !fileInfo.Selected
    }

    //===========================================================================================================
    // Display the current list image thumbnails in the thumbnail container (with appropriate class links)
    //===========================================================================================================
    function displayCurrFileList() {
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

        empty(thumbnailContainer);

        let thumbnailRow1 = document.createElement("div")
        let thumbnailRow2 = document.createElement("div")
        let thumbnailRow3 = document.createElement("div")
        thumbnailRow1.classList.add('row')
        thumbnailRow2.classList.add('row')
        thumbnailRow2.classList.add('row')

        let thumbnailRow1Col1 = document.createElement("div")
        let thumbnailRow2Col1 = document.createElement("div")
        let thumbnailRow3Col1 = document.createElement("div")
        thumbnailRow1Col1.classList.add('col')
        thumbnailRow2Col1.classList.add('col','my-2')
        thumbnailRow3Col1.classList.add('col')

        //----------------------------------------------------------------------------------------------------
        // If there is a filter request list, create Filter Request buttons with the start date
        //----------------------------------------------------------------------------------------------------
        //if (mediaType == 1 && mediaInfo.filterList != null) {
        if (mediaInfo.filterList != null) {
                for (let index in mediaInfo.filterList) {
                let FilterRec = mediaInfo.filterList[index]

                let button = document.createElement("button")
                button.setAttribute('type',"button")
                button.setAttribute('role',"button")
                button.setAttribute('data-MediaType', mediaType)
                button.setAttribute('data-category', mediaFilterCategory.value)
                button.setAttribute('data-startDate', FilterRec.startDate)
                button.setAttribute('data-menuItem', queryMenuItem)
                button.setAttribute('data-searchStr', querySearchStr)
                button.classList.add('btn','btn-primary','btn-sm','shadow-none','me-2','my-2',MediaFilterRequestClass)
                button.textContent = FilterRec.filterName
                thumbnailRow1Col1.appendChild(button)

                let button2 = document.createElement("button")
                button2.setAttribute('type',"button")
                button2.setAttribute('role',"button")
                button2.setAttribute('data-MediaType', mediaType)
                button2.setAttribute('data-category', mediaFilterCategory.value)
                button2.setAttribute('data-startDate', FilterRec.startDate)
                button2.setAttribute('data-menuItem', queryMenuItem)
                button2.setAttribute('data-searchStr', querySearchStr)
                button2.classList.add('btn','btn-primary','btn-sm','shadow-none','me-2','my-2',MediaFilterRequestClass)
                button2.textContent = FilterRec.filterName
                thumbnailRow3Col1.appendChild(button2)
            }
        }

        //-------------------------------------------------------------------------------------------------------------------------
        // Loop through all the files in the current file list
        //-------------------------------------------------------------------------------------------------------------------------
        for (let index in mediaInfo.fileList) {
        let fi = mediaInfo.fileList[index]

            if (mediaType == 2) {
                // VIDEOS

                // Add a table with a title above the iframe
                let table = document.createElement("table");
                table.classList.add('float-start')
                let td = document.createElement("td");
                td.textContent = fi.DirSubPath
                let tr = document.createElement("tr");
                tr.appendChild(td)
                table.appendChild(tr)

                let iframe = document.createElement("iframe")
                // Use the embed link for iframe (without https so it can be run locally for testing)
                iframe.setAttribute('src', "//www.youtube.com/embed/" + fi.Name);
                iframe.setAttribute('allowfullscreen', true);
                td = document.createElement("td");
                td.appendChild(iframe);
                tr = document.createElement("tr");
                tr.appendChild(td)
                table.appendChild(tr)
                thumbnailRow2Col1.appendChild(table)

            } else {
                if (fi.DirSubPath != '') {
                    filePath = MediaRootDir + mediaTypeDesc + '/' + fi.DirSubPath + '/' + fi.Name;
                    fileSubPath = '/' + fi.DirSubPath + '/' + fi.Name;
                }
                else 
                {
                    filePath = MediaRootDir + mediaTypeDesc + '/' + fi.Name;
                    fileSubPath = '/' + fi.Name;
                }
                //console.log("filePath = " + filePath + ", fileSubPath = " + fileSubPath);

                periodPos = fi.Name.indexOf(".");
                if (periodPos >= 0) {
                    fileExt = fi.Name.substr(periodPos + 1).toUpperCase();
                    fileNameNoExt = fi.Name.substr(0,periodPos);
                }

                if (mediaType == 1) {
                    // PHOTOS

                    if (editMode) {
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
                        thumbnailRow2Col1.appendChild(card)
                    } else {
                        // Add the photo to the gallery link list
                        let img = document.createElement("img");
                        img.setAttribute('onerror', "this.onerror=null; this.remove()")
                        img.setAttribute('src', MediaRootDir + photosThumbsRoot + fileSubPath)
                        img.classList.add(imgThumbnailClass)
                        let a = document.createElement("a")
                        a.href = filePath
                        a.title = fi.Name
                        a.appendChild(img);
                        thumbnailRow2Col1.appendChild(a)
                    }

                } else if (mediaType == 3) {
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
                } else if (mediaType == 4) {
                    // DOCS
                    
                    //console.log("PDF file = " + fi.Name + ", filePath = " + filePath);
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
                empty(thumbnailRow2Col1);

                let table = document.createElement("table");
                table.classList.add('table','table-sm')
                table.appendChild(doclistTbody)
                thumbnailRow2Col1.appendChild(table)
        }
        else if (audioFiles) {
                empty(thumbnailRow2Col1);

                // if there were any MP3's, build a player with the playlist of MP3's
                let h5 = document.createElement("h5");
                h5.id = 'SongTitle'
                h5.classList.add('font-weight-bold')
                thumbnailRow2Col1.appendChild(h5)

                // Append the audioPlayer element
                thumbnailRow2Col1.appendChild(audioPlayer);

                let i = document.createElement("i");
                i.classList.add('fa',`${audioPrevClass}`,'fa-3x')
                let a = document.createElement("a")
                a.id = "AudioPrev"
                a.href = "#"
                a.appendChild(i)
                thumbnailRow2Col1.appendChild(a)

                i = document.createElement("i");
                i.classList.add('fa',`${audioNextClass}`,'fa-3x','mx-2')
                a = document.createElement("a")
                a.id = "AudioNext"
                a.href = "#"
                a.appendChild(i)
                thumbnailRow2Col1.appendChild(a)

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

                thumbnailRow2Col1.appendChild(row)

                // Load and start playing the 1st song in the list
                //loadSong(0);
        } 

        thumbnailRow1.appendChild(thumbnailRow1Col1)
        thumbnailRow2.appendChild(thumbnailRow2Col1)
        thumbnailRow3.appendChild(thumbnailRow3Col1)
        thumbnailContainer.appendChild(thumbnailRow1)
        thumbnailContainer.appendChild(thumbnailRow2)
        thumbnailContainer.appendChild(thumbnailRow3)
    }

    //-------------------------------------------------------------------------------------------------------
    // Display individual image for Edit mode
    //-------------------------------------------------------------------------------------------------------
    function displayFileDetail(index) {
        //console.log("index = "+index)
        currIndex = index
        
        // Get the correct image from the file list, and set the values of the screen components
        let fi = mediaInfo.fileList[index]

        mediaDetailFilename.textContent = fi.Name;
        mediaDetailTitle.value = fi.Title
        mediaDetailTaken.value = fi.TakenDateTime

        let filePath = ''
        let fileSubPath = ''
        if (fi.DirSubPath != '') {
            filePath = MediaRootDir + mediaTypeDesc + '/' + fi.DirSubPath + '/' + fi.Name;
            fileSubPath = '/' + fi.DirSubPath + '/' + fi.Name;
        }
        else 
        {
            filePath = MediaRootDir + mediaTypeDesc + '/' + fi.Name;
            fileSubPath = '/' + fi.Name;
        }
        //console.log("displayFileDetail, filePath = " + filePath + ", fileSubPath = " + fileSubPath);

        mediaDetailCategoryTags.value = fi.CategoryTags
        mediaDetailMenuTags.value = fi.MenuTags
        mediaDetailAlbumTags.value = fi.AlbumTags
        mediaDetailPeopleList.value = fi.People
        mediaDetailDescription.value = fi.Description

        // Set only the selected file in the thumbnail list
        for (let index2 in mediaInfo.fileList) {
            if (index2 == index) {
                mediaInfo.fileList[index2].Selected = true
            } else {
                mediaInfo.fileList[index2].Selected = false
            }
        }    
        
        // Re-display the file list to show the correct selected image
        displayCurrFileList()

        // Set the img src to get the smaller version of the image and display it on the screen
        mediaDetailImg.setAttribute('src', filePath)
    }

    //------------------------------------------------------------------------------------------------------------
    // Create a collapsible menu in an offcanvas pop-out using menu list data
    //------------------------------------------------------------------------------------------------------------
    function buildMenuElements(mediaType) {
        let MediaOffcanvasMenuId = "MediaOffcanvasMenu"
        let menuContainer = document.getElementById(MediaOffcanvasMenuId)
        let mediaMenuCanvasLabel = document.getElementById("MediaMenuCanvasLabel")
        mediaMenuCanvasLabel.textContent = mediaTypeDesc + " Menu"

        if (menuContainer != null) {
            empty(menuContainer)

            let menuId = MediaOffcanvasMenuId
            let accordionId = menuId + "AccordianContainer";
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
    
                //menuHeader.textContent = mediaTypeDesc
    
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
                    //console.log("create menu,  filename = "+filename);
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
