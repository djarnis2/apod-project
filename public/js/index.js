
let dates = [];
let currentIndex = 0;

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

function fetchDates() {

    console.log("fetchDates called");
    fetch('/dates')
        .then(response => response.json())
        .then(data => {
            dates = data;
            // Optionally set currentIndex to today's index if it exists
            currentIndex = dates.indexOf(getFormattedTodayDate());
            fetchAndDisplay();
        })
        .catch(error => console.error('Error loading dates:', error));
}

function updateContent(data) {

    // remove old fallback links
    const oldFallback = document.getElementById('fallback');
    if (oldFallback) oldFallback.remove();

    // remove old videoLinks
    const oldVideoLink = document.getElementById('video-link');
    if (oldVideoLink) oldVideoLink.remove();

    const imageElement = document.getElementById('apodImage');
    const linkElement = document.getElementById('link');
    const descriptionElement = document.getElementById('apodDescription');
    const daysTitle = document.getElementById('daysTitle');

    // Prioritize hdurl over url
    const imageUrl = data.hdurl || data.url;
    const imageTitle = data.title;
    daysTitle.innerText = imageTitle;
    const descriptionHeader = document.getElementById('description-header');
    const dateString = data.date;
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    descriptionHeader.innerText = formattedDate;

    // For Videos from youtube
    const mediaContainer = document.querySelector('.image-panel');

    let iframe = document.querySelector('#videoIframe');


    // make iframe if not exist
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'videoIframe';
        // iframe.style.width = '100%';
        // iframe.style.height = '750px';
        iframe.style.display = 'none';
        mediaContainer.appendChild(iframe);
    }

    if (imageUrl && /\.(jpe?g|png|gif)$/i.test(imageUrl)) {
        // Display the image if the URL points to an image
        imageElement.style.display = 'block';
        linkElement.style.display = 'none';
        iframe.style.display = 'none';

        const extension = (data.hdurl || data.url).split('.').pop().split('?')[0];
        const imageUrlLocal = `/archive/images/${data.date}.${extension}`;

        imageElement.src = imageUrlLocal;

    } else if (imageUrl && (imageUrl.includes('youtube.com') || imageUrl.includes('youtu.be'))) {
        imageElement.style.display = 'none';
        linkElement.style.display = 'none';
        iframe.style.display = 'block';

        // const videoId = imageUrl.includes('youtu.be')
        // ? imageUrl.split('/').pop()
        // : new URL(imageUrl).searchParams.get('v');
        let videoId = null;

        if (data.url.includes('youtube.com/embed/')) {
            // Extract video ID from embed URL
            videoId = data.url.split('/embed/')[1].split('?')[0];
        } else if (data.url.includes('youtu.be/')) {
            // Extract video ID from shortened URL
            videoId = data.url.split('youtu.be/')[1];
        } else if (data.url.includes('youtube.com/watch')) {
            // Extract video ID from standard watch URL
            const urlParams = new URL(data.url).searchParams;
            videoId = urlParams.get('v');
        }

        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
        console.log(videoId);
        console.log(iframe.src);
        iframe.style.width = '100%';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        // Adjust iframe styling
        iframe.style.aspectRatio = '16 / 9';
        iframe.style.height = `${mediaContainer.offsetWidth * 9 / 16}px`; // Adjust based on aspect ratio

    } else if (!data.url && !data.hdurl && data.media_type === 'other') {
        imageElement.style.display = 'none';
        iframe.style.display = 'none';
        linkElement.style.display = 'none';

        // For fallback if no media provided with api

        const nasaDiv = document.createElement('div');
        const nasaLink = document.createElement('a');
        const p = document.createElement('p');
        nasaLink.id = 'nasa-link';
        nasaDiv.id = 'fallback';
        nasaLink.style.display = 'block';
        nasaLink.target = '_blank';
        nasaLink.rel = 'noopener noreferrer';
        nasaDiv.appendChild(p);
        nasaDiv.appendChild(nasaLink);

        mediaContainer.appendChild(nasaDiv);
        const [y, m, d] = data.date.split('-');
        const shortYear = y.slice(2);
        nasaLink.href = `https://apod.nasa.gov/apod/ap${shortYear}${m}${d}.html`;
        p.innerHTML = "API didnt supply image/video";
        nasaLink.innerHTML = "See it on nasa.gov";
    }

    else {
        // If it's not an image, display a link (e.g., for videos)
        imageElement.style.display = 'none';
        iframe.style.display = 'none';
        linkElement.style.display = 'block';

        const videoDiv = document.createElement('div');
        const videoLink = document.createElement('a');
        const p = document.createElement('p');
        videoDiv.id = 'video-link';
        videoLink.style.display = 'block';
        videoLink.target = '_blank';
        videoLink.rel = 'noopener noreferrer';
        p.innerText = "External Video Link";
        videoLink.innerText = "Watch";
        videoLink.href = data.url;
        videoDiv.appendChild(p);
        videoDiv.appendChild(videoLink);
        mediaContainer.appendChild(videoDiv);
    }



    descriptionElement.textContent = data.explanation;
}

function updateButtons() {
    const nextButton = document.getElementById('next');
    const prevButton = document.getElementById('prev');

    // Handle visibility for "Next" button
    if (currentIndex === dates.length - 1) {
        nextButton.classList.add('invisible'); // Hide but preserve space
    } else {
        nextButton.classList.remove('invisible'); // Show
    }

    // Handle visibility for "Previous" button (if needed)
    if (currentIndex === 0) {
        prevButton.classList.add('invisible'); // Optional: Hide "Previous" if on the first image
    } else {
        prevButton.classList.remove('invisible');
    }
}

function fetchAndDisplay() {

    if (dates.length > 0 && dates[currentIndex]) {
        const date = dates[currentIndex];
        fetch(`/get-json/${date}`)
            .then(response => response.json())
            .then((data) => {
                updateContent(data);
                updateButtons(); // Update button visibility

            })
            .catch(error => console.error('Error loading the APOD data:', error));
    }
}

function getFormattedTodayDate() {
    const today = new Date();
    return today.toISOString().slice(0, 10); // Formats date as "YYYY-MM-DD"
}


document.getElementById('today').addEventListener('click', () => {
    const todayDate = getFormattedTodayDate();
    currentIndex = dates.indexOf(todayDate);
    fetchAndDisplay();
});

document.getElementById('prev').addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        fetchAndDisplay();
    }
});

document.getElementById('next').addEventListener('click', () => {
    if (currentIndex < dates.length - 1) {
        currentIndex++;
        fetchAndDisplay();
    }
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
});

// Close modal when on clicking the window
modal.addEventListener('click', () => {
    modal.style.display = 'none';
});

// window.addEventListener('unload', () => {
//     navigator.sendBeacon('/shutdown');
// });


init();




