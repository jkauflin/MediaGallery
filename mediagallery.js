/*==============================================================================
 * (C) Copyright 2016,2018,2020 John J Kauflin, All rights reserved.
 *----------------------------------------------------------------------------
 * DESCRIPTION:  A general media gallery that can organize and display photos,
 *              auido (MP3s), video (YouTube links), and docs (PDF)
 * Photo Gallery implementing blueimp - https://github.com/blueimp/Gallery
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
    audioPlayer.style.border = '0';
    audioPlayer.style.outline = '0'
    audioPlayer.style.padding = '0';

    // MediaRootDir is appended to the front of all URI paths (that limits the PHP work to files under Media as well)
    var MediaRootDir = "Media/";
    var jjkgalleryRoot = "vendor/jkauflin/jjkgallery/";

    var MediaPageId = "MediaPage";
    var MediaHeaderId = "MediaHeader";
    var MediaMenuId = "MediaMenu";
    var MediaConfigId = "MediaConfig";
    var MediaConfigButton = "MediaConfigButton";
    var MediaBreadcrumbsId = "MediaBreadcrumbs";
    var MediaFoldersId = "MediaFolders";
    var MediaThumbnailsId = "MediaThumbnails";
    var BlueimpGalleryId = "blueimp-gallery";
    var MediaFolderLinkClass = "MediaFolderLink";

    //=================================================================================================================
    // Variables cached from the DOM
    var $document = $(document);
    var $menuHeader = $document.find("#"+MediaHeaderId);
    var $menuContainer = $document.find("#"+MediaMenuId);
    var $configContainer = $document.find("#" + MediaConfigId);
    var $breadcrumbContainer = $document.find("#" + MediaBreadcrumbsId);
    var $folderContainer = $document.find("#"+MediaFoldersId);
    var $thumbnailContainer = $document.find("#"+MediaThumbnailsId);
    var $blueimpGallery = $document.find("#"+BlueimpGalleryId);

    // Get random photos (within /Media/images) when the page loads
    $.get(jjkgalleryRoot + "getRandomImage.php", "rootDir=Home", function (photoURL) {
        $("#HomePhoto").attr("src", photoURL);
    });
    $.get(jjkgalleryRoot + "getRandomImage.php", "rootDir=Current", function (photoURL) {
        $("#CurrentPhoto").attr("src", photoURL);
    });

    //=================================================================================================================
    // Bind events
    // Respond to click on a media folder by dynamically building the thumbnail display
    $document.on("click", "."+MediaFolderLinkClass, function () {
        var $this = $(this);
        console.log("Click on MediaFolderLink, data-dir = " + $this.attr('data-dir'));
        displayThumbnails($this.attr('data-dir'));
    });	

    // Respond to click on a bootstrap navigation tab
    $document.on('shown.bs.tab', 'a[data-toggle="tab"]', function () {
        var $this = $(this);
        var dirName = $this.attr('data-dir');
        //console.log("Click on tab, dirName = "+dirName);
        // When the user clicks on a menu tab, build and display the thumbnails
        // if not coming from a mediaURL and has a defined media dirName
        if (!mediaURI && dirName != undefined) {
            displayThumbnails(dirName);
        }
        // Reset after responding to the media URI show
        mediaURI = false;
    });	

    // If there is a data-dir parameter, build and display the page
    var mediaURI = false;
    var dataDirName = 'media-dir';
    // Look for parameters on the url
    var results = new RegExp('[\?&]' + dataDirName + '=([^&#]*)').exec(window.location.href);
    if (results != null) {
        mediaURI = true;
        var dirName = results[1] || 0;
        //console.log("mediaURI dirName = " + dirName);
        dirName = decodeURIComponent(dirName);
        var firstSlashPos = dirName.indexOf("/");
        var rootDir = dirName;
        if (firstSlashPos >= 0) {
            rootDir = dirName.substr(0, firstSlashPos);
        }
        displayThumbnails(dirName);
        // Display the correct media tab and make it active
        $(".nav-link.active").removeClass("active");
        $('.navbar-nav a[data-dir="'+rootDir+'"]').tab('show')
        $('.navbar-nav a[data-dir="'+rootDir+'"]').addClass('active');
    }

    // Add event listeners to the audio player
    // When a song ends, see if there is a next one to play
    audioPlayer.addEventListener("ended", function () {
        nextSong();
    }, true);
    // Respond to clicking on songs in the playlist
    $document.on("click", ".playlistSong", function () {
        var $this = $(this);
        loadSong($this.attr('data-plIndex'));
    });
    $document.on("click", "#AudioNext", function () {
        nextSong();
    });
    $document.on("click", "#AudioPrev", function () {
        prevSong();
    });

    document.getElementById('MediaThumbnails').onclick = function (event) {
        event = event || window.event;
        var target = event.target || event.srcElement,
            link = target.src ? target.parentNode : target,
            options = { index: link, event: event },
            links = this.getElementsByTagName('a');

        if (target.className.indexOf("img-thumbnail") >= 0) {
            blueimp.Gallery(links, options);
        }
    };

    // Respond to Config button clicks
    $document.on("click", "#" + MediaConfigButton, function () {
        var $this = $(this);
        //console.log("Click on MediaConfig, data-dir = " + $this.attr('data-dir'));
        // Create thumbnails and smaller photos for images in a directory
        $.get(jjkgalleryRoot + "createThumbnails.php", "subPath=" + $this.attr('data-dir'), function (result) {
            console.log("createThumbnails, result = " + result);
        });
    });	

    //=====================================================================================
    // Default the blueimp gallery controls to borderless fullscreen with no controls
    //=====================================================================================
    $blueimpGallery.data('useBootstrapModal', false);
    $blueimpGallery.toggleClass('blueimp-gallery-controls', false);
    $blueimpGallery.data('fullScreen', true);

    // Respond to changes in photo gallery configuration
    $('#borderless-checkbox').on('change', function () {
        var borderless = $(this).is(':checked')
        $blueimpGallery.data('useBootstrapModal', !borderless)
        $blueimpGallery.toggleClass('blueimp-gallery-controls', borderless)
    })
    /*
    $('#fullscreen-checkbox').on('change', function () {
        $('#blueimp-gallery').data('fullScreen', $(this).is(':checked'))
    })
    */

    //=================================================================================================================
    // Module methods

    // Create side menu, breadcrumbs, folder and entity links (for photos, audio, video, etc.)
    function displayThumbnails(dirName) {
        //console.log("in displayThumbnails, dirName = " + dirName);
        setBreadcrumbs(dirName);
        createMenu(dirName);
        
        $folderContainer.empty();
        $thumbnailContainer.empty();
        $configContainer.empty();

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
        $('<a>').attr('id', MediaConfigButton)
            .attr('data-dir', dirName)
            .attr('href', "#")
            .append($('<i>').prop('class', "fa fa-2x fa-gear"))
            .appendTo($configContainer);

        // Get a list of files in the data directory
        $.getJSON(jjkgalleryRoot +"getDirList.php", "dir=" + dirName, function (dirList) {
            // loop through the list and display thumbnails in a div
            var periodPos = 0;
            var fileExt = '';
            var filePath = '';
            var fileNameNoExt = '';

            var docFiles = false;
            var audioFiles = false;
            playlist.length = 0;
            plIndex = -1;
            var $doclistTbody = $('<tbody>');
            var $playlistTbody = $('<tbody>');
            var tr;

            //$.each(dirFileList, function (filename, subDirList) {
            $.each(dirList, function (index, dir) {
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
                        $('<a/>')
                            .append($('<img>').prop('src', MediaRootDir + photosThumbDir + '/' + dir.filename).prop('class', "img-thumbnail"))
                            .prop('href', filePath)
                            .prop('title', dir.filename)
                            .appendTo($thumbnailContainer);

                    } else if (fileExt == "PDF") {
                        //console.log("PDF file = " + dir.filename + ", filePath = " + filePath);
                        docFiles = true;
                        tr = $('<tr>').attr('class', "smalltext");
                        tr.append($('<td>').append($('<a>')
                            .prop('href', filePath)
                            .attr('target', "_blank")
                            .html(fileNameNoExt)));
                        tr.appendTo($doclistTbody);

                    } else if (dir.filename == "youtube.txt") {
                        // Get the list of youtube ids
                        var cPos = 0;
                        $.getJSON(jjkgalleryRoot +"getVideoList.php", "file=" + filePath, function (videoList) {
                            var videoId = '';
                            var videoName = '';
                            $.each(videoList, function (index, videoStr) {
                                videoId = '';
                                videoName = '';

                                cPos = videoStr.indexOf(":");
                                if (cPos >= 0) {
                                    videoName = videoStr.substr(0, cPos);
                                    videoId = videoStr.substr(cPos + 2);
                                } else {
                                    videoId = videoStr;
                                }

                                if (videoId != '') {
                                    //console.log("videoName = "+videoName+", videoId = "+videoId);
                                    // Add a table with a title above the iframe
                                    $('<table>').prop('class','float-left')
                                        .append("<tr><td>" + videoName + "</td></tr>")
                                        .append($('<tr>').append($('<td>')
                                            .append($('<iframe>')
                                                .prop('src', "//www.youtube.com/embed/" + videoId)
                                                .attr('allowfullscreen', true)))
                                        ).appendTo($thumbnailContainer);
                                }
                            });

                        });

                    } else if (fileExt == "MP3") {
                        //console.log("fileNameNoExt = " + fileNameNoExt+", url = "+filePath);
                        audioFiles = true;
                        plIndex++;
                        playlist.push({ "title": fileNameNoExt, "url": filePath });

                        // add the table rows for the playlist
                        // build a table then append to the thumbnail container
                        tr = $('<tr>').attr('class', "smalltext");
                        tr.append($('<td>').append($('<a>')
                            .attr('href', "#")
                            .attr('class', "playlistSong")
                            .attr('data-plIndex', plIndex)
                            .html(fileNameNoExt)));

                        tr.appendTo($playlistTbody);
                    }

                } else {
                    // If a directory, add the name with the folder icon
                    if (dir.filename.indexOf("images") >= 0 || dir.filename.indexOf("Smaller") >= 0 ||
                        dir.filename.indexOf("Thumbs") >= 0) {
                            // Ignore folders with images, Smaller, or Thumbs in the name
                    } else {
                        //console.log("Folder container, dir.filename = " + dir.filename);
                        $('<a>').attr('data-dir', dirName + '/' + dir.filename)
                            .attr('href', "?media-dir=" + dirName + '/' + dir.filename)
                            .prop('class', 'btn p-1 mr-2 mb-2 ' + MediaFolderLinkClass)
                            .attr('style', 'border:1px solid; background-color: #d9d9d9; color: black;')
                            .html(dir.filename)
                          //.append($('<i>').prop('class', "fa fa-folder-open").html(' ' + dir.filename))
                            .appendTo($folderContainer);
                    }
                }
            });
            
            // if there were any docs, build a table of the filelinks and append to the Thumbnails container
            if (docFiles) {
                $thumbnailContainer.empty();

                // append the tbody to the table, adn the table to the thumbnail container
                var $doclistTable = $('<table>')
                    .prop('class', 'table table-sm');
                $doclistTbody.appendTo($doclistTable);
                $doclistTable.appendTo($thumbnailContainer);
            }
            else if (audioFiles) {
                $thumbnailContainer.empty();

                // if there were any MP3's, build a player with the playlist of MP3's
                $('<h5>').attr('id', 'SongTitle').prop('class', 'font-weight-bold')
                .appendTo($thumbnailContainer);
                document.getElementById("MediaThumbnails").appendChild(audioPlayer);

                $('<table>')
                    .attr('id', 'AudioControlsContainer')
                    .prop('class', 'table table-sm')
                    .append(
                        $('<tr>').append(
                            $('<td>').append(
                                $('<a>').attr('id', "AudioPrev")
                                    .attr('href', "#")
                                    .append(
                                        $('<i>').prop('class', 'fa fa-step-backward fa-2x m-1')
                                    )
                            ).append(
                                $('<a>').attr('id', "AudioNext")
                                    .attr('href', "#")
                                    .append(
                                        $('<i>').prop('class', 'fa fa-step-forward fa-2x m-1')
                                    )
                            )
                        )
                    )
                .appendTo($thumbnailContainer);

                // append the tbody to the table, and the table to the thumbnail container
                var $playlistTable = $('<table>')
                    .attr('id', 'PlaylistDisplay')
                    .prop('class', 'table table-sm');
                $playlistTbody.appendTo($playlistTable);
                $playlistTable.appendTo($thumbnailContainer);
            }

        });

    } // function displayThumbnails(dirName) {

    // Create a collapsible menu from a directory structure
    function createMenu(dirName) {
        console.log("createMenu, dir=" + dirName);
        $menuContainer.empty();

        // Assuming the media folder are under a parent media folder (look for 1st slash to get sub-path)
        var firstSlashPos = dirName.indexOf("/");
        var rootDir = dirName;
        if (firstSlashPos >= 0) {
            rootDir = dirName.substr(0, firstSlashPos);
        }

        $menuHeader.text(rootDir);

        // Get the sub-folder from the dir after the 1st slash, and use to set the open/shown panel item

        //Pass in sort (0 for alpha photos and 1 for years) ???
        //$.getJSON(jjkgalleryRoot+"getDirList.php", "dir=" + dirName, function (dirList) {
        $.getJSON(jjkgalleryRoot+"getDirList.php", "dir=" + rootDir, function (dirList) {
            var itemId = '';
            var panelItemHeader;
            var panelItem;
            var panelItemList;
            var collapseState = '';
            var collapseShow = '';
            $.each(dirList, function (index, dir) {
                // Skip any non-directory files at this level
                if (dir.filename.indexOf(".") >= 0) {
                    return true;
                }
                // Make the 1st panel item un-collapsed
                if (index == 0) {
                    collapseState = '';
                    collapseShow = 'show';
                } else {
                    collapseState = 'collapsed';
                    collapseShow = '';
                }

                // Create the top level panel item
                itemId = "dir" + (index + 1);
                panelItemHeader = $('<h6>').append(
                        $('<a>').prop('class',collapseState).attr('data-toggle', 'collapse')
                        .attr('href', '#'+itemId)
                        .text(dir.filename)
                    );
                panelItem = $('<div>').attr('id', itemId).attr('data-parent', '#'+MediaMenuId).prop('class', 'collapse ' + collapseShow);
                panelItemList = $('<ul>');

                // Add list entries
                $.each(dir.contents, function (index2, filename) {
                    //console.log("create menu, filename = "+filename);
                    if (filename.indexOf(".") >= 0) {
                        // If there are only files in the root folder and no other folders, 
                        // add a link to the root folder (if the first entry is a file)
                        if (index2 == 0) {
                            panelItemList.append(
                                $('<li>').append(
                                    $('<a>').attr('data-dir', rootDir + '/' + dir.filename).attr('href', "#").prop('class',MediaFolderLinkClass)
                                    .text(dir.filename))
                            );
                        }
                        return true;
                    }
                    // Create a link for the media dir folder
                    panelItemList.append($('<li>').append(
                        $('<a>').attr('data-dir', rootDir + '/' + dir.filename + '/' + filename)
                            .attr('href', "?media-dir=" + rootDir + '/' + dir.filename + '/' + filename)
                            .prop('class', MediaFolderLinkClass)
                                .text(filename))
                    );
                });

                // Append the item list to the panel item, and the panel item to the menu
                panelItem.append(panelItemList);
                $menuContainer.append(panelItemHeader);
                $menuContainer.append(panelItem);
            });
        });
    } // function createMenu(dirName) {

    function setBreadcrumbs(dirName) {
        $breadcrumbContainer.empty();
        var dirArray = dirName.split("/");
        //console.log('setBreadcrumbs dirName = '+dirName);
        var urlStr = '';
        $.each(dirArray, function (index, dirName2) {
            if (index == dirArray.length - 1) {
                $('<li>').prop('class', 'breadcrumb-item active').html(dirName2).appendTo($breadcrumbContainer);
            } else {
                if (index == 0) {
                    urlStr += dirName2;
                } else {
                    urlStr += '/' + dirName2;
                }
                //console.log("in setBreadcrumbs, urlStr = "+urlStr);
                $('<li>').prop('class', 'breadcrumb-item')
                    .append($('<a>').prop('href', '#').html(dirName2).prop('class', MediaFolderLinkClass)
                        .attr('data-dir', urlStr))
                .appendTo($breadcrumbContainer);
            }
        });
    } // function setBreadcrumbs(dirName) {


    // Audio ========================================================================================
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

