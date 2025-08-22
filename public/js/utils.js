let dates = [];
let currentIndex = 0;

function getFormattedTodayDate() {
    return sessionStorage.getItem('todays-date') || new Date().toISOString().slice(0,10);
}



export function setDates(newDates) {
    dates = newDates;
    currentIndex = dates.indexOf(getFormattedTodayDate());
}

export function setCurrentByDate(dateStr) {
    const idx = dates.indexOf(dateStr);
    if (idx >= 0) {
        currentIndex = idx;
    }
}

export function setCurrentIndex(idx) {
    if (!Number.isFinite(idx)) return;
    // find max value for index
    const max = dates.length ?  dates.length - 1 : 0;
    // Ensure index is in valid interval
    currentIndex = Math.max(0, Math.min(max, idx));
    return currentIndex;
}


export function goToToday() {
    currentIndex = dates.indexOf(getFormattedTodayDate());
    fetchAndDisplay();
}

export function goToNext() {
    if (currentIndex < dates.length - 1) {
        currentIndex++;
        fetchAndDisplay();
    }
}

export function goToPrevious() {
    if (currentIndex > 0) {
        currentIndex--;
        fetchAndDisplay();
    }
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
        imageElement.title = 'Click to Enlarge'

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

    if (!nextButton || !prevButton) return;

    // Read all dates in the full set (so we don't use the subset)
    let allDates = [];
    try {
        allDates = JSON.parse(sessionStorage.getItem('allDates') || '[]');
    } catch {
        allDates = [];
    }

    // Get current date
    const cur = sessionStorage.getItem('currentDate');

    // Set current index relative to full set
    const pos = allDates.indexOf(cur);

    // No data? show both buttons
    if (pos === -1) {
        nextButton.classList.remove('invisible');
        prevButton.classList.remove('invisible');
        return;
    }

    // Handle visibility for "Previous" button
    
    if (pos <= 0) {
        prevButton.classList.add('invisible');
    } else {
        prevButton.classList.remove('invisible');
    }

    // Handle visibility for "Next" button
    if (pos >= (allDates.length - 1)) {
        nextButton.classList.add('invisible');
    } else {
        nextButton.classList.remove('invisible');
    }

    // finally if we are at todays date set Next to invisible

    if (cur == sessionStorage.getItem('todays-date')) {
        nextButton.classList.add('invisible');
    }
}


export function fetchAndDisplay(selectedDate = null) {

    if (!selectedDate && (!dates.length || currentIndex < 0 || currentIndex >= dates.length)) {
        console.error('No active date to fetch (dates/currentIndex invalid');
        return;
    }

    const date = selectedDate ?? dates[currentIndex];
    if (!date) {
        console.error('No date resolved for fetchAndDisplay')
    }
    try {
        sessionStorage.setItem('currentDate', date)
    } catch (e) {
        console.log(e);
    }

    fetch(`/get-json/${date}`)
        .then(response => response.json())
        .then((data) => {
            updateContent(data);
            updateButtons(); // Update button visibility

        })
        .catch(error => console.error('Error loading the APOD data:', error));

}

