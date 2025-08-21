import {
    fetchAndDisplay,
    setDates,
    goToToday,
    goToNext,
    goToPrevious,
    setCurrentByDate
} from "./utils.js";


async function init() {
    console.log('🔵 init startet');

    const loader = document.getElementById('apod-loader');
    loader.textContent = "🔄 Connecting to NASA...";
    loader.style.display = 'block';

    try {
        const updateRes = await fetch('/todays-apod');
        const updateData = await updateRes.json();
        if (updateData.status === 'downloaded') {
            loader.textContent = "📥 Fetching and saving the image...";
        } else if (updateData.status === 'cached') {
            loader.style.display = 'none'
        } else if (updateData.status === 'video') {
            loader.style.display = 'none'
        }
    }
    catch {
        console.error("Failed to load toadys image")
    }
    // Fetch all dates on initial load
    finally {
        setTimeout(() => {
            loader.style.display = 'none';
            fetchDates();

        }, 1000);
    }
}

// Back To Search Button

const backBtn = document.getElementById('back-to-search');
const hasQuery = !!localStorage.getItem('lastSearch');
const cameFromSearch = document.referrer.includes('/search-results');
const lastQuery = localStorage.getItem('lastSearch') || ''
const last_query_as_title = lastQuery.charAt(0).toUpperCase() + lastQuery.slice(1);




if (backBtn) {
    backBtn.textContent = `Back To Search: ${last_query_as_title}`;
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

const initialDate = getInitialDateFromUrl();

function fetchDates() {

    console.log("fetchDates called");
    fetch('/dates')
        .then(response => response.json())
        .then(data => {
            setDates(data);

            if (initialDate) {
                setCurrentByDate(initialDate);
                fetchAndDisplay(initialDate);
            } else {
                fetchAndDisplay();
            }
        })
        .catch(error => console.error('Error loading dates:', error));
}




document.getElementById('today').addEventListener('click', goToToday);
document.getElementById('prev').addEventListener('click', goToPrevious);
document.getElementById('next').addEventListener('click', goToNext);



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
});

// Close modal when on clicking the window
modal.addEventListener('click', () => {
    modal.style.display = 'none';
});

// window.addEventListener('unload', () => {
//     navigator.sendBeacon('/shutdown');
// });


init();




