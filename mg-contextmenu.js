/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved.
--------------------------------------------------------------------------------
DESCRIPTION:
--------------------------------------------------------------------------------
Modification History
2023-09-01 JJK  Initial version - moved contextmenu components to this module
================================================================================*/
import {empty,mediaInfo,mediaType,mediaTypeDesc,setMediaType,loadMediaInfo,
    getFilePath,getFileName
} from './mg-mediainfo.js?ver=1.020'

var listenClass = ""
export function setContextMenuListeners(listenContainer, inClass) {
    listenClass = inClass

    //-------------------------------------------------------------------------------------------------------------------
    // Listen for context menu requests in the container
    //-------------------------------------------------------------------------------------------------------------------
    listenContainer.addEventListener('contextmenu', (event) => {
        event.preventDefault()
        displayImgContextMenu(event)
    })
}

    function displayImgContextMenu(event) {
        let index = parseInt(event.target.getAttribute('data-index'))
        if (typeof index !== "undefined" && index !== null) {
            displayModalDetail(index)
            const mediaModal = new bootstrap.Modal(document.getElementById('MediaModal'))
            mediaModal.show()
        }
    }

    document.addEventListener('touchstart', (event) => {
        holdDownStart(event)
    })
    document.addEventListener('touchend', (event) => {
        holdDownEnd(event)
    })   
    document.addEventListener('touchcancel', (event) => {
        holdDownEnd(event)
    })   
    document.addEventListener('mousedown', (event) => {
        if (event.button == 0) {
            holdDownStart(event)
        }
    })
    document.addEventListener('mouseup', (event) => {
        if (event.button == 0) {
            holdDownEnd(event)
        }
    })

    var beingHeldDown = false
    var holdDownStartMs = 0
    var holdDownDuration = 1000

    function holdDownStart(event) {
        //console.log("HOLD DOWN $$$ Start")
        if (!beingHeldDown) {
            beingHeldDown = true
            //Date.now() Return value A number representing the timestamp, in milliseconds
            holdDownStartMs = Date.now()
            // Kick off timeout to check at the end of duration
            //console.log("   $$$ NOT being Held,    holdDownStartMs = "+holdDownStartMs)
            setTimeout(function(){ holdDownCheck(event) }, holdDownDuration)
        }
    }
    function holdDownEnd(event) {
        //console.log("HOLD DOWN >>>>> End")
        beingHeldDown = false
    }
    function holdDownCheck(event) {
        //console.log("HOLD DOWN *** Check ***")
        // Check at the end of the duration timeout if it is still being held down
        if (beingHeldDown) {
            // double check how long it's actually been holding
            let holdDuration = Date.now() - holdDownStartMs
            //console.log("   *** Being Held, tempDuration = "+tempDuration)
            //if ((Date.now() - holdDownStartMs) >= holdDownDuration) {
            if ((holdDuration) >= holdDownDuration) {
                if (event.target.classList.contains(listenClass)) {
                    event.preventDefault()
                    displayImgContextMenu(event)
                } 
            }
        }
    }

    //-------------------------------------------------------------------------------------------------------
    // Display file information in Medial Modal popup
    //-------------------------------------------------------------------------------------------------------
    function displayModalDetail(index) {
        
        // >>>>>>>>>>>>>> Display details, or EDIT if edit mode
                
        let fi = mediaInfo.fileList[index]

        let img = document.createElement("img");
        img.setAttribute('onerror', "this.onerror=null; this.remove()")
        img.classList.add('img-fluid')
        img.src = getFilePath(index,"Smaller")
        img.setAttribute('data-index', index)
        if (window.innerHeight > window.innerWidth) {
            // Portrait
            let tempWidth = window.innerWidth - 350
            img.style.maxWidth = tempWidth + "px"
        } else {
            // Landscape
            let tempHeight = window.innerHeight - 350
            img.style.maxHeight = tempHeight + "px"
        }

        let mediaModalImg = document.getElementById("MediaModalImg")
        empty(mediaModalImg)
        mediaModalImg.appendChild(img)

        let mediaModalBody = document.getElementById("MediaModalBody")
        empty(mediaModalBody)

        // >>>> build components for modal display
        // >>>> Maybe add "edit" functions if editMode ???

        // >>> work out "Share" concepts - what do I need to store in the DB?

        let mediaModalTitle = document.getElementById("MediaModalTitle")
        mediaModalTitle.textContent = fi.Name;
        /*
        let mediaDetailFilename = document.createElement("div")
        mediaDetailFilename.textContent = fi.Name;
        mediaModalBody.appendChild(mediaDetailFilename)
        */
        let mediaDetailTitle = document.createElement("input")
        mediaDetailTitle.classList.add('form-control','py-1','mb-1','shadow-none')
        mediaDetailTitle.setAttribute('type', "text")
        mediaDetailTitle.setAttribute('placeholder', "Title")
        mediaDetailTitle.disabled = true
        mediaModalBody.appendChild(mediaDetailTitle)
        
        let mediaDetailTaken = document.createElement("input")
        mediaDetailTaken.classList.add('form-control','py-1','mb-1','shadow-none')
        mediaDetailTaken.setAttribute('type', "text")
        mediaDetailTaken.setAttribute('placeholder', "Taken DateTime")
        mediaDetailTaken.disabled = true
        mediaModalBody.appendChild(mediaDetailTaken)

        // Category Tags
        let mediaDetailCategoryTags = document.createElement("input")
        //mediaDetailCategoryTags.id = "MediaDetailCategoryTags"
        mediaDetailCategoryTags.classList.add('form-control','py-1','mb-1','shadow-none')
        mediaDetailCategoryTags.setAttribute('type', "text")
        mediaDetailCategoryTags.setAttribute('placeholder', "Category tags")
        mediaDetailCategoryTags.disabled = true
        mediaModalBody.appendChild(mediaDetailCategoryTags)

        let mediaDetailMenuTags = document.createElement("input")
        //mediaDetailMenuTags.id = "MediaDetailMenuTags"
        mediaDetailMenuTags.classList.add('form-control','py-1','mb-1','shadow-none')
        mediaDetailMenuTags.setAttribute('type', "text")
        mediaDetailMenuTags.setAttribute('placeholder', "Menu tags")
        mediaDetailMenuTags.disabled = true
        mediaModalBody.appendChild(mediaDetailMenuTags)

        // Album Tags
        let mediaDetailAlbumTags = document.createElement("input")
        //mediaDetailAlbumTags.id = "MediaDetailAlbumTags"
        mediaDetailAlbumTags.classList.add('form-control','py-1','mb-1','shadow-none')
        mediaDetailAlbumTags.setAttribute('type', "text")
        mediaDetailAlbumTags.setAttribute('placeholder', "Album tags")
        mediaDetailAlbumTags.disabled = true
        mediaModalBody.appendChild(mediaDetailAlbumTags)

        // People List
        let mediaDetailPeopleList = document.createElement("input")
        //mediaDetailPeopleList.id = "MediaDetailPeopleList"
        mediaDetailPeopleList.classList.add('form-control','py-1','mb-1','shadow-none')
        mediaDetailPeopleList.setAttribute('type', "text")
        mediaDetailPeopleList.setAttribute('placeholder', "People list")
        mediaDetailPeopleList.disabled = true  //<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        mediaModalBody.appendChild(mediaDetailPeopleList)

        // Description
        let mediaDetailDescription = document.createElement("textarea")
        //mediaDetailDescription.id = "MediaDetailDescription"
        mediaDetailDescription.classList.add('form-control','py-1','mb-1','shadow-none')
        mediaDetailDescription.setAttribute('rows', "6")
        mediaDetailDescription.setAttribute('placeholder', "Description")
        mediaDetailDescription.disabled = true
        //mediaDetailDescription.value = fi.Description
        mediaModalBody.appendChild(mediaDetailDescription)

        mediaDetailTitle.value = fi.Title
        mediaDetailTaken.value = fi.TakenDateTime
        mediaDetailCategoryTags.value = fi.CategoryTags
        mediaDetailMenuTags.value = fi.MenuTags
        mediaDetailAlbumTags.value = fi.AlbumTags
        mediaDetailPeopleList.value = fi.People
        mediaDetailDescription.value = fi.Description
    }


