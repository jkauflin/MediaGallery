/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved.
--------------------------------------------------------------------------------
DESCRIPTION:
--------------------------------------------------------------------------------
Modification History
2023-09-01 JJK  Initial version - moved contextmenu components to this module
================================================================================*/
import {mediaInfo,mediaType,mediaTypeDesc,setMediaType,
    getFilePath,getFileName
} from './mg-DataRepository.js?ver=2.000'

import {empty} from './mg-CreatePages.js?ver=2.000'

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
    var holdDownDuration = 900

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

        // >>>> build components for modal display
        // >>>> Maybe add "edit" functions if editMode ???

        // >>> work out "Share" concepts - what do I need to store in the DB?

        let mediaModalTitle = document.getElementById("MediaModalTitle")
        mediaModalTitle.textContent = fi.Name;


        let mediaModalBody = document.getElementById("MediaModalBody")
        empty(mediaModalBody)

        let topRow = document.createElement("div");
        topRow.classList.add('row')

        let col1 = document.createElement("div");
        col1.classList.add('col-sm-4')
        let img = document.createElement("img");
        img.setAttribute('onerror', "this.onerror=null; this.remove()")
        img.classList.add('img-fluid','rounded')
        img.src = getFilePath(index,"Smaller")
        img.setAttribute('data-index', index)
        /*
        if (window.innerHeight > window.innerWidth) {
            // Portrait
            let tempWidth = window.innerWidth - 100
            img.style.maxWidth = tempWidth + "px"
        } else {
            // Landscape
            let tempHeight = window.innerHeight - 100  // 350
            img.style.maxHeight = tempHeight + "px"
        }
        */
        col1.appendChild(img)
        let itemList = document.createElement("ul")
        itemList.classList.add("list-group","mt-3")
        let a = document.createElement("a")
        a.setAttribute('href', getFilePath(index,"",true))
        a.classList.add("list-group-item","list-group-item-action")
        a.target = '_blank'
        a.textContent = "Open FULL image in new tab"
        itemList.appendChild(a)
        a = document.createElement("a")
        a.setAttribute('href', getFilePath(index,"",true))
        a.download = getFileName(index)
        a.classList.add("list-group-item","list-group-item-action")
        a.textContent = "Save (Download) FULL image"
        itemList.appendChild(a)
        /*
        a = document.createElement("a")
        a.setAttribute('href', "#")
        a.classList.add("list-group-item","list-group-item-action")
        a.textContent = "Share..."
        itemList.appendChild(a)
        */
        col1.appendChild(itemList)

        //----------------------------------------------------------------------------------
        // File detail fields in Col 2
        //----------------------------------------------------------------------------------
        let col2 = document.createElement("div");
        col2.classList.add('col-sm')

        let row = document.createElement("div");
        row.classList.add('row')
        let rowCol1 = document.createElement("div");
        rowCol1.classList.add('col-sm-2')
        rowCol1.textContent = "Title"
        let rowCol2 = document.createElement("div");
        rowCol2.classList.add('col-sm')
            // Title
            let mediaDetailTitle = document.createElement("input")
            mediaDetailTitle.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailTitle.setAttribute('type', "text")
            //mediaDetailTitle.setAttribute('placeholder', "Title")
            mediaDetailTitle.disabled = true
            mediaDetailTitle.value = fi.Title
        rowCol2.appendChild(mediaDetailTitle)
        row.appendChild(rowCol1)
        row.appendChild(rowCol2)
        col2.appendChild(row)

        row = document.createElement("div");
        row.classList.add('row')
        rowCol1 = document.createElement("div");
        rowCol1.classList.add('col-sm-2')
        rowCol1.textContent = "Taken"
        rowCol2 = document.createElement("div");
        rowCol2.classList.add('col-sm')
            // Taken
            let mediaDetailTaken = document.createElement("input")
            mediaDetailTaken.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailTaken.setAttribute('type', "text")
            //mediaDetailTaken.setAttribute('placeholder', "Taken DateTime")
            mediaDetailTaken.disabled = true
            mediaDetailTaken.value = fi.TakenDateTime
        rowCol2.appendChild(mediaDetailTaken)
        row.appendChild(rowCol1)
        row.appendChild(rowCol2)
        col2.appendChild(row)

        row = document.createElement("div");
        row.classList.add('row')
        rowCol1 = document.createElement("div");
        rowCol1.classList.add('col-sm-2')
        rowCol1.textContent = "Category tags"
        rowCol2 = document.createElement("div");
        rowCol2.classList.add('col-sm')
            // Category Tags
            let mediaDetailCategoryTags = document.createElement("input")
            //mediaDetailCategoryTags.id = "MediaDetailCategoryTags"
            mediaDetailCategoryTags.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailCategoryTags.setAttribute('type', "text")
            //mediaDetailCategoryTags.setAttribute('placeholder', "Category tags")
            mediaDetailCategoryTags.disabled = true
            mediaDetailCategoryTags.value = fi.CategoryTags
        rowCol2.appendChild(mediaDetailCategoryTags)
        row.appendChild(rowCol1)
        row.appendChild(rowCol2)
        col2.appendChild(row)

        row = document.createElement("div");
        row.classList.add('row')
        rowCol1 = document.createElement("div");
        rowCol1.classList.add('col-sm-2')
        rowCol1.textContent = "Menu tags"
        rowCol2 = document.createElement("div");
        rowCol2.classList.add('col-sm')
            // Menu Tags
            let mediaDetailMenuTags = document.createElement("input")
            //mediaDetailMenuTags.id = "MediaDetailMenuTags"
            mediaDetailMenuTags.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailMenuTags.setAttribute('type', "text")
            mediaDetailMenuTags.setAttribute('placeholder', "Menu tags")
            mediaDetailMenuTags.disabled = true
            mediaDetailMenuTags.value = fi.MenuTags
        rowCol2.appendChild(mediaDetailMenuTags)
        row.appendChild(rowCol1)
        row.appendChild(rowCol2)
        col2.appendChild(row)

        row = document.createElement("div");
        row.classList.add('row')
        rowCol1 = document.createElement("div");
        rowCol1.classList.add('col-sm-2')
        rowCol1.textContent = "Album tags"
        rowCol2 = document.createElement("div");
        rowCol2.classList.add('col-sm')
            // Album Tags
            let mediaDetailAlbumTags = document.createElement("input")
            //mediaDetailAlbumTags.id = "MediaDetailAlbumTags"
            mediaDetailAlbumTags.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailAlbumTags.setAttribute('type', "text")
            //mediaDetailAlbumTags.setAttribute('placeholder', "Album tags")
            mediaDetailAlbumTags.disabled = true
            mediaDetailAlbumTags.value = fi.AlbumTags
        rowCol2.appendChild(mediaDetailAlbumTags)
        row.appendChild(rowCol1)
        row.appendChild(rowCol2)
        col2.appendChild(row)

        row = document.createElement("div");
        row.classList.add('row')
        rowCol1 = document.createElement("div");
        rowCol1.classList.add('col-sm-2')
        rowCol1.textContent = "People"
        rowCol2 = document.createElement("div");
        rowCol2.classList.add('col-sm')
            // People List
            let mediaDetailPeopleList = document.createElement("input")
            //mediaDetailPeopleList.id = "MediaDetailPeopleList"
            mediaDetailPeopleList.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailPeopleList.setAttribute('type', "text")
            //mediaDetailPeopleList.setAttribute('placeholder', "People list")
            mediaDetailPeopleList.disabled = true  //<<<<<<<<<<<<<<<<<<<<<<<<<<<<
            mediaDetailPeopleList.value = fi.People
        rowCol2.appendChild(mediaDetailPeopleList)
        row.appendChild(rowCol1)
        row.appendChild(rowCol2)
        col2.appendChild(row)

        row = document.createElement("div");
        row.classList.add('row')
        rowCol1 = document.createElement("div");
        rowCol1.classList.add('col-sm-2')
        rowCol1.textContent = "Description"
        rowCol2 = document.createElement("div");
        rowCol2.classList.add('col-sm')
            // Description
            let mediaDetailDescription = document.createElement("textarea")
            //mediaDetailDescription.id = "MediaDetailDescription"
            mediaDetailDescription.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailDescription.setAttribute('rows', "6")
            mediaDetailDescription.setAttribute('placeholder', "Description")
            mediaDetailDescription.disabled = true
            mediaDetailDescription.value = fi.Description
        rowCol2.appendChild(mediaDetailDescription)
        row.appendChild(rowCol1)
        row.appendChild(rowCol2)
        col2.appendChild(row)


        topRow.appendChild(col1)
        topRow.appendChild(col2)
        mediaModalBody.appendChild(topRow)

    }


