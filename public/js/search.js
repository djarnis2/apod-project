window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';

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

    items.forEach(data => {
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

            // Klik‐event: åbn modal
            img.addEventListener('click', () => {
                modalImage.src = img.src;
                modal.style.display = 'flex';
            });

            card.appendChild(img);
        } else {
            const div = document.createElement('div');
            div.style.fontSize = '4rem';
            div.style.textAlign = 'center';
            const a = document.createElement('a');
            a.href = data.url;
            a.target = '_blank';
            a.textContent = '🎥';
            a.alt = 'Watch Video';
            div.appendChild(a);
            card.appendChild(div);
        }

        const desc = document.createElement('p');
        desc.textContent = data.explanation.slice(0, 100) + '...';
        desc.style.cursor = 'pointer';

        let expanded = false;
        desc.addEventListener('click', () => {
            expanded = !expanded;
            desc.textContent = expanded
            ? data.explanation 
            : data.explanation.slice(0, 100) + '...';
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
    window.location.href = `/search-results?q=${encodeURIComponent(query)}`;
});



// Close modal when on clicking the window
modal.addEventListener('click', () => {
    modal.style.display = 'none';
});







