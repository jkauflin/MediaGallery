/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved.
--------------------------------------------------------------------------------
DESCRIPTION:
--------------------------------------------------------------------------------
Modification History
2023-09-08 JJK  Initial version - moved create page components to this module
================================================================================*/
import {mediaInfo,mediaType,getMenu,
    queryCategory,querySearchStr,queryMenuItem,queryAlbumKey,
    categoryList,menuFilter,peopleList,
    contentDesc,
    queryMediaInfo,
    getFilePath,getFileName,
    updateMediaInfo,
} from './mg-data-repository.js'
import {mediaMenuCanvasId,buildMenuElements} from './mg-menu.js'
import {mediaAlbumMenuCanvasId,buildAlbumMenuElements} from './mg-album.js'
import {setContextMenuListeners} from './mg-contextmenu.js'
import {displayElementInLightbox} from './mg-lightbox.js'
import {playlistSongClass,audioPrevClass,audioNextClass,audioPlayer,setAudioListeners,
        emptyPlaylist,incrementPlaylistIndex,addSongToPlaylist} from './mg-audio-playlist.js'

const MediaFilterRequestClass = "MediaFilterRequest";
const imgThumbnailClass = "img-thumbnail-jjk"  // Want my own thumbnail formatting instead of bootstrap border
const thumbCheckboxClass = "thumb-checkbox"

var mediaPageContainer = document.getElementById("MediaPage");
var filterContainer = document.createElement("div")
var thumbnailContainer = document.createElement("div")
var editRow1 = document.createElement("div")


var mediaAdminMessage
var mediaCategorySelect
var mediaMenuSelect
var mediaPeopleInput
var mediaPeopleSelect
var mediaPeopleList

var mediaFilterCategory
var mediaFilterStartDate
var mediaFilterSearchStr
//var mediaFilterMenuItem
//var mediaFilterAlbumTag

var mediaDetailFilename
var mediaDetailTitle
var mediaDetailTaken
var mediaDetailImg
var mediaDetailCategoryTags
var mediaDetailMenuTags
var mediaDetailAlbumTags
var mediaDetailPeopleList
var mediaDetailDescription

var currIndex = 0
var editMode = false
var currSelectAll = false

var jjkloginEventElement = document.getElementById("jjkloginEventElement")
jjkloginEventElement.addEventListener('userJJKLoginAuth', function (event) {
    if (event.detail.userLevel >= 9) {
        // If the user is authenticated and has the right security level, add an "Edit" switch
        let editSwitchDiv = document.createElement("div")
        editSwitchDiv.classList.add('form-check','form-switch','float-end','shadow-none','d-none','d-lg-block')

        let editSwitch = document.createElement("input")
        editSwitch.id = "editSwitch"
        editSwitch.classList.add('form-check-input','shadow-none')
        editSwitch.setAttribute('type',"checkbox")
        editSwitch.setAttribute('role',"switch")
        editSwitchDiv.appendChild(editSwitch)

        let editSwitchLabel = document.createElement("label")
        editSwitchLabel.classList.add('form-check-label')
        editSwitchLabel.setAttribute('for',editSwitch.id)
        editSwitchLabel.textContent = "Edit"
        editSwitchDiv.appendChild(editSwitchLabel)

        mediaPageContainer.appendChild(editSwitchDiv);

        editSwitch.addEventListener("change", function () {
            //console.log(">>> editSwitch.checked = "+editSwitch.checked)
            editMode = editSwitch.checked
            createMediaPage()
        });
    }
});

// Remove all child nodes from an element
export function empty(node) {
    // Could just set the innerHTML to null, but they say removing the children is faster
    // and better for removing any associated events
    //node.innerHTML = "";
    while (node.firstChild) {
        node.removeChild(node.firstChild)
    }
}


// Set the container and class for the contextmenu
// >>>>> should I try to "pull" the container and class from CreatePages module?
setContextMenuListeners(thumbnailContainer, imgThumbnailClass)
setAudioListeners(thumbnailContainer)

