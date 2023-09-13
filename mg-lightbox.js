/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved.
--------------------------------------------------------------------------------
DESCRIPTION:
--------------------------------------------------------------------------------
Modification History
2023-08-06 JJK  Initial version - moved lightbox components to this module
2023-08-31 JJK  Attached click event to individual elements rather than 
                tracking clicks on the whole body and looking for a class
================================================================================*/
import {mediaInfo,mediaType,mediaTypeDesc,setMediaType,
    getFilePath,getFileName
} from './mg-DataRepository.js?ver=2.000'

import {empty} from './mg-CreatePages.js?ver=2.000'

const mediaLightbox = new bootstrap.Modal(document.getElementById('MediaLightbox'))
var mediaLightboxBody = document.getElementById("MediaLightboxBody")
var lightboxImg = document.createElement("img");
const lightboxImgClass = "mg-lb-img"

export function displayElementInLightbox(index) {
    addImgToModal(index)
    mediaLightbox.show()
    // If there is a NEXT image cache it to increase display speed
    if (index < mediaInfo.fileList.length-1) {
        var imgCache = document.createElement('img')
        imgCache.src = getFilePath(index+1,"Smaller")
    }
}

function addImgToModal(index) {
    empty(mediaLightboxBody)

    let aLeft = document.createElement("a")
    //aLeft.href = "#"
    aLeft.classList.add('float-start','m-2')
    let iconLeft = document.createElement("i")
    //iconLeft.classList.add('fa','fa-chevron-left','fa-2x',lightboxImgPrevClass)
    iconLeft.classList.add('fa','fa-chevron-left','fa-2x')
    aLeft.appendChild(iconLeft)
    aLeft.addEventListener("click", function (event) {
        event.preventDefault();
        //console.log(">>> aLeft click, classList = "+event.target.classList)
        let index = parseInt(lightboxImg.getAttribute('data-index'))
        if (typeof index !== "undefined" && index !== null) {
            lightboxPrevImg(index)
        }
    })
    mediaLightboxBody.appendChild(aLeft)

    lightboxImg = document.createElement("img");
    lightboxImg.setAttribute('onerror', "this.onerror=null; this.remove()")
    lightboxImg.classList.add(lightboxImgClass,'float-start')
    //lightboxImg.src = getFilePath(index)
    //console.log("smaller path = "+getFilePath(index,"Smaller"))
    lightboxImg.src = getFilePath(index,"Smaller")
    lightboxImg.setAttribute('data-index', index)
    if (window.innerHeight > window.innerWidth) {
        // Portrait
        let tempWidth = window.innerWidth - 40
        lightboxImg.style.maxWidth = tempWidth + "px"
    } else {
        // Landscape
        let tempHeight = window.innerHeight - 40
        lightboxImg.style.maxHeight = tempHeight + "px"
    }
    lightboxImg.addEventListener("click", function (event) {
        event.preventDefault();
        //console.log("*** lightboxImg click, classList = "+event.target.classList)
        let index = parseInt(lightboxImg.getAttribute('data-index'))
        if (typeof index !== "undefined" && index !== null) {
            lightboxNextImg(index)
        }
    })
    mediaLightboxBody.appendChild(lightboxImg)

    let aRight = document.createElement("a")
    //aRight.href = "#"
    aRight.classList.add('float-start','m-2')
    let iconRight = document.createElement("i")
    //iconRight.classList.add('fa','fa-chevron-right','fa-2x',lightboxImgNextClass)
    iconRight.classList.add('fa','fa-chevron-right','fa-2x')
    aRight.appendChild(iconRight)
    aRight.addEventListener("click", function (event) {
        event.preventDefault();
        //console.log("$$$ aRight click, classList = "+event.target.classList)
        let index = parseInt(lightboxImg.getAttribute('data-index'))
        if (typeof index !== "undefined" && index !== null) {
            lightboxNextImg(index)
        }
    })
    mediaLightboxBody.appendChild(aRight)

    let closeButton = document.createElement("button")
    //closeButton.classList.add('btn','btn-close','float-start','shadow-none','mt-2','me-2')
    closeButton.classList.add('btn','btn-close','float-start','shadow-none','mt-2','me-2')
    closeButton.setAttribute('type',"button")
    closeButton.setAttribute('role',"button")
    closeButton.setAttribute('aria-label',"Close")
    closeButton.setAttribute('data-bs-dismiss',"modal")
    mediaLightboxBody.appendChild(closeButton)
}

function lightboxNextImg(index) {
    if (index < mediaInfo.fileList.length-1) {
        addImgToModal(index+1)
    }            
}

function lightboxPrevImg(index) {
    if (index > 0) {
        addImgToModal(index-1)
    }            
}

