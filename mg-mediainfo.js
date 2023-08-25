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
//let photosThumbsRoot = mediaTypeDesc + "Thumbs";
//let photosSmallerRoot = mediaTypeDesc + "Smaller";
// MediaRootDir is appended to the front of all URI paths (that limits the PHP work to files under Media as well)
let MediaRootDir = window.location.pathname + "Media/";

export function loadMediaInfo(inMediaInfo) {
    mediaInfo = inMediaInfo

    // Set the top level variables from the media type descriptions
    if (mediaInfo.menuList != null) {
        if (mediaInfo.menuList.length > 0) {
            mediaTypeDesc = mediaInfo.menuList[0].mediaTypeDesc
            //photosThumbsRoot = mediaTypeDesc + "Thumbs";
            //photosSmallerRoot = mediaTypeDesc + "Smaller";
        }
    }
}

export function setMediaType(inMediaType) {
    mediaType = inMediaType
}

export function getFilePath(index,descMod="") {
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
    return MediaRootDir + mediaTypeDesc + descMod + '/' + fi.DirSubPath + fi.Name;
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
