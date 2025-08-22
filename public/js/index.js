import {
    fetchAndDisplay,
    setDates,
    goToToday,
    goToNext,
    goToPrevious,
    setCurrentByDate,
    setCurrentIndex
} from "./utils.js";


let allDatesCache = [];
const backBtn = document.getElementById('back-to-search');
backBtn.title = 'View Search'
const searchPrevBtn = document.getElementById('search-previous');
searchPrevBtn.title = 'Previous Result'
const searchNextBtn = document.getElementById('search-next');
searchNextBtn.title = 'Next Result'
const hasQuery = !!sessionStorage.getItem('lastSearch');
const cameFromSearch = document.referrer.includes('/search-results');
const lastQuery = sessionStorage.getItem('lastSearch') || ''
const last_query_as_title = lastQuery.charAt(0).toUpperCase() + lastQuery.slice(1);
const subset = JSON.parse(sessionStorage.getItem('resultDates') || 'null');
const initialDate = getInitialDateFromUrl();
const savedIdx = parseInt(sessionStorage.getItem('resultIndex'), 10);
const usingSubset = Array.isArray(subset) && subset.length > 0;

async function init() {
    console.log('🔵 init startet');

    const loader = document.getElementById('apod-loader');
    if (loader) {
        loader.textContent = "🔄 Connecting to NASA...";
        loader.style.display = 'block';
    }


    try {
        const updateRes = await fetch('/todays-apod');
        const updateData = await updateRes.json();

        // Save date of Todays-apod
        if (updateRes && updateData) {
            sessionStorage.setItem('todays-date', updateData.date);
        }

        // Update/Hide loader
        if (updateData.status === 'downloaded') {
            if (loader) loader.textContent = "📥 Fetching and saving the image...";
        } else if (updateData.status === 'cached') {
            if (loader) loader.style.display = 'none';
        } else if (updateData.status === 'video') {
            if (loader) loader.style.display = 'none';
        }
    }
    catch {
        console.error("Failed to load toadys image")
    }
    // Fetch all dates on initial load
    finally {
        setTimeout(() => {
            if (loader) loader.style.display = 'none';
            if (usingSubset) {
                setDates(subset);
                if (searchNextBtn) {
                    searchNextBtn.hidden = false;
                }
                if (searchPrevBtn) {
                    searchPrevBtn.hidden = false;
                }
                
                searchNextBtn.onclick = (e) => {
                    e?.preventDefault();
                    
                    console.log('next btn was clicked');
                    console.log(sessionStorage.getItem('currentDate'));

                    // Load/Reload search results
                    setDates(subset);

                    // Find current date and index of page displayed in subset
                    const cur = sessionStorage.getItem('currentDate');
                    let i = subset.indexOf(cur);

                    // If date not present in subset, fallback to search page initially loaded
                    if (i < 0) {
                        const stored = parseInt(sessionStorage.getItem('resultIndex'), 10);
                        if (Number.isFinite(stored) && stored >= 0 && stored < subset.length) {
                            i = stored
                        } else {
                            i = 0 // last fallback
                        }
                    }

                    const newIdx = i >= subset.length -1 ? 0 : i +1;
                    const date = subset[newIdx];

                    // Keep in sync
                    setCurrentIndex(newIdx);
                    sessionStorage.setItem('resultIndex', String(newIdx));
                    fetchAndDisplay(date);
                }
                
                searchPrevBtn.onclick = (e) => {
                    e?.preventDefault();

                    console.log('prev btn was clicked');
                    console.log(sessionStorage.getItem('currentDate'));

                    // Load/Reload search results
                    setDates(subset);

                    // Find current date and index of page displayed in the subset
                    const cur = sessionStorage.getItem('currentDate');
                    let i = subset.indexOf(cur);

                    // If date not present in subset, fallback to search page initially loaded
                    if (i < 0) {
                        const stored = parseInt(sessionStorage.getItem('resultIndex'), 10);
                        if (Number.isFinite(stored) && stored >= 0 && stored < subset.length) {
                            i = stored;
                        } else {
                            i = 0; // last fallback
                        }
                    }

                    const newIdx = Math.max(0,i-1);
                    const date = subset[newIdx];
                    setCurrentIndex(newIdx);

                    // Keep in sync
                    sessionStorage.setItem('resultIndex', String(newIdx));
                    fetchAndDisplay(date);
                };

                const hasIdx = Number.isFinite(savedIdx) && savedIdx >= 0 && savedIdx < subset.length;
                const hasInit = initialDate && subset.includes(initialDate);
                const startDate = hasIdx ? subset[savedIdx] : (hasInit ? initialDate : subset[0]);

                if (hasIdx) {
                    setCurrentIndex(savedIdx)
                } else {
                    setCurrentByDate(startDate)
                }

                fetchAndDisplay(startDate);
            } else {
                if (searchPrevBtn) searchPrevBtn.hidden = true;
                if (searchNextBtn) searchNextBtn.hidden = true;
                fetchDates();
            }


        }, 1000);
    }
}



