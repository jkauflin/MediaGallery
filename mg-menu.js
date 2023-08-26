/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved.
--------------------------------------------------------------------------------
DESCRIPTION:
--------------------------------------------------------------------------------
Modification History
2023-08-26 JJK  Initial version - moved menu components to this module
================================================================================*/
import {empty,mediaInfo,mediaType,mediaTypeDesc,setMediaType,loadMediaInfo,
    getFilePath,getFileName
} from './mg-mediainfo.js'

export const MediaMenuRequestClass = "MediaMenuRequest"
export const mediaMenuCanvasId = "#MediaMenuCanvas"
var menuList = []
var mediaMenuCanvas = bootstrap.Offcanvas.getOrCreateInstance(mediaMenuCanvasId)

export function setMenuList(inMenuList) {
    menuList = inMenuList
}

export function hideMediaMenuCanvas() {
    mediaMenuCanvas.hide();
}

//------------------------------------------------------------------------------------------------------------
// Create a collapsible menu in an offcanvas pop-out using menu list data
//------------------------------------------------------------------------------------------------------------
export function buildMenuElements(mediaType) {
    let MediaOffcanvasMenuId = "MediaOffcanvasMenu"
    let menuContainer = document.getElementById(MediaOffcanvasMenuId)
    let mediaMenuCanvasLabel = document.getElementById("MediaMenuCanvasLabel")
    mediaMenuCanvasLabel.textContent = mediaTypeDesc + " Menu"

    if (menuContainer != null) {
        empty(menuContainer)

            let menuId = MediaOffcanvasMenuId
            let accordionId = menuId + "AccordianContainer";
            let accordianContainer = document.createElement("div")
            accordianContainer.id = accordionId
            accordianContainer.classList.add('accordion')
            accordianContainer.classList.add('accordion-flush')
    
            let itemId = ''
            let accordianItemHeader
            let accordianItem
            let accordianItemBody
            let accordianItemList
            let collapseState = false
            let collapseShow = false
    
            for (let index in menuList) {
                let menu = menuList[index]
    
                //menuHeader.textContent = mediaTypeDesc
    
                // Make the 1st panel item un-collapsed
                if (index == 0) {
                    collapseState = false
                    collapseShow = true
                } else {
                    collapseState = true
                    collapseShow = false
                }
    
                // Create the top level item
                accordianItem = document.createElement("div")
                accordianItem.classList.add('accordion-item')
    
                // Create the header for the item
                itemId = menuId + (index + 1)
                accordianItemHeader = document.createElement("h6")
                accordianItemHeader.classList.add('accordion-header')
    
                let button = document.createElement("button");
                button.classList.add('m-1','p-1','accordion-button','shadow-none')
                if (collapseState) {
                    button.classList.add('collapsed')
                }
                button.setAttribute('type',"button")
                button.setAttribute('role',"button")
                button.setAttribute('data-bs-toggle','collapse')
                button.setAttribute('data-bs-target','#' + itemId)
                button.textContent = menu.category;
                accordianItemHeader.appendChild(button)
    
                // Create the body for the item
                accordianItemBody = document.createElement("div")
                accordianItemBody.id = itemId
                accordianItemBody.classList.add('accordion-collapse','collapse')
                if (collapseShow) {
                    accordianItemBody.classList.add('show')
                }
                accordianItemBody.setAttribute('data-bs-parent', '#' + accordionId)
    
                // Create the list for the body
                accordianItemList = document.createElement("ul")
    
                // Add list entries
                for (let index2 in menu.subMenuList) {
                    //console.log("create menu,  filename = "+filename);
                    // Create a link for the media dir folder
                    let a = document.createElement("a")
                    a.setAttribute('href', "#")
                    a.setAttribute('data-MediaType', mediaType)
                    a.setAttribute('data-category', menu.category)
                    a.setAttribute('data-menuItem', menu.subMenuList[index2].menuItem)
                    a.setAttribute('data-startDate', menu.subMenuList[index2].startDate)
                    a.setAttribute('data-endDate', menu.subMenuList[index2].endDate)
                    a.setAttribute('data-searchStr', menu.subMenuList[index2].searchStr)
                    a.classList.add(MediaMenuRequestClass)
                    a.textContent = menu.subMenuList[index2].menuItem
                    let li = document.createElement('li')
                    li.appendChild(a)
                    accordianItemList.appendChild(li)
                }
    
                // Append the item list to the panel item, and the panel item to the menu
                accordianItemBody.appendChild(accordianItemList);
                accordianItem.appendChild(accordianItemHeader);
                accordianItem.appendChild(accordianItemBody);
                accordianContainer.appendChild(accordianItem);
            }    
    
        // Put the created accordian into the Menu DIV on the parent page
        menuContainer.appendChild(accordianContainer);
    }
}