/*
1 = MEDIA_ERR_ABORTED - fetching process aborted by user
2 = MEDIA_ERR_NETWORK - error occurred when downloading
3 = MEDIA_ERR_DECODE - error occurred when decoding
4 = MEDIA_ERR_SRC_NOT_SUPPORTED - audio/video not supported

Found 5 errors/warnings with at least 1 critical issue.
mediaelement-debug.js:1 URL has invalid characters. Remove any special characters and mutated vowels. priority level: 1 urlInValid
mediaelement-debug.js:1 Content of media file is encoded with gzip/defalte. Make sure to not encode it. It's already encoded. priority level: 1 doubleEncoded
mediaelement-debug.js:1 Content-Type header for media file is either empty or application/octet-stream. priority level: 2.5 noContentType
mediaelement-debug.js:1 Content-Length header for media file does not send value. priority level: 3 noContentLength
mediaelement-debug.js:1 Accept-Ranges header for media file does not send value. Make sure server supports Range requests in bytes priority level: 3 noRange

$('audio').addEventListener('error', function failed(e) {
   // audio playback failed - show a message saying why
   // to get the source of the audio element use $(this).src
   switch (e.target.error.code) {
     case e.target.error.MEDIA_ERR_ABORTED:
       alert('You aborted the video playback.');
       break;
     case e.target.error.MEDIA_ERR_NETWORK:
       alert('A network error caused the audio download to fail.');
       break;
     case e.target.error.MEDIA_ERR_DECODE:
       alert('The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.');
       break;
     case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
       alert('The video audio not be loaded, either because the server or network failed or because the format is not supported.');
       break;
     default:
       alert('An unknown error occurred.');
       break;
   }
 }, true);
*/

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
    };
        
})(); // var mgallery = (function(){
