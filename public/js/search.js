window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';
    if (query) {
        sessionStorage.setItem('lastSearch', query)
    }
    const query_as_title = query.charAt(0).toUpperCase() + query.slice(1);
    const search_page_title = document.getElementById('daysTitle');
    search_page_title.innerHTML = `Search: ${query_as_title}:`

    fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(results => displayCards(results))
        .catch(err => console.error(err));
});

// Pop-up vindue

// Get the modal, image, and close button
const modal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const images = document.querySelectorAll('.search-image');




function displayCards(items) {
    const container = document.getElementById('apod-cards');
    // container.innerHTML = "";
    const resultDates = items.map(it => it.date);
    sessionStorage.setItem('resultDates', JSON.stringify(resultDates));

    items.forEach((data, i) => {
        const card = document.createElement('div');
        card.className = 'card';


        if (data.media_type === 'image') {
            const ext = (data.hdurl || data.url).split('.').pop().split('?')[0];
            const img = document.createElement('img');
            img.className = 'search-image'
            const filename = `${data.date}.${ext}`
            img.src = `/archive/images/${filename}`;
            img.alt = data.title;
            img.style.cursor = 'pointer';
            img.title = 'Go To Apod Page'

            // Klik‐event: Go to Apod
            img.addEventListener('click', () => {  
                sessionStorage.setItem('resultIndex', String(i))
                window.location.href = `/day/${data.date}`;
            });

            card.appendChild(img);
        } else {
            const div = document.createElement('div');
            div.style.fontSize = '4rem';
            div.style.textAlign = 'center';
            const a = document.createElement('a');
            a.href = data.url;
            // In case media_type is other the API provides no url 
            // and a link is created here to nasa.gov instead using the date from the json
            if (data.media_type === 'other') {
                const [y, m, d] = data.date.split('-');
                console.log(y + m + d);
                const shortYear = y.slice(2);
                a.href = `https://apod.nasa.gov/apod/ap${shortYear}${m}${d}.html`;
            }
            a.target = '_blank';
            a.textContent = '🎥';
            a.alt = 'Watch Video';
            div.appendChild(a);
            card.appendChild(div);
        }

        const desc = document.createElement('p');
        desc.textContent = data.explanation.slice(0, 100) + '...';
        desc.style.cursor = 'pointer';
        desc.title = 'Go To Apod Page'

        let expanded = false;
        desc.addEventListener('click', () => {
            sessionStorage.setItem('resultIndex', String(i))
            window.location.href = `/day/${data.date}`;
        })
        card.appendChild(desc);

        container.appendChild(card);
    });
}

document.getElementById('searchBtn').addEventListener('click', () => {
    const query = document.getElementById('searchField').value.trim();
    if (!query) {
        return;
    }
    sessionStorage.setItem('lastSearch', query)
    window.location.href = `/search-results?q=${encodeURIComponent(query)}`;
});



// Close modal when on clicking the window
modal.addEventListener('click', () => {
    modal.style.display = 'none';
});







