/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved.
--------------------------------------------------------------------------------
DESCRIPTION:
--------------------------------------------------------------------------------
Modification History
2023-08-06 JJK  Initial version - moved MediaInfo components to this module
================================================================================*/

export let mediaInfo
export let mediaType = 1
export let mediaTypeDesc = "Photos"
let photosThumbsRoot = mediaTypeDesc + "Thumbs";
//let photosSmallerRoot = mediaTypeDesc + "Smaller";
// MediaRootDir is appended to the front of all URI paths (that limits the PHP work to files under Media as well)
let MediaRootDir = window.location.pathname + "Media/";

export function loadMediaInfo(inMediaInfo) {
    mediaInfo = inMediaInfo

    // Set the top level variables from the media type descriptions
    if (mediaInfo.menuList != null) {
        if (mediaInfo.menuList.length > 0) {
            mediaTypeDesc = mediaInfo.menuList[0].mediaTypeDesc
            photosThumbsRoot = mediaTypeDesc + "Thumbs";
        }
    }
}

export function setMediaType(inMediaType) {
    mediaType = inMediaType
}

export function getFilePath(index) {
    let fi = mediaInfo.fileList[index]
    let filePath = ''
    if (fi.DirSubPath != '') {
        filePath = MediaRootDir + mediaTypeDesc + '/' + fi.DirSubPath + '/' + fi.Name;
    }
    else 
    {
        filePath = MediaRootDir + mediaTypeDesc + '/' + fi.Name;
    }
    return filePath
}

export function getThumbsFilePath(index) {
    let fi = mediaInfo.fileList[index]
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

    return MediaRootDir + photosThumbsRoot + fileSubPath
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

// Remove all child nodes from an element
export function empty(node) {
    // Could just set the innerHTML to null, but they say removing the children is faster
    // and better for removing any associated events
    //node.innerHTML = "";
    while (node.firstChild) {
        node.removeChild(node.firstChild)
    }
}
