/*==============================================================================
 * (C) Copyright 2016,2022 John J Kauflin, All rights reserved.
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
 *============================================================================*/
var mgallery = (function(){
    'use strict';  // Force declaration of variables before use (among other things)

    //=================================================================================================================
    // Private variables for the Module
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

    // MediaRootDir is appended to the front of all URI paths (that limits the PHP work to files under Media as well)
    var MediaRootDir = "Media/";
    var jjkgalleryRoot = "vendor/jkauflin/jjkgallery/";

    var MediaPageId = "MediaPage";
    var MediaHeaderId = "MediaHeader";
    var MediaMenuId = "MediaMenu";
    var MediaConfigId = "MediaConfig";
    //var MediaConfigButton = "MediaConfigButton";
    var MediaBreadcrumbsId = "MediaBreadcrumbs";
    var MediaFoldersId = "MediaFolders";
    var MediaThumbnailsId = "MediaThumbnails";
    //var BlueimpGalleryId = "blueimp-gallery";

    var MediaFolderLinkClass = "MediaFolderLink";
    var MediaPageLinkClass = "media-page";
    var imgThumbnailClass = "img-thumbnail";
    var playlistSongClass = "playlistSong";
    var audioPrevClass = "fa-step-backward";
    var audioNextClass = "fa-step-forward";


    //=================================================================================================================
    // Variables cached from the DOM
    //var $document = $(document);
    var menuHeader = document.getElementById(MediaHeaderId);
    var menuContainer = document.getElementById(MediaMenuId);
    //var configContainer = document.getElementById(MediaConfigId);
    var breadcrumbContainer = document.getElementById(MediaBreadcrumbsId);
    var folderContainer = document.getElementById(MediaFoldersId);
    var thumbnailContainer = document.getElementById(MediaThumbnailsId);


    // Get random photos (within /Media/images) when the page loads
    var homePhotoElement = document.getElementById("HomePhoto");
    if (typeof homePhotoElement !== "undefined" && homePhotoElement !== null) {
        let url = jjkgalleryRoot + "getRandomImage.php";
        let urlParamStr = "?rootDir=Home";
        fetch(url+urlParamStr)
        .then(response => response.text())
        .then(photoURL => {
            homePhotoElement.setAttribute("src", photoURL);
        })
    }
    var currentPhotoElement = document.getElementById("CurrentPhoto");
    if (typeof currentPhotoElement !== "undefined" && currentPhotoElement !== null) {
        let url = jjkgalleryRoot + "getRandomImage.php";
        let urlParamStr = "?rootDir=Current";
        fetch(url+urlParamStr)
        .then(response => response.text())
        .then(photoURL => {
            currentPhotoElement.setAttribute("src", photoURL);
        })
    }

    //=================================================================================================================
    // Bind events

    // Respond to click on a media link tab by dynamically building the thumbnail display
    document.querySelectorAll("."+MediaPageLinkClass).forEach(el => el.addEventListener("click", function (event) {
        let dirName = event.target.getAttribute('data-dir')
        if (typeof dirName !== "undefined" && dirName !== null) {
            var firstSlashPos = dirName.indexOf("/");
            var rootDir = dirName;
            if (firstSlashPos >= 0) {
                rootDir = dirName.substring(0, firstSlashPos);
            }
            displayThumbnails(dirName);
            createMenu(rootDir);

            // Display the correct media tab and make it active
            let targetTabElement = document.querySelector(`.navbar-nav a[data-dir="${rootDir}"]`);
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
    }));

    // If there is a data-dir parameter, build and display the page
    var dataDirName = 'data-dir';
    // Look for parameters on the url
    var results = new RegExp('[\?&]' + dataDirName + '=([^&#]*)').exec(window.location.href);
    if (results != null) {
        var dirName = results[1] || 0;
        //console.log(">>>>> mediaURI dirName = " + dirName);
        dirName = decodeURIComponent(dirName);
        var firstSlashPos = dirName.indexOf("/");
        var rootDir = dirName;
        if (firstSlashPos >= 0) {
            rootDir = dirName.substring(0, firstSlashPos);
        }
        displayThumbnails(dirName);
        createMenu(rootDir);

        let targetTabElement = document.querySelector(`.navbar-nav a[data-dir="${rootDir}"]`);
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

    //-------------------------------------------------------------------------------------------------------
    // Listen for clicks in the document body
    //-------------------------------------------------------------------------------------------------------
    // *** Have to listen to Body instead of individual containers (because there are more than 1)
    //folderContainer.addEventListener("click", function (event) {
    //breadcrumbContainer
    document.body.addEventListener("click", function (event) {
        // Check for specific classes
        if (event.target && event.target.classList.contains(MediaFolderLinkClass)) {
            // If click on a media folder, create the thumbnails display for that folder
            displayThumbnails(event.target.getAttribute('data-dir'));
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

    // Create a collapsible menu from a directory structure
    function createMenu(dirName) {
        //console.log("createMenu, dir=" + dirName)
        empty(menuContainer)

        // Assuming the media folder are under a parent media folder (look for 1st slash to get sub-path)
        var firstSlashPos = dirName.indexOf("/")
        var rootDir = dirName
        if (firstSlashPos >= 0) {
            rootDir = dirName.substr(0, firstSlashPos)
        }

        menuHeader.textContent = rootDir

        let url = jjkgalleryRoot + "getDirList.php"
        let urlParamStr = `?dir=${rootDir}`
        fetch(url+urlParamStr)
        .then(response => response.json())
        .then(dirList => {
            var accordionId = "accordianContainer";
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

            for (let index in dirList) {
                let dir = dirList[index]
                //console.log(">>> dir = "+dir.filename);
                // Skip any non-directory files at this level
                if (dir.filename.indexOf(".") >= 0) {
                    continue;
                }
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
                itemId = "dir" + (index + 1)
                accordianItemHeader = document.createElement("h6")
                accordianItemHeader.classList.add('accordion-header')

                let button = document.createElement("button");
                button.classList.add('m-1','p-1','accordion-button')
                if (collapseState) {
                    button.classList.add('collapsed')
                }
                button.setAttribute('type',"button")
                button.setAttribute('role',"button")
                button.setAttribute('data-bs-toggle','collapse')
                button.setAttribute('data-bs-target','#' + itemId)
                button.textContent = dir.filename
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
                for (let index2 in dir.contents) {
                    let filename = dir.contents[index2]
                    //console.log("create menu, dir.contents filename = "+filename);
                    if (filename.indexOf(".") < 0) {
                        // Create a link for the media dir folder
                        let a = document.createElement("a")
                        a.setAttribute('href', "#")
                        a.setAttribute('data-dir', rootDir + '/' + dir.filename + '/' + filename)
                        a.classList.add(MediaFolderLinkClass)
                        a.textContent = filename
                        let li = document.createElement('li')
                        li.appendChild(a)
                        accordianItemList.appendChild(li)
                    }
                }

                // If there are only files in the root folder and no other folders add a link to the root folder
                if (accordianItemList.childElementCount == 0) {
                    let a = document.createElement("a")
                    a.setAttribute('href', "#")
                    a.setAttribute('data-dir', rootDir + '/' + dir.filename)
                    a.classList.add(MediaFolderLinkClass)
                    a.textContent = dir.filename
                    let li = document.createElement("li")
                    li.appendChild(a)
                    accordianItemList.appendChild(li);
                }

                // Append the item list to the panel item, and the panel item to the menu
                accordianItemBody.appendChild(accordianItemList);
                accordianItem.appendChild(accordianItemHeader);
                accordianItem.appendChild(accordianItemBody);
                accordianContainer.appendChild(accordianItem);
            }    

            // Put the created accordian into the Menu DIV on the parent page
            menuContainer.appendChild(accordianContainer);
        });

    } // function createMenu(dirName) {


    // Create side menu, breadcrumbs, folder and entity links (for photos, audio, video, etc.)
    function displayThumbnails(dirName) {
        //console.log("$$$$$ displayThumbnails, dirName = " + dirName);
        setBreadcrumbs(dirName);
        
        empty(folderContainer);
        empty(thumbnailContainer);
        //empty(configContainer);

        // Assuming the media folder are under a parent media folder (look for 1st slash to get sub-path)
        var firstSlashPos = dirName.indexOf("/");
        var rootDir = dirName;
        if (firstSlashPos >= 0) {
            rootDir = dirName.substr(0, firstSlashPos);
        }
        //console.log("in displayThumbnails, rootDir = " + rootDir);

        // Assume the subpath starts at the 1st slash
        var subPath = "";
        if (firstSlashPos >= 0) {
            subPath = dirName.substr(firstSlashPos)
        }
        //console.log("in displayThumbnails, subPath =" + subPath);

        var photosThumbsRoot = rootDir + "Thumbs";
        var photosSmallerRoot = rootDir + "Smaller";
        var photosThumbDir = photosThumbsRoot + subPath;
        var photosSmallerDir = photosSmallerRoot + subPath;

        var MediaConfigId = "MediaConfig";

        // Add a Config button
        /*
        $('<a>').attr('id', MediaConfigButton)
            .attr('data-dir', dirName)
            .attr('href', "#")
            .append($('<i>').prop('class', "fa fa-2x fa-gear"))
            .appendTo(configContainer);
        */

        // Get a list of files in the data directory
        let url = jjkgalleryRoot + "getDirList.php"
        let urlParamStr = `?dir=${dirName}`
        //$.getJSON(jjkgalleryRoot +"getDirList.php", "dir=" + dirName, function (dirList) {
        fetch(url+urlParamStr)
        .then(response => response.json())
        .then(dirList => {
            // loop through the list and display thumbnails in a div
            let periodPos = 0;
            let fileExt = '';
            let filePath = '';
            let fileNameNoExt = '';

            let docFiles = false;
            let audioFiles = false;
            playlist.length = 0;
            plIndex = -1;
            let doclistTbody = document.createElement("tbody");
            var playlistTbody = document.createElement("tbody");

            //$.each(dirList, function (index, dir) {
            for (let index in dirList) {
                let dir = dirList[index]
    
                filePath = MediaRootDir + dirName + '/' + dir.filename;
                //console.log("file = " + dir.filename + ", filePath = " + filePath);

                // Check if it is an image file or a directory (if period found assume file, if not directory)
                periodPos = dir.filename.indexOf(".");
                if (periodPos >= 0) {
                    fileExt = dir.filename.substr(periodPos + 1).toUpperCase();
                    fileNameNoExt = dir.filename.substr(0,periodPos);

                    // Process if the file is an image
                    if (fileExt == "JPG" || fileExt == "JPEG" || fileExt == "GIF") {
                        // If not a directory, add the photo to the gallery link list
                        filePath = MediaRootDir + photosSmallerDir + '/' + dir.filename;
                        let img = document.createElement("img");
                        img.setAttribute('onerror', "this.onerror=null; this.remove()")
                        img.setAttribute('src', MediaRootDir + photosThumbDir + '/' + dir.filename)
                        img.classList.add(imgThumbnailClass)
                        let a = document.createElement("a")
                        a.href = filePath
                        a.title = dir.filename
                        a.appendChild(img);
                        thumbnailContainer.appendChild(a)
                        /*
                            *** new functions?:
                                right-click copy link address
                                download full (large) version
                                see tags and description
                                edit tags and description
                        */

                    } else if (fileExt == "PDF") {
                        //console.log("PDF file = " + dir.filename + ", filePath = " + filePath);
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
                    } else if (dir.filename == "youtube.txt") {
                        // Get the list of youtube ids
                        let cPos = 0;
                        let url = jjkgalleryRoot + "getVideoList.php"
                        let urlParamStr = `?file=${filePath}`
                        fetch(url+urlParamStr)
                        .then(response => response.json())
                        .then(videoList => {
                            let videoId = '';
                            let videoName = '';
                            //$.each(videoList, function (index, videoStr) {
                            for (let index in videoList) {
                                let videoStr = videoList[index]
                                videoId = '';
                                videoName = '';
                                // Check if there title label to display
                                cPos = videoStr.indexOf(":");
                                if (cPos >= 0) {
                                    videoName = videoStr.substring(0, cPos);
                                    videoId = videoStr.substring(cPos + 2);
                                } else {
                                    videoId = videoStr;
                                }
                                // Check if the url is the standard YouTube share link (if so, strip off the 1st part)
                                cPos = videoId.indexOf("https://youtu.be/");
                                if (cPos >= 0) {
                                    videoId = videoId.substring(0, cPos + 17);
                                }
                                if (videoId != '') {
                                    //console.log("videoName = "+videoName+", videoId = "+videoId);
                                    // Add a table with a title above the iframe
                                    let table = document.createElement("table");
                                    table.classList.add('float-start')
                                    let td = document.createElement("td");
                                    td.textContent = videoName
                                    let tr = document.createElement("tr");
                                    tr.appendChild(td)
                                    table.appendChild(tr)

                                    let iframe = document.createElement("iframe")
                                    // Use the embed link for iframe (without https so it can be run locally for testing)
                                    iframe.setAttribute('src', "//www.youtube.com/embed/" + videoId);
                                    iframe.setAttribute('allowfullscreen', true);
                                    td = document.createElement("td");
                                    td.appendChild(iframe);
                                    tr = document.createElement("tr");
                                    tr.appendChild(td)
                                    table.appendChild(tr)
                                    thumbnailContainer.appendChild(table)
                                }
                            }
                        });

                    } else if (fileExt == "MP3") {
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
                    }

                } else {
                    // If a directory, add the name with the folder icon
                    if (dir.filename.indexOf("images") >= 0 || dir.filename.indexOf("Smaller") >= 0 ||
                        dir.filename.indexOf("Thumbs") >= 0) {
                            // Ignore folders with images, Smaller, or Thumbs in the name
                    } else {
                        //console.log("Folder container, dir.filename = " + dir.filename);
                        let button = document.createElement("button")

                        button.setAttribute('type',"button")
                        button.setAttribute('role',"button")
                        button.setAttribute('data-dir', dirName + '/' + dir.filename)
                        button.classList.add('btn','p-1','m-1',MediaFolderLinkClass)
                        button.style.border = '1px solid'
                        button.style.backgroundColor = '#d9d9d9'
                        button.style.color = 'black'
                        button.textContent = dir.filename
                        //button.appendTo(folderContainer)
                        folderContainer.appendChild(button)
                    }
                }

            } // End of Loop through dir list files
            
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

                let col2 = document.createElement("div");
                col2.classList.add('col-sm-5')
                let img = document.createElement("img");
                img.setAttribute('onerror', "this.onerror=null; this.remove()")
                img.setAttribute('src', MediaRootDir + rootDir + subPath + '/' + 'album.jpg')
                img.classList.add(`${imgThumbnailClass}`,'m-1','p-2')
                col2.appendChild(img)
                row.appendChild(col2)

                thumbnailContainer.appendChild(row)

                // Load and start playing the 1st song in the list
                loadSong(0);
            } 

        }); // End of Fetch dir list - fetch(url+urlParamStr)

    } // function displayThumbnails(dirName) {


    function setBreadcrumbs(dirName) {
        empty(breadcrumbContainer)
        var dirArray = dirName.split("/")
        //console.log('setBreadcrumbs dirName = '+dirName)
        let urlStr = ''

        let dirName2 = ''
        for (let index in dirArray) {
            dirName2 = dirArray[index]
            // Set the last element as active
            if (index == dirArray.length - 1) {
                let li = document.createElement("li")
                li.classList.add('breadcrumb-item')
                li.classList.add('active')
                li.textContent = dirName2
                breadcrumbContainer.appendChild(li)
            } else {
                if (index == 0) {
                    urlStr += dirName2
                } else {
                    urlStr += '/' + dirName2
                }
                //console.log("in setBreadcrumbs, urlStr = "+urlStr)
                let li = document.createElement("li")
                li.classList.add('breadcrumb-item')
                let a = document.createElement("a")
                a.href = '#'
                a.textContent = dirName2
                a.classList.add(MediaFolderLinkClass)
                a.setAttribute('data-dir', urlStr)
                li.appendChild(a)
                breadcrumbContainer.appendChild(li)
            }
        }
    } // function setBreadcrumbs(dirName) {


    // Audio 
    function loadSong(index) {
        plIndex = index;
        $("#SongTitle").text(playlist[plIndex].title);
        $("#AudioPlayer").attr("src", playlist[plIndex].url);
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
