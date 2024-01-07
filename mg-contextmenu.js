/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved.
--------------------------------------------------------------------------------
DESCRIPTION:
--------------------------------------------------------------------------------
Modification History
2023-09-01 JJK  Initial version - moved contextmenu components to this module
================================================================================*/
import {mediaInfo,mediaType,mediaTypeDesc,setMediaType,
    peopleList,getFilePath,getFileName,updateMediaInfo
} from './mg-data-repository.js'
import {empty} from './mg-create-pages.js'

const mediaModal = new bootstrap.Modal(document.getElementById('MediaModal'))
var mediaDetailTitle
var mediaDetailTaken
var mediaDetailCategoryTags
var mediaDetailMenuTags
var mediaDetailAlbumTags
var mediaPeopleList
var mediaDetailDescription
var updateMessageDisplay

var mediaPeopleInput
var mediaPeopleSelect

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

var editMode = false
var jjkloginEventElement = document.getElementById("jjkloginEventElement")
jjkloginEventElement.addEventListener('userJJKLoginAuth', function (event) {
    if (event.detail.userLevel >= 9) {
        editMode = true
    }
});


function displayImgContextMenu(event) {
    let index = parseInt(event.target.getAttribute('data-index'))
    if (typeof index !== "undefined" && index !== null) {
        displayModalDetail(index)
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
        
    let fi = mediaInfo.fileList[index]

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
            mediaDetailTitle = document.createElement("input")
            mediaDetailTitle.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailTitle.setAttribute('type', "text")
            //mediaDetailTitle.setAttribute('placeholder', "Title")
            if (editMode) {
                mediaDetailTitle.disabled = false
            } else {
                mediaDetailTitle.disabled = true
            }
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
            mediaDetailTaken = document.createElement("input")
            mediaDetailTaken.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailTaken.setAttribute('type', "text")
            //mediaDetailTaken.setAttribute('placeholder', "Taken DateTime")
            if (editMode) {
                mediaDetailTaken.disabled = false
            } else {
                mediaDetailTaken.disabled = true
            }
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
            mediaDetailCategoryTags = document.createElement("input")
            //mediaDetailCategoryTags.id = "MediaDetailCategoryTags"
            mediaDetailCategoryTags.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailCategoryTags.setAttribute('type', "text")
            //mediaDetailCategoryTags.setAttribute('placeholder', "Category tags")
            if (editMode) {
                mediaDetailCategoryTags.disabled = false
            } else {
                mediaDetailCategoryTags.disabled = true
            }
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
            mediaDetailMenuTags = document.createElement("input")
            //mediaDetailMenuTags.id = "MediaDetailMenuTags"
            mediaDetailMenuTags.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailMenuTags.setAttribute('type', "text")
            mediaDetailMenuTags.setAttribute('placeholder', "Menu tags")
            if (editMode) {
                mediaDetailMenuTags.disabled = false
            } else {
                mediaDetailMenuTags.disabled = true
            }
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
            mediaDetailAlbumTags = document.createElement("input")
            //mediaDetailAlbumTags.id = "MediaDetailAlbumTags"
            mediaDetailAlbumTags.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailAlbumTags.setAttribute('type', "text")
            //mediaDetailAlbumTags.setAttribute('placeholder', "Album tags")
            if (editMode) {
                mediaDetailAlbumTags.disabled = false
            } else {
                mediaDetailAlbumTags.disabled = true
            }
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

            //-------------------------------------------------------------------------------------------------------------
            // *** People list ***
            //-------------------------------------------------------------------------------------------------------------
            mediaPeopleSelect = document.createElement("select")
            mediaPeopleSelect.classList.add('form-select','float-start','shadow-none','py-1')
            for (let index in peopleList) {
                mediaPeopleSelect.options[mediaPeopleSelect.options.length] = new Option(peopleList[index], index)
            }

            mediaPeopleInput = document.createElement("input")
            mediaPeopleInput.classList.add('form-control','shadow-none','mt-2','py-1')
            mediaPeopleInput.setAttribute('type',"text")
            mediaPeopleInput.setAttribute('placeholder',"People filter")
            rowCol2.appendChild(mediaPeopleInput);
            // Filter the people list from entered value (checked after every key is typed)

            mediaPeopleInput.addEventListener("keyup", function(event) {
                //console.log("mediaPeopleInput.value = "+mediaPeopleInput.value);
                let peopleInputVal = ""
                if (mediaPeopleInput.value != null) {
                    peopleInputVal = mediaPeopleInput.value
                }

                // Remove all options
                for (let i = (mediaPeopleSelect.options.length-1); i > -1; i--) {
                    mediaPeopleSelect.options.remove(i)
                }

                //let searchEx = new RegExp(`//${mediaPeopleInput.value}//i`);
                //string pattern = @"\b[M]\w+";

                //let searchStr = '/'+mediaPeopleInput.value+'/i'
                //let re = new RegExp(`\b${mediaPeopleInput.value}\b`, 'i');
                //let re = new RegExp(`\badam\b`, 'i');

                // Add the ones that match the input value
                for (let index in peopleList) {
                    //if (peopleList[index].search(searchEx) >= 0) {
                    //if (peopleList[index].search(/adam/i) >= 0) {
                    //if (peopleList[index].search(re) >= 0) {
                    if (peopleInputVal != "") {
                        if (peopleList[index].indexOf(peopleInputVal) >= 0) {
                            mediaPeopleSelect.options[mediaPeopleSelect.options.length] = new Option(peopleList[index], index)
                        }
                    } else {
                        mediaPeopleSelect.options[mediaPeopleSelect.options.length] = new Option(peopleList[index], index)
                    }
                }
            });

            rowCol2.appendChild(mediaPeopleSelect);

            // People List
            mediaPeopleList = document.createElement("input")
            //mediaPeopleList.id = "mediaPeopleList"
            mediaPeopleList.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaPeopleList.setAttribute('type', "text")
            mediaPeopleList.setAttribute('placeholder', "People list")
            if (editMode) {
                mediaPeopleList.disabled = false
            } else {
                mediaPeopleList.disabled = true
            }
            mediaPeopleList.value = fi.People

            let replacePeopleButton = document.createElement("button")
            replacePeopleButton.classList.add('btn','btn-primary','btn-sm','float-start','shadow-none','me-2','my-1')
            replacePeopleButton.setAttribute('type',"button")
            replacePeopleButton.setAttribute('role',"button")
            replacePeopleButton.textContent = "Replace"
            rowCol2.appendChild(replacePeopleButton)
            replacePeopleButton.addEventListener("click", function () {
                mediaPeopleList.value = peopleList[mediaPeopleSelect.value]
            });

            let appendPeopleButton = document.createElement("button")
            appendPeopleButton.classList.add('btn','btn-warning','btn-sm','float-start','shadow-none','me-2','my-1')
            appendPeopleButton.setAttribute('type',"button")
            appendPeopleButton.setAttribute('role',"button")
            appendPeopleButton.textContent = "Append"
            rowCol2.appendChild(appendPeopleButton)
            appendPeopleButton.addEventListener("click", function () {
                if (mediaPeopleList.value) {
                    mediaPeopleList.value = mediaPeopleList.value + ',' + peopleList[mediaPeopleSelect.value]
                } else {
                    mediaPeopleList.value = peopleList[mediaPeopleSelect.value]
                }
            });

        rowCol2.appendChild(mediaPeopleList)


        row.appendChild(rowCol1)
        row.appendChild(rowCol2)
        col2.appendChild(row)

        row = document.createElement("div");
        row.classList.add('row')
        rowCol1 = document.createElement("div");
        rowCol1.classList.add('col-sm-2')
        rowCol1.textContent = "Description"
        // Add a SAVE button under the Description label
        if (editMode) {
            let editSaveButton = document.createElement("button")
            editSaveButton.classList.add('btn','btn-success','btn-sm','float-start','shadow-none','mt-3','me-2','mb-3')
            editSaveButton.setAttribute('type',"button")
            editSaveButton.setAttribute('role',"button")
            editSaveButton.textContent = "Update"
            rowCol1.appendChild(editSaveButton)
            editSaveButton.addEventListener("click", function () {
                fi.Title = mediaDetailTitle.value
                fi.TakenDateTime = mediaDetailTaken.value
                fi.CategoryTags = mediaDetailCategoryTags.value
                fi.MenuTags = mediaDetailMenuTags.value
                fi.AlbumTags = mediaDetailAlbumTags.value
                fi.People = mediaPeopleList.value
                fi.Description = mediaDetailDescription.value
                updateMediaInfo(index)
                //mediaModal.hide()
            });
        }
            // Prev
            let detailPrevButton = document.createElement("button")
            //detailPrevButton.id = "MediaAdminSelectAllButton"
            detailPrevButton.classList.add('btn','btn-warning','btn-sm','float-start','shadow-none','me-2','my-0')
            detailPrevButton.setAttribute('type',"button")
            detailPrevButton.setAttribute('role',"button")
            detailPrevButton.textContent = "Prev"
            rowCol1.appendChild(detailPrevButton)
            detailPrevButton.addEventListener("click", function () {
                if (index > 0) {
                    displayModalDetail(index-1)
                }            
            });
            // Next
            let detailNextButton = document.createElement("button")
            //detailNextButton.id = "MediaAdminGetNewButton"
            detailNextButton.classList.add('btn','btn-info','btn-sm','float-start','shadow-none','me-2','my-1')
            detailNextButton.setAttribute('type',"button")
            detailNextButton.setAttribute('role',"button")
            detailNextButton.textContent = "Next"
            rowCol1.appendChild(detailNextButton)
            detailNextButton.addEventListener("click", function () {
                if (index < mediaInfo.fileList.length-1) {
                    displayModalDetail(index+1)
                }            
            });
        
        rowCol2 = document.createElement("div");
        rowCol2.classList.add('col-sm')
            // Description
            let mediaDetailDescription = document.createElement("textarea")
            //mediaDetailDescription.id = "MediaDetailDescription"
            mediaDetailDescription.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailDescription.setAttribute('rows', "6")
            mediaDetailDescription.setAttribute('placeholder', "Description")
            if (editMode) {
                mediaDetailDescription.disabled = false
            } else {
                mediaDetailDescription.disabled = true
            }
            mediaDetailDescription.value = fi.Description
        rowCol2.appendChild(mediaDetailDescription)
        row.appendChild(rowCol1)
        row.appendChild(rowCol2)
        col2.appendChild(row)

        if (editMode) {
            row = document.createElement("div");
            row.classList.add('row')
            rowCol1 = document.createElement("div");
            rowCol1.classList.add('col-sm-2')
            //rowCol1.textContent = ""
            rowCol2 = document.createElement("div");
            rowCol2.classList.add('col-sm')
            updateMessageDisplay = document.createElement("div")
            updateMessageDisplay.textContent = "."
            rowCol2.appendChild(updateMessageDisplay)
            row.appendChild(rowCol1)
            row.appendChild(rowCol2)
            col2.appendChild(row)
        }

        topRow.appendChild(col1)
        topRow.appendChild(col2)
        mediaModalBody.appendChild(topRow)
}



export function updateMessage(displayMessage) {
    if (updateMessageDisplay != null) {
        updateMessageDisplay.textContent = displayMessage
    }
}
