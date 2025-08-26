const form = document.querySelector('.import-form form');
const box = document.getElementById('import-result');
const apods = document.getElementById('import-apods');

function showResults(items) {
    for (const item of items) {
        const div1 = document.createElement('div');
        const p1 = document.createElement('p');
        const div2 = document.createElement('div');
        const p2 = document.createElement('p');
        const div3 = document.createElement('div');
        const p3 = document.createElement('p');

        p1.innerHTML = `${item.date}`;
        p2.innerHTML = `${item.media_type}`;
        p3.innerHTML = `${item.status}`;

        div1.appendChild(p1);
        div2.appendChild(p2);
        div3.appendChild(p3);
        apods.appendChild(div1);
        apods.appendChild(div2);
        apods.appendChild(div3);

    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    box.classList.remove('invisible');


    const startdate = document.getElementById('startdate').value;
    const enddate = document.getElementById('enddate').value;

    console.log(startdate);

    box.textContent = '...importing';

    try {
        const res = await fetch('/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startdate, enddate })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            box.innerHTML = `<p style="color:#b00020;">Error: ${data.error || res.statusText}</p>`;
            return;
        }

        const stats = data.stats || {};
        const items = (data.results || [])
            .map(r => `<li>${r.date} — ${r.media_type} — <strong>${r.status}</strong></li>`)
            .join('');


        box.innerHTML = `
      <p><strong>Range:</strong> ${data.range.start} → ${data.range.end} (${data.range.days} days) - downloaded ${stats.downloaded || 0}, cached ${stats.cached || 0}, videos ${stats.videos || 0}, failed ${stats.failed || 0}</p>`;

        showResults(data.results);
    } catch (err) {
        box.innerHTML = `<p style="color:#b00020;">Uventet fejl: ${err.message}</p>`;
    }
});

const homeBtn = document.getElementById('home-btn');

homeBtn.addEventListener('click', () => {
    window.location.href = '/';
});

