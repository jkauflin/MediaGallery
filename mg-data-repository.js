/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved.
--------------------------------------------------------------------------------
DESCRIPTION:  Main module to handle interactions with database and file system
                as well as keeping mediaInfo and menu data structures
--------------------------------------------------------------------------------
Modification History
2023-08-06 JJK  Initial version - moved MediaInfo components to this module
2023-09-08 JJK  Renamed to DataRepository to show its function
2023-09-30 JJK  Adjusted location parameters for albumKey handling
================================================================================*/

import {createMediaPage,displayCurrFileList,updateAdminMessage} from './mg-create-pages.js';
import {setMenuList} from './mg-menu.js';
import {setAlbumList} from './mg-album.js';
import {updateMessage} from './mg-contextmenu.js';

export let mediaInfo
export let mediaType = 1
export let mediaTypeDesc = "Photos"
export let contentDesc = ""
export var getMenu = false

export var queryCategory = ""
export var querySearchStr = ""
export var queryMenuItem = ""
export var queryAlbumKey = ""

export var categoryList = []
export var menuFilter = []
export var peopleList = []

var jjkgalleryRoot = "vendor/jkauflin/jjkgallery/";

// MediaRootDir is appended to the front of all URI paths (that limits the PHP work to files under Media as well)
let MediaRootDir = window.location.pathname + "Media/"
let FullMediaRootDir = window.location.origin + MediaRootDir


export function setMediaType(inMediaType) {
    mediaType = inMediaType
}

export function getFilePath(index,descMod="",fullPath=false) {
    // descMod could be "Thumbs" or "Smaller"
    let fi = mediaInfo.fileList[index]
    // 8/22/2023 - Shouldn't need this check anymore - all FilePath fields should be set the right way
    // 9/13/2023 - *** Found out I need it until the subPath for audio files are updated ***
    if (fi.DirSubPath != '') {
        // If there is a subPath and it doesn't end in a slash, add it
        if (fi.DirSubPath.substr(fi.DirSubPath.length-1,1) != "/") {
            fi.DirSubPath = fi.DirSubPath + '/'
        }
    }
   if (fullPath) {
      return FullMediaRootDir + mediaTypeDesc + descMod + '/' + fi.DirSubPath + fi.Name;
   } else {
      return MediaRootDir + mediaTypeDesc + descMod + '/' + fi.DirSubPath + fi.Name;
   }
}

export function getFileName(index) {
    let fi = mediaInfo.fileList[index]
    let fileNameNoExt = ''
    let periodPos = fi.Name.indexOf(".");
    if (periodPos >= 0) {
        fileNameNoExt = fi.Name.substr(0,periodPos);
    }

    return fileNameNoExt
}

//------------------------------------------------------------------------------------------------------------
// Query the database for menu and file information and store in js variables
//------------------------------------------------------------------------------------------------------------
export function queryMediaInfo(paramData) {
    //console.log("$$$ in the QueryMediaInfo")
    let url = jjkgalleryRoot + "getMediaInfo.php"
    fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(paramData)
    })
    .then(response => response.json())
    .then(responseMediaInfo => {
        // Save media information in a variable (that can be imported into other modules)

        mediaInfo = responseMediaInfo

        // Set the top level variables from the media type descriptions
        if (mediaInfo.menuList != null) {
            if (mediaInfo.menuList.length > 0) {
                mediaTypeDesc = mediaInfo.menuList[0].mediaTypeDesc
            }
        }
            
        contentDesc = mediaTypeDesc
        if (mediaInfo.currMenu != null && mediaInfo.currMenu != "") {
            contentDesc = mediaTypeDesc + " - " + mediaInfo.currMenu
        } else if (mediaInfo.currAlbum != null && mediaInfo.currAlbum != "") {
            contentDesc = mediaTypeDesc + " - " + mediaInfo.currAlbum
        }

        getMenu = paramData.getMenu
        if (getMenu) {
            // Save the menu lists
            setMenuList(mediaInfo.menuList)
            categoryList = mediaInfo.categoryList
            menuFilter = mediaInfo.menuFilter
            setAlbumList(mediaInfo.albumList)
            peopleList = mediaInfo.peopleList
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
        queryAlbumKey = ""
        if (paramData.MediaFilterAlbumKey != null & paramData.MediaFilterAlbumKey != "") {
            queryAlbumKey = paramData.MediaFilterAlbumKey
        }

        //MediaFilterAlbumKey
        //queryAlbumKey

        createMediaPage()
    });
}

//------------------------------------------------------------------------------------------------------------
// Update the media info in the database table (Batch)
//------------------------------------------------------------------------------------------------------------
export function updateMediaInfo(inIndex) {
    let index = -1
    if (inIndex != null && inIndex >= 0) {
        index = inIndex
    }

    // Assume current values and selected files in the mediaInfo.fileList are what we want updated
    // unless the index is set, which indicates an individual update
    let paramData = {
        MediaFilterMediaType: mediaType,
        mediaInfoFileList: mediaInfo.fileList,
        index: index
    }

    let url = jjkgalleryRoot + "updateMediaInfo.php"
    fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(paramData)
    })
    .then(response => response.text())
    .then(returnMsg => {
        //console.log("returnMsg = "+returnMsg)

        if (index >= 0) {
            updateMessage(returnMsg)
            // If individual index-based update, just de-Select but leave it in the file list
            mediaInfo.fileList[index].Selected = false
        } else {
            // Filter out the Selected files (that were updated)
            updateAdminMessage(returnMsg)
            mediaInfo.fileList = mediaInfo.fileList.filter(checkSelected);
        }

        displayCurrFileList()
    }); // End of Fetch
}

//------------------------------------------------------------------------------------------------------------
// Add new media info records in the database for new videos
//------------------------------------------------------------------------------------------------------------
export function newVideosMediaInfo(paramData) {

    /*
    let index = -1
    if (inIndex != null && inIndex >= 0) {
        index = inIndex
    }

    // Assume current values and selected files in the mediaInfo.fileList are what we want updated
    // unless the index is set, which indicates an individual update
    let paramData = {
        MediaFilterMediaType: mediaType,
        mediaInfoFileList: mediaInfo.fileList,
        index: index
    }
    */

    let url = jjkgalleryRoot + "updateMediaInfo.php"
    fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(paramData)
    })
    .then(response => response.text())
    .then(returnMsg => {
        //console.log("returnMsg = "+returnMsg)

        /*
        if (index >= 0) {
            updateMessage(returnMsg)
            // If individual index-based update, just de-Select but leave it in the file list
            mediaInfo.fileList[index].Selected = false
        } else {
            // Filter out the Selected files (that were updated)
            updateAdminMessage(returnMsg)
            mediaInfo.fileList = mediaInfo.fileList.filter(checkSelected);
        }
        */

        updateAdminMessage(returnMsg)

        displayCurrFileList()
    }); // End of Fetch
}

function checkSelected(fileInfo) {
    return !fileInfo.Selected
}