//-------------------------------------------------------------------------------------------------------
// Listen for clicks in containers
//-------------------------------------------------------------------------------------------------------
thumbnailContainer.addEventListener("click", function (event) {
    //console.log("thumbnailContainer click, classList = "+event.target.classList)

    // Check for specific classes
    if (event.target && event.target.classList.contains(MediaFilterRequestClass)) {
            // If click on a Filter Request (like Next or Prev), query the data and build the thumbnail display
            //console.log(">>> FilterRequest data-category = "+event.target.getAttribute('data-category'))
            //console.log(">>> FilterRequest data-startDate = "+event.target.getAttribute('data-startDate'))
            //console.log(">>> FilterRequest data-searchStr = "+event.target.getAttribute('data-searchStr'))
            //console.log(">>> FilterRequest data-menuItem = "+event.target.getAttribute('data-menuItem'))

            let paramData = {
                MediaFilterMediaType: mediaType, 
                getMenu: false,
                MediaFilterCategory:  event.target.getAttribute('data-category'),
                MediaFilterStartDate: event.target.getAttribute('data-startDate'),
                MediaFilterMenuItem: event.target.getAttribute('data-menuItem'),
                MediaFilterAlbumKey: event.target.getAttribute('data-albumKey'),
                MediaFilterSearchStr: event.target.getAttribute('data-searchStr')}

            queryMediaInfo(paramData);

    } else if (event.target && event.target.classList.contains(imgThumbnailClass)) {
            event.preventDefault();
            // If clicking on a Thumbnail, bring up in Lightbox or FileDetail (for Edit mode)
            let index = parseInt(event.target.getAttribute('data-index'))
            if (typeof index !== "undefined" && index !== null) {
                if (editMode) {
                    displayFileDetail(index)
                } else {
                    displayElementInLightbox(index)
                }
            }

    } else if (event.target && event.target.classList.contains(thumbCheckboxClass)) {
            // Thumbnail card checkbox
            //console.log("Clicked on image checkbox")
            let index = parseInt(event.target.getAttribute('data-index'))
            if (typeof index !== "undefined" && index !== null) {
                mediaInfo.fileList[index].Selected = true
            }
    }
})


    //-------------------------------------------------------------------------------------------------------
    // Respond to Filter requests
    //-------------------------------------------------------------------------------------------------------
    function executeFilter() {
        mediaFilterSearchStr.value = cleanInputStr(mediaFilterSearchStr.value)
        //console.log(">>> Execute Filter mediaFilterMediaType = "+mediaType)
        //console.log(">>> Execute Filter mediaFilterCategory = "+mediaFilterCategory.value)
        //console.log(">>> Filter mediaFilterStartDate = "+mediaFilterStartDate.value)
        //console.log(">>> Filter mediaFilterSearchStr = "+mediaFilterSearchStr.value)
        //console.log(">>> Filter mediaFilterMenuItem = "+mediaFilterMenuItem.value)
        //console.log(">>> Filter mediaFilterAlbumTag = "+mediaFilterAlbumTag.value)

        let paramData = {
            MediaFilterMediaType: mediaType, 
            getMenu: false,
            MediaFilterCategory:  mediaFilterCategory.value,
            MediaFilterStartDate: mediaFilterStartDate.value,
            MediaFilterSearchStr: mediaFilterSearchStr.value}

        queryMediaInfo(paramData);
        // After query has retreived data, it will kick off the display page create
    }

    var nonAlphaNumericSpaceCharsStr = "[\x01-\x1F\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]";
    // "g" global so it does more than 1 substitution
    var regexNonAlphaNumericSpaceChars = new RegExp(nonAlphaNumericSpaceCharsStr, "g");
    function cleanInputStr(inStr) {
        // Remove all NON-alphanumeric or space characters
        return inStr.replace(regexNonAlphaNumericSpaceChars, '');
    }
    
    //------------------------------------------------------------------------------------------------------------
    // Dynamically create the DOM elements to add to the Media Page div (either regular display or EDIT mode)
    //------------------------------------------------------------------------------------------------------------
    export function createMediaPage() {
        //console.log("$$$$ in the createMediaPage")
        empty(filterContainer)
        empty(thumbnailContainer)
        empty(editRow1)

        if (getMenu) {
            buildMenuElements(mediaType)
            buildAlbumMenuElements(mediaType)
        }
        buildFilterElements(mediaType)

        if (editMode) {
            // Create Row and columns
            editRow1.classList.add('row')

            // Col 1
            let editRow1Col1 = document.createElement("div")
            editRow1Col1.classList.add('col-sm-5','col-md-6')

            editRow1Col1.appendChild(thumbnailContainer);
            editRow1.appendChild(editRow1Col1)

            // Col 2
            let editRow1Col2 = document.createElement("div")
            editRow1Col2.classList.add('col-sm-4','col-md-4')

            // GetNEW
            let getNewButton = document.createElement("button")
            getNewButton.classList.add('btn','btn-success','btn-sm','float-start','shadow-none','me-2','my-2')
            getNewButton.setAttribute('type',"button")
            getNewButton.setAttribute('role',"button")
            getNewButton.textContent = "Get NEW"
            editRow1Col2.appendChild(getNewButton)
            getNewButton.addEventListener("click", function () {
                let paramData = {
                    MediaFilterMediaType: mediaType, 
                    getNew: true}
                queryMediaInfo(paramData);
            });

            // SelectALL
            let selectAllButton = document.createElement("button")
            selectAllButton.classList.add('btn','btn-primary','btn-sm','float-start','shadow-none','me-2','my-2')
            selectAllButton.setAttribute('type',"button")
            selectAllButton.setAttribute('role',"button")
            selectAllButton.textContent = "Select ALL"
            editRow1Col2.appendChild(selectAllButton)
            selectAllButton.addEventListener("click", function () {
                currIndex = 0
                if (currSelectAll == true) {
                    currSelectAll = false
                } else {
                    currSelectAll = true
                }
                // Loop through the current file list and set all to Selected
                for (let index in mediaInfo.fileList) {
                    mediaInfo.fileList[index].Selected = currSelectAll
                }        
                //displayFileDetail(currIndex) <<<<< can't select the 1st one because that will turn off the selected for all the rest
                displayCurrFileList()
            });

            // Prev
            let detailPrevButton = document.createElement("button")
            //detailPrevButton.id = "MediaAdminSelectAllButton"
            detailPrevButton.classList.add('btn','btn-warning','btn-sm','float-start','shadow-none','me-2','my-2')
            detailPrevButton.setAttribute('type',"button")
            detailPrevButton.setAttribute('role',"button")
            detailPrevButton.textContent = "Prev"
            editRow1Col2.appendChild(detailPrevButton)
            detailPrevButton.addEventListener("click", function () {
                if (currIndex > 0) {
                    currIndex -= 1
                    displayFileDetail(currIndex)
                }            
            });

            // Next
            let detailNextButton = document.createElement("button")
            //detailNextButton.id = "MediaAdminGetNewButton"
            detailNextButton.classList.add('btn','btn-info','btn-sm','float-start','shadow-none','me-2','my-2')
            detailNextButton.setAttribute('type',"button")
            detailNextButton.setAttribute('role',"button")
            detailNextButton.textContent = "Next"
            editRow1Col2.appendChild(detailNextButton)
            detailNextButton.addEventListener("click", function () {
                if (currIndex < mediaInfo.fileList.length-1) {
                    currIndex += 1
                    displayFileDetail(currIndex)
                }            
            });

            // *** Detail TAGS ***
            mediaDetailFilename = document.createElement("div")
            editRow1Col2.appendChild(mediaDetailFilename)
    
            mediaDetailTitle = document.createElement("input")
            mediaDetailTitle.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailTitle.setAttribute('type', "text")
            mediaDetailTitle.setAttribute('placeholder', "Title")
            editRow1Col2.appendChild(mediaDetailTitle)
    
            mediaDetailTaken = document.createElement("input")
            mediaDetailTaken.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailTaken.setAttribute('type', "text")
            mediaDetailTaken.setAttribute('placeholder', "Taken DateTime")
            editRow1Col2.appendChild(mediaDetailTaken)
    
            mediaDetailImg = document.createElement("img")
            mediaDetailImg.classList.add('img-fluid','rounded','mx-auto','d-block')
            //mediaDetailImg.setAttribute('onerror', "this.onerror=null; this.remove()")
            mediaDetailImg.setAttribute('onerror', "this.onerror=null;this.src='https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg';")
            editRow1Col2.appendChild(mediaDetailImg)

            editRow1.appendChild(editRow1Col2)

            // Col 3
            let editRow1Col3 = document.createElement("div")
            editRow1Col3.classList.add('col-sm-3','col-md-2')
            // Category
            mediaCategorySelect = document.createElement("select")
            mediaCategorySelect.classList.add('form-select','float-start','shadow-none','mt-2','py-1')
            for (let index in categoryList) {
                if (index == 1) {
                    mediaCategorySelect.options[mediaCategorySelect.options.length] = new Option(categoryList[index], categoryList[index], true, true)
                } else {
                    mediaCategorySelect.options[mediaCategorySelect.options.length] = new Option(categoryList[index], categoryList[index])
                }
            }
            editRow1Col3.appendChild(mediaCategorySelect);

            mediaMenuSelect = document.createElement("select")
            mediaMenuSelect.classList.add('form-select','float-start','shadow-none','mt-2','py-1')
            for (let index in menuFilter) {
                let tempPos = menuFilter[index].indexOf(' - ')
                mediaMenuSelect.options[mediaMenuSelect.options.length] = new Option(menuFilter[index], menuFilter[index].substring(tempPos+3))
            }
            editRow1Col3.appendChild(mediaMenuSelect);

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
            editRow1Col3.appendChild(mediaPeopleInput);
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

            editRow1Col3.appendChild(mediaPeopleSelect);

            mediaPeopleList = document.createElement("input")
            mediaPeopleList.classList.add('form-control','shadow-none','py-1')
            mediaPeopleList.setAttribute('type',"text")
            mediaPeopleList.setAttribute('placeholder',"People list")

            let replacePeopleButton = document.createElement("button")
            replacePeopleButton.classList.add('btn','btn-primary','btn-sm','float-start','shadow-none','me-2','my-1')
            replacePeopleButton.setAttribute('type',"button")
            replacePeopleButton.setAttribute('role',"button")
            replacePeopleButton.textContent = "Replace"
            editRow1Col3.appendChild(replacePeopleButton)
            replacePeopleButton.addEventListener("click", function () {
                mediaPeopleList.value = peopleList[mediaPeopleSelect.value]
            });

            let appendPeopleButton = document.createElement("button")
            appendPeopleButton.classList.add('btn','btn-warning','btn-sm','float-start','shadow-none','me-2','my-1')
            appendPeopleButton.setAttribute('type',"button")
            appendPeopleButton.setAttribute('role',"button")
            appendPeopleButton.textContent = "Append"
            editRow1Col3.appendChild(appendPeopleButton)
            appendPeopleButton.addEventListener("click", function () {
                if (mediaPeopleList.value) {
                    mediaPeopleList.value = mediaPeopleList.value + ',' + peopleList[mediaPeopleSelect.value]
                } else {
                    mediaPeopleList.value = peopleList[mediaPeopleSelect.value]
                }
            });

            editRow1Col3.appendChild(mediaPeopleList);

            // Update
            let editUpdateButton = document.createElement("button")
            editUpdateButton.classList.add('btn','btn-info','btn-sm','float-start','shadow-none','mt-3','me-2')
            editUpdateButton.setAttribute('type',"button")
            editUpdateButton.setAttribute('role',"button")
            editUpdateButton.textContent = "Update Selected"
            editRow1Col3.appendChild(editUpdateButton)
            editUpdateButton.addEventListener("click", function () {
                //console.log("mediaCategorySelect.value = "+mediaCategorySelect.value)
                //console.log("mediaMenuSelect.value = "+mediaMenuSelect.value)
                //console.log("mediaPeopleList.value = "+mediaPeopleList.value)
                mediaAdminMessage.textContent = ""

                // update to selected objects in adminFileList
                for (let index in mediaInfo.fileList) {
                    let fi = mediaInfo.fileList[index]
                    if (fi.Selected) {
                        fi.Title = mediaDetailTitle.value
                        fi.TakenDateTime = mediaDetailTaken.value
                        fi.CategoryTags = mediaCategorySelect.value
                        mediaDetailCategoryTags.value = mediaCategorySelect.value
                        fi.MenuTags = mediaMenuSelect.value
                        mediaDetailMenuTags.value = mediaMenuSelect.value
                        fi.AlbumTags = mediaDetailAlbumTags.value
                        fi.People = mediaPeopleList.value
                        mediaDetailPeopleList.value = mediaPeopleList.value
                        fi.Description = mediaDetailDescription.value
                    }
                }
            });
        
            // Save
            let editSaveButton = document.createElement("button")
            //editSaveButton.id = "MediaAdminSaveButton"
            editSaveButton.classList.add('btn','btn-success','btn-sm','float-start','shadow-none','mt-3','me-2','mb-3')
            editSaveButton.setAttribute('type',"button")
            editSaveButton.setAttribute('role',"button")
            editSaveButton.textContent = "Save to DB"
            editRow1Col3.appendChild(editSaveButton)
            editSaveButton.addEventListener("click", function () {
                currIndex = 0
                updateMediaInfo()
            });

            // Category Tags
            mediaDetailCategoryTags = document.createElement("input")
            //mediaDetailCategoryTags.id = "MediaDetailCategoryTags"
            mediaDetailCategoryTags.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailCategoryTags.setAttribute('type', "text")
            mediaDetailCategoryTags.setAttribute('placeholder', "Category tags")
            mediaDetailCategoryTags.disabled = true
            editRow1Col3.appendChild(mediaDetailCategoryTags)

            // Menu Tags
            mediaDetailMenuTags = document.createElement("input")
            //mediaDetailMenuTags.id = "MediaDetailMenuTags"
            mediaDetailMenuTags.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailMenuTags.setAttribute('type', "text")
            mediaDetailMenuTags.setAttribute('placeholder', "Menu tags")
            mediaDetailMenuTags.disabled = true
            editRow1Col3.appendChild(mediaDetailMenuTags)

            // Album Tags
            mediaDetailAlbumTags = document.createElement("input")
            //mediaDetailAlbumTags.id = "MediaDetailAlbumTags"
            mediaDetailAlbumTags.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailAlbumTags.setAttribute('type', "text")
            mediaDetailAlbumTags.setAttribute('placeholder', "Album tags")
            editRow1Col3.appendChild(mediaDetailAlbumTags)

            // People List
            mediaDetailPeopleList = document.createElement("input")
            //mediaDetailPeopleList.id = "MediaDetailPeopleList"
            mediaDetailPeopleList.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailPeopleList.setAttribute('type', "text")
            mediaDetailPeopleList.setAttribute('placeholder', "People list")
            mediaDetailPeopleList.disabled = true  //<<<<<<<<<<<<<<<<<<<<<<<<<<<<
            editRow1Col3.appendChild(mediaDetailPeopleList)

            // Description
            mediaDetailDescription = document.createElement("textarea")
            //mediaDetailDescription.id = "MediaDetailDescription"
            mediaDetailDescription.classList.add('form-control','py-1','mb-1','shadow-none')
            mediaDetailDescription.setAttribute('rows', "6")
            mediaDetailDescription.setAttribute('placeholder', "Description")
            //mediaDetailDescription.value = fi.Description
            editRow1Col3.appendChild(mediaDetailDescription)

            // Admin Message
            mediaAdminMessage = document.createElement("div")
            mediaAdminMessage.id = "MediaAdminMessage"
            mediaAdminMessage.classList.add('float-start')
            mediaAdminMessage.textContent = "Number of images = " + (mediaInfo.fileList.length)
            editRow1Col3.appendChild(mediaAdminMessage)
            editRow1.appendChild(editRow1Col3)

            mediaPageContainer.appendChild(editRow1);

        } else {
            mediaPageContainer.appendChild(filterContainer);
            mediaPageContainer.appendChild(thumbnailContainer);
        }

        displayCurrFileList()
    }

    export function updateAdminMessage(displayMessage) {
        if (mediaAdminMessage != null) {
            mediaAdminMessage.textContent = displayMessage
        }
    }

    //------------------------------------------------------------------------------------------------------------
    // Create a collapsible menu from a directory structure
    //------------------------------------------------------------------------------------------------------------
    function buildFilterElements(mediaType) {
        empty(filterContainer)

        // Row 1
        let filterRow1 = document.createElement("div")
        filterRow1.classList.add('row','mt-2')
        let filterRow1Col1 = document.createElement("div")
        filterRow1Col1.classList.add('col-5')


        let menuButton = document.createElement("button")
        menuButton.classList.add('btn','btn-primary','btn-sm','float-start')
        menuButton.setAttribute('type',"button")
        menuButton.setAttribute('role',"button")
        menuButton.setAttribute('data-bs-toggle', "offcanvas")
        menuButton.setAttribute('data-bs-target', mediaMenuCanvasId)
        //menuButton.textContent = "Menu"
        let icon1 = document.createElement("i")
        icon1.classList.add('fa','fa-chevron-right')
        icon1.textContent = "Menu"
        menuButton.appendChild(icon1)
        filterRow1Col1.appendChild(menuButton)

        let menuButton2 = document.createElement("button")
        menuButton2.classList.add('btn','btn-success','btn-sm','ms-2','float-start')
        menuButton2.setAttribute('type',"button")
        menuButton2.setAttribute('role',"button")
        menuButton2.setAttribute('data-bs-toggle', "offcanvas")
        menuButton2.setAttribute('data-bs-target', mediaAlbumMenuCanvasId)
        //menuButton2.textContent = "Menu"
        let iconB = document.createElement("i")
        iconB.classList.add('fa','fa-chevron-right')
        iconB.textContent = "Albums"
        menuButton2.appendChild(iconB)
        // Just display an Albums button for Photos for now (till I figure out Albums for the others)
        if (mediaType == 1) {
            filterRow1Col1.appendChild(menuButton2)
        }
       
        filterRow1.appendChild(filterRow1Col1)

        //-----------------------------------------------------------------------------
        let filterRow1Col2 = document.createElement("div")
        filterRow1Col2.classList.add('col')
        // Category
        mediaFilterCategory = document.createElement("select")
        mediaFilterCategory.classList.add('form-select','float-start','shadow-none')
        let tempSelected = false
        for (let index in categoryList) {
            tempSelected = false
            if (queryCategory != null && queryCategory != "" && queryCategory != "DEFAULT") {
                if (categoryList[index] == queryCategory) {
                    tempSelected = true
                }
            } else {
                if (mediaType == 1) {
                    if (index == 1) {
                        tempSelected = true
                    }
                } else {
                    if (index == 0) {
                        tempSelected = true
                    }
                }
            }

            if (tempSelected) {
                mediaFilterCategory.options[mediaFilterCategory.options.length] = new Option(categoryList[index], categoryList[index], true, true)
            } else {
                mediaFilterCategory.options[mediaFilterCategory.options.length] = new Option(categoryList[index], categoryList[index])
            }
        }
        filterRow1Col2.appendChild(mediaFilterCategory);
        mediaFilterCategory.addEventListener("change", function () {
            executeFilter()
        });
        filterRow1.appendChild(filterRow1Col2)

        let filterRow1Col3 = document.createElement("div")
        filterRow1Col3.classList.add('col-1')
        filterRow1.appendChild(filterRow1Col3)

        //-----------------------------------------------------------------------------------------------------------------------------
        // Row 2
        let filterRow2 = document.createElement("div")
        filterRow2.classList.add('row','mt-2')
        let filterRow2Col1 = document.createElement("div")
        filterRow2Col1.classList.add('col-3','d-none','d-sm-block')

        let header2 = document.createElement("h5")
        if (contentDesc.length > 40) {
            header2 = document.createElement("h6")
        }
        //header2.textContent = mediaTypeDesc
        header2.textContent = contentDesc
        filterRow2Col1.appendChild(header2)
        filterRow2.appendChild(filterRow2Col1)

        let filterRow2Col2 = document.createElement("div")
        filterRow2Col2.classList.add('col')
        let tRow = document.createElement("div")
        tRow.classList.add('row')
        let tCol1 = document.createElement("div")
        tCol1.classList.add('col-5')
        mediaFilterStartDate = document.createElement("input")
        mediaFilterStartDate.classList.add('form-control','shadow-none')
        mediaFilterStartDate.setAttribute('type',"date")
        mediaFilterStartDate.value = mediaInfo.startDate
        tCol1.appendChild(mediaFilterStartDate);
        tRow.appendChild(tCol1)
        mediaFilterStartDate.addEventListener("change", function () {
            executeFilter()
        });

        let tCol2 = document.createElement("div")
        tCol2.classList.add('col-7')
        mediaFilterSearchStr = document.createElement("input")
        //mediaFilterSearchStr.id = "MediaFilterSearchStr"
        mediaFilterSearchStr.classList.add('form-control','shadow-none')
        mediaFilterSearchStr.setAttribute('type',"text")
        mediaFilterSearchStr.setAttribute('placeholder',"Search string")
        mediaFilterSearchStr.value = querySearchStr
        tCol2.appendChild(mediaFilterSearchStr);
        tRow.appendChild(tCol2)
        filterRow2Col2.appendChild(tRow)
        filterRow2.appendChild(filterRow2Col2)
        mediaFilterSearchStr.addEventListener("keypress", function(event) {
            // If the user presses the "Enter" key on the keyboard
            if (event.key === "Enter") {
                // Cancel the default action, if needed
                event.preventDefault();
                executeFilter()
            }
        });
    
        let filterRow2Col3 = document.createElement("div")
        filterRow2Col3.classList.add('col-2','d-none','d-sm-block')
        let header3 = document.createElement("h6")
        header3.classList.add('float-end')
        //header3.textContent = "(Edit Mode)"
        header3.textContent = ""   // >>>>>>>>>>>>>>>>>>>>>>> use if you need to display something <<<<<<<<<<<<<<<<<<<<<
        filterRow2Col3.appendChild(header3)
        filterRow2.appendChild(filterRow2Col3)

        // Add Rows to Filter Container
        filterContainer.appendChild(filterRow1);
        filterContainer.appendChild(filterRow2);
    }

    
    //===========================================================================================================
    // Display the current list image thumbnails in the thumbnail container (with appropriate class links)
    //===========================================================================================================
    export function displayCurrFileList() {
        let docFiles = false
        let audioFiles = false
        let doclistTbody = document.createElement("tbody")
        var playlistTbody = document.createElement("tbody")

        empty(thumbnailContainer)
        emptyPlaylist()
        let plIndex = 0

        let thumbnailRow1 = document.createElement("div")
        let thumbnailRow2 = document.createElement("div")
        let thumbnailRow3 = document.createElement("div")
        thumbnailRow1.classList.add('row')
        thumbnailRow2.classList.add('row')
        thumbnailRow2.classList.add('row')

        let thumbnailRow1Col1 = document.createElement("div")
        let thumbnailRow2Col1 = document.createElement("div")
        let thumbnailRow3Col1 = document.createElement("div")
        thumbnailRow1Col1.classList.add('col')
        thumbnailRow2Col1.classList.add('col','my-2')
        thumbnailRow3Col1.classList.add('col')


        //-------------------------------------------------------------------------------------------------------------------------
        // Loop through all the files in the current file list
        //-------------------------------------------------------------------------------------------------------------------------
        /*
        let maxRows = 200
        if (mediaType == 2) {
            maxRows = 12
        }
        */
        for (let index in mediaInfo.fileList) {
            let fi = mediaInfo.fileList[index]

            /*
            if (mediaType == 2) {
                if (index >= maxRows) {
                    continue
                }
            }
            */

            // Create a Card to hold the thumbnail of the media object
            let thumb = document.createElement("div")
            //thumb.classList.add('card','fs-6','w-20','float-start')
            thumb.classList.add('card','fs-6','vh-75','float-start')

            let titleMax = 25
            if (mediaType == 1) {
                titleMax = 12
            }

            if (editMode) {
                // If EditMode, add a checkbox to the thumb card
                let cardCheckboxDiv = document.createElement("div")
                cardCheckboxDiv.classList.add('form-check','mx-1','float-start','shadow-none')

                let cardCheckbox = document.createElement("input")
                //cardCheckbox.classList.add('form-check-input','mx-1','mb-1','float-end','shadow-none',thumbCheckboxClass)
                cardCheckbox.classList.add('form-check-input','shadow-none',thumbCheckboxClass)
                cardCheckbox.id = 'cb' + index
                cardCheckbox.setAttribute('type', 'checkbox')
                cardCheckbox.setAttribute('data-index', index)
                cardCheckbox.checked = fi.Selected
                cardCheckboxDiv.appendChild(cardCheckbox)

                let cbLabel = document.createElement("label")
                cbLabel.classList.add('form-check-label')
                cbLabel.setAttribute('for',cardCheckbox.id)
                if (fi.Title.length > titleMax) {
                    cbLabel.textContent = fi.Title.substring(0,titleMax)
                } else {
                    cbLabel.textContent = fi.Title
                }
                cardCheckboxDiv.appendChild(cbLabel)

                thumb.appendChild(cardCheckboxDiv)
            }
            
            //-------------------------------------------------------------------------------------------------------------------
            // Display thumbnail according to media type (and add event links for lightbox and edit)
            //-------------------------------------------------------------------------------------------------------------------
            if (mediaType == 1) {
                let img = document.createElement("img");
                // add a class for event click
                if (editMode) {
                    img.classList.add('rounded','float-start','m-1',imgThumbnailClass)
                } else {
                    img.classList.add('rounded','float-start','mt-2','me-2',imgThumbnailClass)
                }
                img.setAttribute('onerror', "this.onerror=null; this.remove()")
                //img.src = getFilePath(index,"Thumbs")
                img.src = getFilePath(index,"Smaller")
                img.setAttribute('data-index', index)
                img.height = 110

                // Make sure the 1st image is cached (for the lightbox display)
                if (index == 0) {
                    var imgCache = document.createElement('img')
                    imgCache.src = getFilePath(index,"Smaller")
                }

                if (editMode) {
                    thumb.appendChild(img)
                } else {
                    thumb = img
                }
                thumbnailRow2Col1.appendChild(thumb)

            } else if (mediaType == 2) {
                if (!editMode) {
                    let videoLabel = document.createElement("label")
                    videoLabel.classList.add('mx-1')
                    if (fi.Title.length > titleMax) {
                        videoLabel.textContent = fi.Title.substring(0,titleMax)
                    } else {
                        videoLabel.textContent = fi.Title
                    }
                    thumb.appendChild(videoLabel)
                }

                let iframe = document.createElement("iframe")
                iframe.classList.add('m-1')
                // Use the embed link for iframe (without https so it can be run locally for testing)
                iframe.setAttribute('src', "//www.youtube.com/embed/" + fi.Name)
                //iframe.setAttribute('src', "https://youtube.be/" + fi.Name)
                //youtu.be/
                iframe.setAttribute('allowfullscreen', true)

                iframe.style.width = "230px";
                iframe.style.height = "140px";

                thumb.appendChild(iframe)
                thumbnailRow2Col1.appendChild(thumb)

            } else if (mediaType == 3) {
                // MUSIC
                audioFiles = true;
                plIndex = incrementPlaylistIndex()
                addSongToPlaylist({ "title": getFileName(index), "url": getFilePath(index) })
                
                // add the table rows for the playlist
                // build a table then append to the thumbnail container
                let a = document.createElement("a")
                //a.href = "#"
                a.classList.add('class', `${playlistSongClass}`)
                a.setAttribute('data-plIndex', plIndex);
                a.textContent = getFileName(index)
                let td = document.createElement("td");
                td.appendChild(a);
                let tr = document.createElement("tr");
                tr.appendChild(td);
                playlistTbody.appendChild(tr)

            } else if (mediaType == 4) {
                // DOCS
                    
                //console.log("PDF file = " + fi.Name + ", filePath = " + filePath);
                docFiles = true
                let a = document.createElement("a")
                a.href = getFilePath(index)
                a.setAttribute('target',"_blank");
                a.textContent = getFileName(index)
                let td = document.createElement("td");
                td.appendChild(a);
                let tr = document.createElement("tr");
                tr.classList.add("smalltext")
                tr.appendChild(td);
                doclistTbody.appendChild(tr)
            }
        } //   for (let index in mediaInfo.fileList) {
        

        // if there were any docs, build a table of the filelinks and append to the Thumbnails container\
        if (docFiles) {
            empty(thumbnailRow2Col1);

            let table = document.createElement("table");
            table.classList.add('table','table-sm')
            table.appendChild(doclistTbody)
            thumbnailRow2Col1.appendChild(table)
        }
        else if (audioFiles) {
            empty(thumbnailRow2Col1);

                // if there were any MP3's, build a player with the playlist of MP3's
                let h5 = document.createElement("h5");
                h5.id = 'SongTitle'
                h5.classList.add('font-weight-bold')
                thumbnailRow2Col1.appendChild(h5)

                // Append the audioPlayer element
                thumbnailRow2Col1.appendChild(audioPlayer);

                let i = document.createElement("i");
                i.classList.add('fa',`${audioPrevClass}`,'fa-3x')
                let a = document.createElement("a")
                a.id = "AudioPrev"
                //a.href = "#"
                a.appendChild(i)
                thumbnailRow2Col1.appendChild(a)

                i = document.createElement("i");
                i.classList.add('fa',`${audioNextClass}`,'fa-3x','mx-2')
                a = document.createElement("a")
                a.id = "AudioNext"
                //a.href = "#"
                a.appendChild(i)
                thumbnailRow2Col1.appendChild(a)

            // append the tbody rows to the table, and the table to the Col1 (and thumbnail container)
            let playlistTable = document.createElement("table");
            playlistTable.id = 'PlaylistDisplay'
            playlistTable.classList.add('table', 'table-sm', 'mt-3')
            playlistTable.appendChild(playlistTbody)

            let row = document.createElement("div");
            row.id = 'PlaylistRow'
            row.classList.add('row')
            let col1 = document.createElement("div");
            col1.classList.add('col-sm-7')
            col1.appendChild(playlistTable)
            row.appendChild(col1)
 
            thumbnailRow2Col1.appendChild(row)
        }


        //----------------------------------------------------------------------------------------------------
        // If there is a filter request list, create Filter Request buttons with the start date
        //----------------------------------------------------------------------------------------------------
        let buttonMax = 20
        if (window.innerHeight > window.innerWidth) {
            buttonMax = 4
        }

        if (mediaInfo.filterList != null) {
            let buttonColor = 'btn-primary'
            for (let index in mediaInfo.filterList) {
                if (index > buttonMax) {
                    continue
                }
                let FilterRec = mediaInfo.filterList[index]

                buttonColor = 'btn-primary'
                if (FilterRec.filterName == 'Winter') {
                    buttonColor = 'btn-secondary'
                } else if (FilterRec.filterName == 'Spring') {
                    buttonColor = 'btn-success'
                } else if (FilterRec.filterName == 'Summer') {
                    buttonColor = 'btn-danger'
                } else if (FilterRec.filterName == 'Fall') {
                    buttonColor = 'btn-warning'
                }

                let button = document.createElement("button")
                button.setAttribute('type',"button")
                button.setAttribute('role',"button")
                button.setAttribute('data-MediaType', mediaType)
                button.setAttribute('data-category', mediaFilterCategory.value)
                button.setAttribute('data-startDate', FilterRec.startDate)
                button.setAttribute('data-menuItem', queryMenuItem)
                button.setAttribute('data-albumKey', queryAlbumKey)
                button.setAttribute('data-searchStr', querySearchStr)
                button.classList.add('btn',buttonColor,'btn-sm','shadow-none','me-2','my-2',MediaFilterRequestClass)
                button.textContent = FilterRec.filterName
                thumbnailRow1Col1.appendChild(button)

                // If too many thumbnails, duplicate button at the bottom
                if (mediaInfo.fileList.length > 50) {
                    let button2 = document.createElement("button")
                    button2.setAttribute('type',"button")
                    button2.setAttribute('role',"button")
                    button2.setAttribute('data-MediaType', mediaType)
                    button2.setAttribute('data-category', mediaFilterCategory.value)
                    button2.setAttribute('data-startDate', FilterRec.startDate)
                    button2.setAttribute('data-menuItem', queryMenuItem)
                    button2.setAttribute('data-albumKey', queryAlbumKey)
                    button2.setAttribute('data-searchStr', querySearchStr)
                    button2.classList.add('btn',buttonColor,'btn-sm','shadow-none','me-2','my-2',MediaFilterRequestClass)
                    button2.textContent = FilterRec.filterName
                    thumbnailRow3Col1.appendChild(button2)
                }
            }
            if (mediaType == 1 && mediaInfo.fileList.length > 50) {
                let buttonTop = document.createElement("button")
                buttonTop.setAttribute('type',"button")
                buttonTop.setAttribute('role',"button")
                buttonTop.classList.add('btn','btn-primary','btn-sm','shadow-none','me-2','my-2')
                buttonTop.textContent = "Top"
                thumbnailRow3Col1.appendChild(buttonTop)
                buttonTop.addEventListener("click", function () {
                    window.scrollTo(0, 0)
                });
            }
        }



        thumbnailRow1.appendChild(thumbnailRow1Col1)
        thumbnailRow2.appendChild(thumbnailRow2Col1)
        thumbnailRow3.appendChild(thumbnailRow3Col1)
        thumbnailContainer.appendChild(thumbnailRow1)
        thumbnailContainer.appendChild(thumbnailRow2)
        thumbnailContainer.appendChild(thumbnailRow3)
    }


    //-------------------------------------------------------------------------------------------------------
    // Display individual image for Edit mode
    //-------------------------------------------------------------------------------------------------------
    function displayFileDetail(index) {
        //console.log("index = "+index)
        currIndex = index
        
        // Get the correct image from the file list, and set the values of the screen components
        let fi = mediaInfo.fileList[index]

        mediaDetailFilename.textContent = fi.Name;
        mediaDetailTitle.value = fi.Title
        mediaDetailTaken.value = fi.TakenDateTime
        mediaDetailCategoryTags.value = fi.CategoryTags
        mediaDetailMenuTags.value = fi.MenuTags
        mediaDetailAlbumTags.value = fi.AlbumTags
        mediaDetailPeopleList.value = fi.People
        mediaDetailDescription.value = fi.Description

        // Set only the selected file in the thumbnail list
        for (let index2 in mediaInfo.fileList) {
            if (index2 == index) {
                mediaInfo.fileList[index2].Selected = true
            } else {
                mediaInfo.fileList[index2].Selected = false
            }
        }    
        
        // Re-display the file list to show the correct selected image
        displayCurrFileList()

        // Set the img src to get the smaller version of the image and display it on the screen
        mediaDetailImg.src = getFilePath(index,"Smaller")
    }

