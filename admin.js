/*==============================================================================
 * (C) Copyright 2023 John J Kauflin, All rights reserved.
 *----------------------------------------------------------------------------
 * DESCRIPTION:  
 * 
 *
 *----------------------------------------------------------------------------
 * Modification History
 * 2023-02-13 JJK   Initial version
 * 2023-04-05 JJK   Get MediaDetail working
 * 2023-04-11 JJK   Got initial version working to update NEW files
 *============================================================================*/
var mgallery = (function(){
    'use strict';  // Force declaration of variables before use (among other things)

    //=================================================================================================================
    // Private variables for the Module

    var isTouchDevice = 'ontouchstart' in document.documentElement
    var peopleList = null
    var adminFileList = []

    //console.log("window.location.pathname = "+window.location.pathname);
    var tempPath = window.location.pathname
    var strPos = tempPath.indexOf('/vendor/jkauflin')
    const webRootPath = tempPath.substring(0,strPos)
    
    // MediaRootDir is appended to the front of all URI paths (that limits the PHP work to files under Media as well)
    var MediaRootDir = webRootPath + "/Media/"
    var photosThumbsRoot = "PhotosThumbs"
    var photosSmallerRoot = "PhotosSmaller"
    //var jjkgalleryRoot = "vendor/jkauflin/jjkgallery/"
    var jjkgalleryRoot = ""     // blank if executing a PHP in the same folder as the admin page
    
    var mediaType = 0
    var currIndex = 0
    var imgThumbnailClass = "img-thumbnail"
    var imgCheckboxClass = "img-checkbox"


    //=================================================================================================================
    // Variables cached from the DOM

    var thumbnailContainer = document.getElementById("MediaThumbnails")
    var mediaCategorySelect = document.getElementById("MediaCategorySelect")
    var mediaMenuSelect = document.getElementById("MediaMenuSelect")
    var mediaPeopleInput = document.getElementById("MediaPeopleInput")
    var mediaPeopleSelect = document.getElementById("MediaPeopleSelect")

    var mediaAdminDetailContainer = document.getElementById("MediaAdminDetail")
    var mediaAdminDetailContainer2 = document.getElementById("MediaAdminDetail2")
    var mediaAdminMessage = document.getElementById("MediaAdminMessage")

    var mediaDetailPrevButton = document.getElementById("MediaDetailPrevButton")
    var mediaDetailNextButton = document.getElementById("MediaDetailNextButton")
    var mediaAdminGetNewButton = document.getElementById("MediaAdminGetNewButton")
    var mediaAdminSelectAllButton = document.getElementById("MediaAdminSelectAllButton")
    var mediaAdminReplacePeopleButton = document.getElementById("MediaAdminReplacePeopleButton")
    var mediaAdminAppendPeopleButton = document.getElementById("MediaAdminAppendPeopleButton")
    var mediaPeopleList = document.getElementById("MediaPeopleList")

    var mediaAdminUpdateButton = document.getElementById("MediaAdminUpdateButton")
    var mediaAdminSaveButton = document.getElementById("MediaAdminSaveButton")


    // Non-Printable characters - Hex 01 to 1F, and 7F
    var nonPrintableCharsStr = "[\x01-\x1F\x7F]"
    // "g" global so it does more than 1 substitution
    var regexNonPrintableChars = new RegExp(nonPrintableCharsStr, "g")
    function cleanStr(inStr) {
        return inStr.replace(regexNonPrintableChars, '')
    }

    // Keep track of the state of the navbar collapse (shown or hidden)
    var navbarCollapseShown = false;
    var collapsibleNavbar = document.getElementsByClassName("navbar-collapse")[0];
    collapsibleNavbar.addEventListener('hidden.bs.collapse', function () {
        navbarCollapseShown = false;
    })
    collapsibleNavbar.addEventListener('shown.bs.collapse', function () {
        navbarCollapseShown = true;
    })
    
    // Listen for nav-link clicks
    document.querySelectorAll("a.nav-link").forEach(el => el.addEventListener("click", function (event) {
        // Automatically hide the navbar collapse when an item link is clicked (and the collapse is currently shown)
        if (navbarCollapseShown) {
            new bootstrap.Collapse(document.getElementsByClassName("navbar-collapse")[0]).hide();
        }
    }));
    
        
    //=================================================================================================================
    // Bind events
    var jjkloginEventElement = document.getElementById("jjkloginEventElement")
    jjkloginEventElement.innerHTML = 'User not logged in'

    jjkloginEventElement.addEventListener('userJJKLoginAuth', function (event) {
        //userName = event.detail.userName
        //userLevel = event.detail.userLevel
        jjkloginEventElement.innerHTML = 'Logged in as ' + event.detail.userName

        // *** Build the nav and menu options dynamically after confirming user authentication ???
        // *** or just enable action buttons
        if (event.detail.userLevel >= 9) {
            console.log("Enable action butons")

            var buttons = document.getElementsByClassName("btn")
            for (let i = 0; i < buttons.length; i++) {
                buttons[i].disabled = false
            }
        }
    });

    mediaAdminSelectAllButton.addEventListener("click", function () {
        empty(mediaAdminDetailContainer)                
        empty(mediaAdminDetailContainer2)                
        currIndex = 0

        for (let index in adminFileList) {
            adminFileList[index].Selected = true
        }
        displayFileList()
    });

    // respond to click of thumbnail checkbox and set the value in the array to selected = true

    mediaDetailPrevButton.addEventListener("click", function () {
        if (currIndex > 0) {
            currIndex -= 1
            displayFileDetail(currIndex)
        }            
    });

    mediaDetailNextButton.addEventListener("click", function () {
        if (currIndex < adminFileList.length-1) {
            currIndex += 1
            displayFileDetail(currIndex)
        }            
    });

    //-------------------------------------------------------------------------------------------------------
    // Get the filtered list of files
    //-------------------------------------------------------------------------------------------------------
    mediaAdminGetNewButton.addEventListener("click", function () {
        //console.log("Click Get NEW, mediaType = " + mediaType)
        empty(thumbnailContainer);

        adminFileList = []

        let paramData = {MediaFilterMediaType: mediaType}
        let url = jjkgalleryRoot + "adminGetInfo.php"
        fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(paramData)
        })
        .then(response => response.json())
        .then(listInfo => {
            for (let index in listInfo.categoryList) {
                mediaCategorySelect.options[mediaCategorySelect.options.length] = new Option(listInfo.categoryList[index], listInfo.categoryList[index])
            }
            for (let index in listInfo.menuList) {
                let tempPos = listInfo.menuList[index].indexOf(' - ')
                mediaMenuSelect.options[mediaMenuSelect.options.length] = new Option(listInfo.menuList[index], listInfo.menuList[index].substring(tempPos+3))
            }
            peopleList = listInfo.peopleList
            for (let index in peopleList) {
                mediaPeopleSelect.options[mediaPeopleSelect.options.length] = new Option(peopleList[index], index)
            }

            let fileList = listInfo.fileList
            for (let index in fileList) {
                let fileRec = fileList[index]

                const fileInfo = {
                    Name: fileRec.filename,
                    DirSubPath: fileRec.dirSubPath,
                    Selected: false,
                    CategoryTags: fileRec.CategoryTags,
                    MenuTags: fileRec.MenuTags,
                    AlbumTags: fileRec.AlbumTags,
                    TakenDateTime: fileRec.TakenDateTime,
                    Title: fileRec.Title,
                    Description: fileRec.Description,
                    People: fileRec.People
                };
    
                // Add the file info objects to the main array
                adminFileList[adminFileList.length] = fileInfo
            }

            mediaAdminMessage.textContent = "Number of images = " + (adminFileList.length)
            displayFileList()
            displayFileDetail(0)            
            
        }); // End of Fetch AdminGetInfo

    });

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

    mediaAdminReplacePeopleButton.addEventListener("click", function () {
        mediaPeopleList.value = peopleList[mediaPeopleSelect.value]
    });
    /*
    mediaPeopleSelect.addEventListener("change", function () {
        console.log(">>> select value = "+peopleList[mediaPeopleSelect.value])
    });
    */
    mediaAdminAppendPeopleButton.addEventListener("click", function () {
        if (mediaPeopleList.value) {
            mediaPeopleList.value = mediaPeopleList.value + ',' + peopleList[mediaPeopleSelect.value]
        } else {
            mediaPeopleList.value = peopleList[mediaPeopleSelect.value]
        }
    });

    mediaAdminUpdateButton.addEventListener("click", function () {
        //console.log("mediaCategorySelect.value = "+mediaCategorySelect.value)
        //console.log("mediaMenuSelect.value = "+mediaMenuSelect.value)
        //console.log("mediaPeopleList.value = "+mediaPeopleList.value)
        mediaAdminMessage.textContent = ""

        let mediaDetailTitle = document.getElementById("MediaDetailTitle")
        let mediaDetailCategoryTags = document.getElementById("MediaDetailCategoryTags")
        let mediaDetailMenuTags = document.getElementById("MediaDetailMenuTags")
        let mediaDetailAlbumTags = document.getElementById("MediaDetailAlbumTags")
        let mediaDetailPeopleList = document.getElementById("MediaDetailPeopleList")
        let mediaDetailDescription = document.getElementById("MediaDetailDescription")

        // update to selected objects in adminFileList
        for (let index in adminFileList) {
            let fi = adminFileList[index]
            if (fi.Selected) {
                fi.Title = mediaDetailTitle.value
                fi.CategoryTags = mediaCategorySelect.value
                mediaDetailCategoryTags.value = fi.CategoryTags
                fi.MenuTags = mediaMenuSelect.value
                mediaDetailMenuTags.value = fi.MenuTags
                fi.AlbumTags = mediaDetailAlbumTags.value
                fi.People = mediaPeopleList.value
                mediaDetailPeopleList.value = fi.People
                fi.Description = mediaDetailDescription.value
            }
        }
    });
    
    mediaAdminSaveButton.addEventListener("click", function () {
        let paramData = {MediaFilterMediaType: mediaType,
                         adminFileList: adminFileList}

        let url = jjkgalleryRoot + "adminUpdateInfo.php"
        fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(paramData)
        })
        .then(response => response.text())
        .then(returnMsg => {
            //console.log("returnMsg = "+returnMsg)
            mediaAdminMessage.textContent = returnMsg

            empty(mediaAdminDetailContainer)                
            empty(mediaAdminDetailContainer2)                
            currIndex = 0

            // Filter out the Selected files (that were updated)
            adminFileList = adminFileList.filter(checkSelected);
            displayFileList()
            
        }); // End of Fetch

    });

    function checkSelected(fileInfo) {
        return !fileInfo.Selected
    }

    //-------------------------------------------------------------------------------------------------------------------
    // Listen for clicks in the MediaThumbnails container
    //-------------------------------------------------------------------------------------------------------------------
    thumbnailContainer.addEventListener("click", function (event) {
        event = event || window.event
        let target = event.target
        if (target.classList.contains(imgThumbnailClass)) {
            //console.log("Clicked on image thumbnail")
            let index = parseInt(target.getAttribute('data-index'))
            if (typeof index !== "undefined" && index !== null) {
                displayFileDetail(index)
            }
        } else if (target.classList.contains(imgCheckboxClass)) {
            //console.log("Clicked on image checkbox")
            let index = parseInt(target.getAttribute('data-index'))
            if (typeof index !== "undefined" && index !== null) {
                adminFileList[index].Selected = true
            }
        }
    });


    // Remove all child nodes from an element
    function empty(node) {
        // Could just set the innerHTML to null, but they say removing the children is faster
        // and better for removing any associated events
        //node.innerHTML = "";
        while (node.firstChild) {
            node.removeChild(node.firstChild)
        }
    }

    function displayFileList() {
        empty(thumbnailContainer);

        let fileSubPath = ''
        for (let index in adminFileList) {
            let fi = adminFileList[index]

            if (fi.DirSubPath != '') {
                fileSubPath = '/' + fi.DirSubPath + '/' + fi.Name;
            }
            else 
            {
                fileSubPath = '/' + fi.Name;
            }
            //console.log("filePath = " + filePath + ", fileSubPath = " + fileSubPath);

            let card = document.createElement("div")
            card.classList.add('card','w-20','float-start')
            /*
            let cardBody = document.createElement("div")
            cardBody.classList.add('card-body')
            let cardTitle = document.createElement("h6")
            cardTitle.classList.add('card-title')
            cardTitle.textContent = "Card title"
            cardBody.appendChild(cardTitle)
            */
            let cardCheckbox = document.createElement("input")
            cardCheckbox.classList.add('form-check-input','shadow-none','mx-1','mb-1',imgCheckboxClass)
            cardCheckbox.setAttribute('type', 'checkbox')
            cardCheckbox.setAttribute('data-index', index)
            cardCheckbox.checked = fi.Selected
            card.appendChild(cardCheckbox)
      
            // Add the photo to the gallery link list
            let img = document.createElement("img");
            img.classList.add(imgThumbnailClass)
            // add a class for event click
            img.setAttribute('onerror', "this.onerror=null; this.remove()")
            img.setAttribute('src', MediaRootDir + photosThumbsRoot + fileSubPath)
            img.setAttribute('data-index', index)
            card.appendChild(img)
            /*
            let a = document.createElement("a")
            //a.href = MediaRootDir + photosSmallerRoot + fileSubPath
            a.href = "#"
            a.title = fileRec.filename
            a.appendChild(img);
            */
      
            // data-index = index
      
            // 2 thing you can click:
            //    1 - the image to bring up detail info in Column 2
            //    2 - a "Selected" checkbox in the card
      
            // classes for each of these click choices
      
            //thumbnailContainer.appendChild(a)
            thumbnailContainer.appendChild(card)
        }
    }

    function displayFileDetail(index) {
        //console.log("index = "+index)
        currIndex = index
        empty(mediaAdminDetailContainer)                
        empty(mediaAdminDetailContainer2)                
        
        let fi = adminFileList[index]

        let mediaDetailFilename = document.createElement("div");
        mediaDetailFilename.textContent = fi.Name;
        mediaAdminDetailContainer.appendChild(mediaDetailFilename)

        let mediaDetailTitle = document.createElement("input");
        mediaDetailTitle.id = "MediaDetailTitle"
        mediaDetailTitle.classList.add('form-control','py-1','mb-1','shadow-none')
        mediaDetailTitle.setAttribute('type', "text")
        mediaDetailTitle.setAttribute('placeholder', "Title")
        mediaDetailTitle.value = fi.Title
        mediaAdminDetailContainer.appendChild(mediaDetailTitle)

        let mediaDetailTaken = document.createElement("input");
        mediaDetailTaken.classList.add('form-control','py-1','mb-1','shadow-none')
        mediaDetailTaken.setAttribute('type', "text")
        mediaDetailTaken.setAttribute('placeholder', "Taken DateTime")
        mediaDetailTaken.value = fi.TakenDateTime
        mediaAdminDetailContainer.appendChild(mediaDetailTaken)

        let fileSubPath = ''
        if (fi.DirSubPath != '') {
            fileSubPath = '/' + fi.DirSubPath + '/' + fi.Name;
        }
        else 
        {
            fileSubPath = '/' + fi.Name;
        }

        let img = document.createElement("img");
        img.classList.add('img-fluid','rounded','mx-auto','d-block')
        img.setAttribute('onerror', "this.onerror=null; this.remove()")
        img.setAttribute('src', MediaRootDir + photosSmallerRoot + fileSubPath)
        mediaAdminDetailContainer.appendChild(img)

        let mediaDetailCategoryTags = document.createElement("input");
        mediaDetailCategoryTags.id = "MediaDetailCategoryTags"
        mediaDetailCategoryTags.classList.add('form-control','py-1','mb-1','shadow-none')
        mediaDetailCategoryTags.setAttribute('type', "text")
        mediaDetailCategoryTags.setAttribute('placeholder', "Category tags")
        mediaDetailCategoryTags.value = fi.CategoryTags
        mediaDetailCategoryTags.disabled = true
        mediaAdminDetailContainer2.appendChild(mediaDetailCategoryTags)

        let mediaDetailMenuTags = document.createElement("input");
        mediaDetailMenuTags.id = "MediaDetailMenuTags"
        mediaDetailMenuTags.classList.add('form-control','py-1','mb-1','shadow-none')
        mediaDetailMenuTags.setAttribute('type', "text")
        mediaDetailMenuTags.setAttribute('placeholder', "Menu tags")
        mediaDetailMenuTags.value = fi.MenuTags
        mediaDetailMenuTags.disabled = true
        mediaAdminDetailContainer2.appendChild(mediaDetailMenuTags)

        let mediaDetailAlbumTags = document.createElement("input");
        mediaDetailAlbumTags.id = "MediaDetailAlbumTags"
        mediaDetailAlbumTags.classList.add('form-control','py-1','mb-1','shadow-none')
        mediaDetailAlbumTags.setAttribute('type', "text")
        mediaDetailAlbumTags.setAttribute('placeholder', "Album tags")
        mediaDetailAlbumTags.value = fi.AlbumTags
        mediaAdminDetailContainer2.appendChild(mediaDetailAlbumTags)

        let mediaDetailPeopleList = document.createElement("input");
        mediaDetailPeopleList.id = "MediaDetailPeopleList"
        mediaDetailPeopleList.classList.add('form-control','py-1','mb-1','shadow-none')
        mediaDetailPeopleList.setAttribute('type', "text")
        mediaDetailPeopleList.setAttribute('placeholder', "People list")
        mediaDetailPeopleList.value = fi.People
        mediaDetailPeopleList.disabled = true
        mediaAdminDetailContainer2.appendChild(mediaDetailPeopleList)

        let mediaDetailDescription = document.createElement("textarea");
        mediaDetailDescription.id = "MediaDetailDescription"
        mediaDetailDescription.classList.add('form-control','py-1','mb-1','shadow-none')
        mediaDetailDescription.setAttribute('rows', "6")
        mediaDetailDescription.setAttribute('placeholder', "Description")
        mediaDetailDescription.value = fi.Description
        mediaAdminDetailContainer2.appendChild(mediaDetailDescription)

        // Set only the selected file in the thumbnail list
        for (let index2 in adminFileList) {
            let fi2 = adminFileList[index2]
            if (index2 == index) {
                fi2.Selected = true
            } else {
                fi2.Selected = false
            }
        }
        displayFileList()
    }

    // This is what is exposed from this Module
    return {
    };
        
})(); // var mgallery = (function(){
