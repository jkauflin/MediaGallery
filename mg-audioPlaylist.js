/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved.
--------------------------------------------------------------------------------
DESCRIPTION:
--------------------------------------------------------------------------------
Modification History
2023-09-08 JJK  Initial version - moved audio playlist components to this module
================================================================================*/
import {mediaInfo,mediaType,mediaTypeDesc,setMediaType,
    getFilePath,getFileName
} from './mg-DataRepository.js?ver=2.000'

import {empty} from './mg-CreatePages.js?ver=2.000'

export const playlistSongClass = "playlistSong"
export const audioPrevClass = "fa-step-backward"
export const audioNextClass = "fa-step-forward"

// Playlist array and index (for audio player/playlist diaplay)
var playlist = []
var plIndex = 0

// Create an HTML5 audio element in the DOM
export var audioPlayer = document.createElement('audio')
audioPlayer.setAttribute('controls', true)
audioPlayer.setAttribute('id', 'AudioPlayer')
audioPlayer.setAttribute('style', 'transform: scale(1.1);filter: drop-shadow(2px 3px 3px #333); ')
audioPlayer.style.border = '0'
audioPlayer.style.outline = '0'
//audioPlayer.style.padding = '13px 30px 0 10px'
//audioPlayer.style.padding = '13px 30px 40px 10px'
//audioPlayer.style.margin = '0'
audioPlayer.style.padding = '13px 20px 0 0'
audioPlayer.style.margin = '0 15px 0 10px'

// Add event listeners to the audio player
// When a song ends, see if there is a next one to play
audioPlayer.addEventListener("ended", function () {
    nextSong();
}, true);

export function setAudioListeners(listenContainer) {
    listenContainer.addEventListener("click", function (event) {
        //console.log("thumbnailContainer click, classList = "+event.target.classList)
        if (event.target && event.target.classList.contains(audioNextClass)) {
            nextSong();
        } else if (event.target && event.target.classList.contains(audioPrevClass)) {
            prevSong();
        } else if (event.target && event.target.classList.contains(playlistSongClass)) {
            let tempAttr = event.target.getAttribute('data-plIndex');
            if (typeof tempAttr !== "undefined" && tempAttr !== null) {
                loadSong(tempAttr);
            }
        }
    })
}

export function emptyPlaylist() {
    playlist.length = 0
    plIndex = -1
}

export function incrementPlaylistIndex() {
    plIndex++
    return plIndex
}

export function addSongToPlaylist(song) {
    playlist.push(song)
}



    // Audio 
    function loadSong(index) {
        plIndex = index;
        let songTitle = document.getElementById("SongTitle");
        songTitle.textContent = playlist[plIndex].title;
        audioPlayer.setAttribute('src', playlist[plIndex].url);
        audioPlayer.pause();
        audioPlayer.load();//suspends and restores all audio element
        //console.log("loaded audio, plIndex = "+plIndex);
        audioPlayer.oncanplaythrough = audioPlayer.play();
    } // function loadSong(index) {

    function nextSong() {
        if (playlist != null) {
            if (plIndex < playlist.length - 1) {
                loadSong(++plIndex);
            }
        }
    }
    function prevSong() {
        if (plIndex > 0) {
            loadSong(--plIndex);
        }
    }

