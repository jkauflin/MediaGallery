/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved.
--------------------------------------------------------------------------------
DESCRIPTION:  Main module to handle interactions with database and file system
                as well as keeping mediaInfo and menu data structures
--------------------------------------------------------------------------------
Modification History
2023-08-06 JJK  Initial version - moved MediaInfo components to this module
2023-09-08 JJK  Renamed to DataRepository to show its function
================================================================================*/

import {createMediaPage,displayCurrFileList,updateAdminMessage} from './mg-CreatePages.js?ver=2.000'
import {setMenuList} from './mg-menu.js?ver=2.000'
import {setAlbumList} from './mg-album.js?ver=2.000'

export let mediaInfo
export let mediaType = 1
export let mediaTypeDesc = "Photos"
export let contentDesc = ""
export var getMenu = false

export var queryCategory = ""
export var querySearchStr = ""
export var queryMenuItem = ""

export var categoryList = []
export var menuFilter = []
export var peopleList = []

//console.log("window.location.pathname = "+window.location.pathname);
//var tempPath = window.location.pathname;
//var strPos = tempPath.indexOf('/vendor/jkauflin');
//const webRootPath = tempPath.substring(0,strPos);
//const webRootPath = tempPath;
var jjkgalleryRoot = "vendor/jkauflin/jjkgallery/";

// MediaRootDir is appended to the front of all URI paths (that limits the PHP work to files under Media as well)
let MediaRootDir = window.location.pathname + "Media/";
let FullMediaRootDir = window.location + "Media/";


export function setMediaType(inMediaType) {
    mediaType = inMediaType
}

export function getFilePath(index,descMod="",fullPath=false) {
    // descMod could be "Thumbs" or "Smaller"
    let fi = mediaInfo.fileList[index]
    /* 8/22/2023 - Shouldn't need this check anymore - all FilePath fields should be set the right way
    if (fi.DirSubPath != '') {
        // If there is a subPath and it doesn't end in a slash, add it
        if (fi.DirSubPath.substr(fi.DirSubPath.length-1,1) != "/") {
            fi.DirSubPath = fi.DirSubPath + '/'
        }
    }
    */
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

        createMediaPage()
    });
}

//------------------------------------------------------------------------------------------------------------
// Update the media info in the database table
//------------------------------------------------------------------------------------------------------------
export function updateMediaInfo(overrideIndividualFileInfo) {
    // Assume current values and selected files in the mediaInfo.fileList are what we want updated
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
        updateAdminMessage(returnMsg)
        // Filter out the Selected files (that were updated)
        mediaInfo.fileList = mediaInfo.fileList.filter(checkSelected);
        displayCurrFileList()
    }); // End of Fetch
}

function checkSelected(fileInfo) {
    return !fileInfo.Selected
}

