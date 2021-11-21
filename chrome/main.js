// The backend API root. Contains all the necessary routes to handle retrieving video stats
const API_ROOT = "https://backend.nafdev.workers.dev/api";

// Tag names for elements that render in the YouTube DOM
const PRIMARY_VIDEO_CONTAINER = "ytd-watch-flexy";
const PRIMARY_VIDEO_INFO_TAG = "ytd-video-primary-info-renderer";
const MENU_RENDERER_TAG = "ytd-menu-renderer";
const TOP_LEVEL_BUTTONS_ID = "top-level-buttons-computed";
const FEEDBACK_BUTTONS_TAG = "ytd-toggle-button-renderer";
const YT_FORMATTED_STRING_TAG = "yt-formatted-string";

// Any element attributes we reference
const VIDEO_ID_ATTRIBUTE = "video-id";

const THOUSAND = 1000;
const MILLION = 1000000;
const BILLION = 1000000000;

const UNIT_K = "K";
const UNIT_M = "M";
const UNIT_B = "B";

// Holds the content for the main video layout
let primaryVideoContainer;
// Contains the primary video info. Title, views, date uploaded, buttons etc...
let primaryVideoInfo; 
// Contains the right-hand side menu (like, dislike, share buttons etc...)
let menuRenderer;
let buttonMenu;
// Contains the like and dislike buttons
let feedbackButtons;

// Dislike button DOM handles
let dislikeButton;
let dislikeButtonTextContainer;

// For a loaded page, this will observe DOM changes to the video player.
let videoContainerObserver;

const likeDislikeBar = document.createElement("div");
likeDislikeBar.style = "position: absolute; bottom: -4px; width: 150px; height: 3px; background-color: #606060;";
likeDislikeBar.id = "yt-dislike-button-ratio"
const likeRatio = document.createElement("div");
likeRatio.style = "width: 50%; height: 3px; background-color: #919191;"
likeDislikeBar.appendChild(likeRatio);

function getVideoStats(id) {
    const headers = new Headers({
        "Accept": "application/json"
    });
    const request = new Request(
        `${API_ROOT}/videos?video=${id}`,
        {
            method: "GET",
            headers: headers,
            mode: "cors",
            cache: "default"
        }
    );
    return new Promise((resolve, reject) => {
        fetch(request)
            .then(response => response.json())
            .then(response => {
                resolve(response);
            })
            .catch(err => {
                reject(err);
            });
    });
}

// Formats the dislike number in the same way that YouTube would display it.
function formatDislikeCount(dislikes) {
    let adjustedCount = dislikes;
    let formattedDislike = dislikes.toString();
    
    // Format the numeric value, and produce the strings
    if (dislikes >= THOUSAND && dislikes < 100 * THOUSAND) {
        adjustedCount = (dislikes / THOUSAND).toFixed(1);
        formattedDislike = adjustedCount.toString() + UNIT_K;
    } else if (dislikes >= 100 * THOUSAND && dislikes < MILLION) {
        adjustedCount = Math.trunc(dislikes / THOUSAND);
        formattedDislike = adjustedCount.toString() + UNIT_K;
    } else if (dislikes >= MILLION && dislikes < 10 * MILLION) {
        adjustedCount = (dislikes / MILLION).toFixed(1);
        formattedDislike = adjustedCount.toString() + UNIT_M;
    } else if (dislikes >= 10 * MILLION && dislikes < BILLION) {
        adjustedCount = Math.trunc(dislikes / MILLION)
        formattedDislike = adjustedCount.toString() + UNIT_M;
    } else if (dislikes >= BILLION) {
        adjustedCount = (dislikes / BILLION).toFixed(1);
        formattedDislike = adjustedCount.toString() + UNIT_B;
    }

    const firstNumberAfterDecimalIndex = formattedDislike.length - 2;
    // Clean up a zero after the decimal. We want to display 1K not 1.0K.
    if (formattedDislike.includes(".") && formattedDislike[firstNumberAfterDecimalIndex] === "0") {
        formattedDislike.replaceAt(firstNumberAfterDecimalIndex, '');
    }

    return formattedDislike;
}

