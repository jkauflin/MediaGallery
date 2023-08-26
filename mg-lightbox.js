/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved.
--------------------------------------------------------------------------------
DESCRIPTION:
--------------------------------------------------------------------------------
Modification History
2023-08-06 JJK  Initial version - moved lightbox components to this module
================================================================================*/
import {empty,mediaInfo,mediaType,mediaTypeDesc,setMediaType,loadMediaInfo,
    getFilePath,getFileName
} from './mg-mediainfo.js?ver=1.020'

const lightboxImgClass = "mg-lb-img"
//const lightboxImgNextClass = "mg-lb-img-next"
//const lightboxImgPrevClass = "mg-lb-img-prev"

var mediaLightboxBody = document.getElementById("MediaLightboxBody")
const mediaLightbox = new bootstrap.Modal(document.getElementById('MediaLightbox'))

export function displayElementInLightbox(index) {
    addImgToModal(index)

    mediaLightbox.show()

    // If there is a NEXT image cache it to increase display speed
    if (index < mediaInfo.fileList.length-1) {
        var imgCache = document.createElement('img')
        imgCache.src = getFilePath(index+1)
    }
}

function addImgToModal(index) {
    empty(mediaLightboxBody)
    let lightboxImg = document.createElement("img");
    lightboxImg.setAttribute('onerror', "this.onerror=null; this.remove()")
    lightboxImg.classList.add(lightboxImgClass)
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
    mediaLightboxBody.appendChild(lightboxImg)

    let closeButton = document.createElement("button")
    closeButton.classList.add('btn','btn-close','float-start','shadow-none','mt-2','me-2')
    closeButton.setAttribute('type',"button")
    closeButton.setAttribute('role',"button")
    closeButton.setAttribute('aria-label',"Close")
    closeButton.setAttribute('data-bs-dismiss',"modal")
    mediaLightboxBody.appendChild(closeButton)
    
    /*
        let aLeft = document.createElement("a")
        //aLeft.href = "#"
        aLeft.classList.add('float-start','m-2')
        let iconLeft = document.createElement("i")
        iconLeft.classList.add('fa','fa-chevron-left','fa-3x',lightboxImgPrevClass)
        aLeft.appendChild(iconLeft)
        mediaLightboxBody.appendChild(aLeft)
    
        let aRight = document.createElement("a")
        //aRight.href = "#"
        aRight.classList.add('float-end','m-2')
        let iconRight = document.createElement("i")
        iconRight.classList.add('fa','fa-chevron-right','fa-3x',lightboxImgNextClass)
        aRight.appendChild(iconRight)
        mediaLightboxBody.appendChild(aRight)
    */

    //-------------------------------------------------------------------------------------------------------------------
    // Listen for Clicks in the Media Lightbox image container and display the NEXT image
    //-------------------------------------------------------------------------------------------------------------------
    //mediaLightboxBody.addEventListener("click", function (event) {
    lightboxImg.addEventListener("click", function (event) {
        //if (event.target && event.target.classList.contains(lightboxImgClass)) {
            let index = parseInt(lightboxImg.getAttribute('data-index'))
            if (typeof index !== "undefined" && index !== null) {
                lightboxNextImg(index)
            }
        //}
        /*
        } else if (event.target && event.target.classList.contains(lightboxImgNextClass)) {
            event.preventDefault();
            // expecting event to be the img
            lightboxNextImg(event)
    
        } else if (event.target && event.target.classList.contains(lightboxImgPrevClass)) {
            event.preventDefault();
            lightboxPrevImg(event)
        */
    })
    
    //-------------------------------------------------------------------------------------------------------------------
    // Listen for Right-clicks in the Media Lightbox image container and display the PREV image
    //-------------------------------------------------------------------------------------------------------------------
    lightboxImg.addEventListener('contextmenu', (event) => {
        // Goto PREV image in Lightbox
        //if (event.target.classList.contains(lightboxImgClass)) {
            event.preventDefault()

            let index = parseInt(lightboxImg.getAttribute('data-index'))
            if (typeof index !== "undefined" && index !== null) {
                if (index > 0) {
                    lightboxPrevImg(index)
                }            
            }
        
        //}
    })
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