if (backBtn) {
    backBtn.textContent = `Search: ${last_query_as_title}`;
    backBtn.addEventListener('click', () => {
        if (lastQuery) {
            window.location.href = `/search-results?q=${encodeURIComponent(lastQuery)}`
        } else {
            window.location.href = '/search-results';
        }

    });

    if (!hasQuery && !cameFromSearch) {
        backBtn.style.display = 'none';
    }

}


function getInitialDateFromUrl() {
    const m = window.location.pathname.match(/^\/day\/(\d{4}-\d{2}-\d{2})$/);
    if (m) return m[1];
    const q = new URLSearchParams(window.location.search).get('date');
    return q || null;
}


function fetchDates() {

    console.log("fetchDates called");
    fetch('/dates')
        .then(response => response.json())
        .then(data => {
            allDatesCache = data;
            setDates(data);
            sessionStorage.setItem('allDates', JSON.stringify(data));

            if (initialDate) {
                setCurrentByDate(initialDate);
                fetchAndDisplay(initialDate);
            } else {
                fetchAndDisplay();
            }
        })
        .catch(error => console.error('Error loading dates:', error));
}


async function ensureAllDatesActive() {
    if (allDatesCache.length) return;
    const data = await (await fetch('/dates')).json();
    allDatesCache = data;
}

document.getElementById('today').addEventListener('click', async() => {
    await ensureAllDatesActive();
    const today = new Date().toISOString().slice(0,10);
    setDates(allDatesCache);
    setCurrentByDate(today);
    fetchAndDisplay(today);
})

document.getElementById('prev').addEventListener('click', async() => {
    await ensureAllDatesActive();
    const cur = sessionStorage.getItem('currentDate');
    const i = allDatesCache.indexOf(cur);
    const newIdx = Math.max(0, i - 1);
    const date = allDatesCache[newIdx];
    setDates(allDatesCache);
    setCurrentIndex(newIdx);
    fetchAndDisplay(date);
});

document.getElementById('next').addEventListener('click', async() => {
    await ensureAllDatesActive();
    const cur = sessionStorage.getItem('currentDate');
    const i = allDatesCache.indexOf(cur);
    const newIdx = Math.min(allDatesCache.length - 1, i + 1);
    const date = allDatesCache[newIdx];
    setDates(allDatesCache);
    setCurrentIndex(newIdx);
    fetchAndDisplay(date);
});



document.getElementById('searchBtn').addEventListener('click', () => {
    const query = document.getElementById('searchField').value.trim();
    if (!query) {
        return;
    }
    window.location.href = `/search-results?q=${encodeURIComponent(query)}`;
});


// Pop-up vindue

// Get the modal, image, and close button
const modal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const apodImage = document.getElementById('apodImage');

// Open modal when clicking the image
apodImage.addEventListener('click', () => {
    modal.style.display = 'block';
    modalImage.src = apodImage.src; // Set modal image source to clicked image
    modalImage.title = 'Click to Go Back'
});

// Close modal when on clicking the window
modal.addEventListener('click', () => {
    modal.style.display = 'none';
});

// window.addEventListener('unload', () => {
//     navigator.sendBeacon('/shutdown');
// });


init();