// Updates the inserted like/dislike ratio in the DOM
function updateLikeDislikeRatio(likes, dislikes) {
    // Update the bar width
    const likeButtonRef = feedbackButtons[0];
    const dislikeButtonRef = feedbackButtons[1];
    likeDislikeBar.style.width = likeButtonRef.offsetWidth + dislikeButtonRef.offsetWidth + 10 + "px";
    // Now update the ratio bar ratio
    const likeDislikeRatioPercent = ((likes/(likes+dislikes))*100).toFixed(1);
    likeRatio.style.width = likeDislikeRatioPercent + "%";
}

// Updates the dislike count in the DOM. To call this function, first make sure
// the handles to all DOM elements are set.
async function updateDislikeCount() {
    // Get the id for the video the user is watching
    const videoId = primaryVideoContainer.getAttribute(VIDEO_ID_ATTRIBUTE);
    
    // Try to get the video from YouTube's API, and set the count
    try {
        const videoStats = await getVideoStats(videoId);
        const { error, dislikes, likes } = videoStats;
        const parsedLikes = parseInt(likes);
        const parsedDislikes = parseInt(dislikes);
        // Make sure only one video is returned
        if (!error) {
            dislikeButtonTextContainer.innerHTML = formatDislikeCount(parsedDislikes);
            updateLikeDislikeRatio(parsedLikes, parsedDislikes);
        } else {
            console.error(`YouTube API returned no results for video with id=${videoId}`);
        }
    } catch (error) {
        console.error(error);
    }
}

// Set references to any elements that matter to us in the DOM. We may use these
// to watch for mutations, or update them further.
function setDOMHandles() {
    primaryVideoInfo = document.getElementsByTagName(PRIMARY_VIDEO_INFO_TAG)[0];
    menuRenderer = primaryVideoInfo.getElementsByTagName(MENU_RENDERER_TAG)[0];
    buttonMenu = menuRenderer.querySelector(`#${TOP_LEVEL_BUTTONS_ID}`);
    feedbackButtons = menuRenderer.getElementsByTagName(FEEDBACK_BUTTONS_TAG);

    dislikeButton = feedbackButtons[1];
    dislikeButtonTextContainer = dislikeButton.getElementsByTagName(YT_FORMATTED_STRING_TAG)[0];

    // Set the ratio bar
    menuRenderer.insertBefore(likeDislikeBar, menuRenderer.firstElementChild);

    // If we previously attatched a mutation observer to the dislike button, we
    // should free it before recreating.
    if (videoContainerObserver) {
        videoContainerObserver.disconnect();
    }

    primaryVideoContainer = document.getElementsByTagName(PRIMARY_VIDEO_CONTAINER)[0];
    // Add an observer which triggers whenever the attributes on the primary
    // video container changes.
    videoContainerObserver = new MutationObserver(function(mutationsList) {
        mutationsList.forEach(mutation => {
            if (mutation.attributeName == VIDEO_ID_ATTRIBUTE) {
                updateDislikeCount();
            }    
        })
    });
    // We only care about the video id attribute changing. It tells us we need
    // to update the dislike count.
    videoContainerObserver.observe(primaryVideoContainer, { attributes: true });
}

// Find when the video DOM elements we're looking for appear. This works a bit
// better than a MutationObserver because we don't rely on the MutationObserver
// calling observe() before the elements we're looking for are updated in the
// DOM.
const domLoadInterval = setInterval(() => {
    primaryVideoInfo = document.getElementsByTagName(PRIMARY_VIDEO_INFO_TAG)[0];
    menuRenderer = primaryVideoInfo && primaryVideoInfo.getElementsByTagName(MENU_RENDERER_TAG)[0];
    feedbackButtons = menuRenderer && menuRenderer.getElementsByTagName(FEEDBACK_BUTTONS_TAG);
    if (feedbackButtons) {
        setDOMHandles();
        updateDislikeCount();
        clearInterval(domLoadInterval);
    }
}, 250);
