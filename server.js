import { config } from 'dotenv';
config();

import express from 'express';
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import open from 'open';
import bodyParser from 'body-parser';
import { error } from 'console';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;



const server = app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    open(`http://localhost:${port}`)
});

app.get('/day/:date', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// To be able to read dates
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

// Endpoint to list dates from the archive folder
app.get('/dates', (req, res) => {
    const archivePath = path.join(__dirname, 'public', 'archive', 'json');
    fs.readdir(archivePath, (err, files) => {
        if (err) {
            console.error('Error finding files: ', err);
            res.status(500).send('Error fetching dates');
        } else {
            const dates = files.filter(file => file.endsWith('.json'))
                .map(file => file.replace('.json', ''));
            res.json(dates);
        }
    });
});


// Endpoint to get JSON data by date
app.get('/get-json/:date', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'archive', 'json', `${req.params.date}.json`);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`Failed to send file ${filePath}: ${err}`);
            res.status(404).send('File not found');
        }
    });
});

app.post('/shutdown', (req, res) => {
    res.send("Shutting down...");
    server.close(() => {
        console.log("Shutting down Express server.")
    });
});

// Endpoint to get today apod from NASA
app.get('/todays-apod', async (req, res) => {
    // close connection after response
    res.set('Connection', 'close');

    const apiKey = process.env.API_KEY;
    const filepath = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;

    try {
        const respons = await fetch(filepath);
        if (!respons.ok) {
            throw new Error(`API-call failed: ${respons.status}`)
        }

        const data = await respons.json();

        // Save data
        // First make paths
        const jsonDir = path.join(__dirname, 'public', 'archive', 'json');
        const imageDir = path.join(__dirname, 'public', 'archive', 'images');
        // Get date from json
        const date = data.date;

        // Make folders if not exist
        if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir, { recursive: true });
        if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

        // Make path for file
        const jsonPath = path.join(jsonDir, `${date}.json`);
        // Save it 
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

        let statusVar, imageUrl, extension, imagePath;

        if (data.media_type === 'image') {
            // Prioritice hd over normal
            imageUrl = data.hdurl || data.url;
            // Find the extension, remove a eventual query
            extension = imageUrl.split('.').pop().split('?')[0];
            // Construct filename with date plus extension
            imagePath = path.join(imageDir, `${date}.${extension}`);


            if (fs.existsSync(imagePath)) {
                statusVar = 'cached';
            } else {
                statusVar = 'downloaded';
                // Fetch image
                const imageRes = await fetch(imageUrl);
                if (!imageRes.ok) throw new Error('Failed to fetch image');

                // Save image
                const buffer = await imageRes.buffer();
                fs.writeFileSync(imagePath, buffer);

                console.log('SERVER: data from NASA:', data);   // printed in terminal
            }
        } else {
            statusVar = 'video';
        }

        const payload = {
            status: statusVar,
            date,
            ...(statusVar === 'cached' || statusVar === 'downloaded'
                ? { imagePath: `/archive/images/${date}.${extension}` }
                : { url: data.url }
            )
        };

        // sending
        res.json(payload);

    } catch (err) {
        console.error(err);
        res.status(500).send(`❌ Error: ${err.message}`);
    }

});

app.get('/search-results', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'search.html'));
});

app.get('/import', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'views', 'import.html'))
});

app.post('/import', async (req, res) => {
    const { startdate, enddate } = req.body;
    console.log(startdate);

    // Validate format
    const re = /^\d{4}-\d{2}-\d{2}$/
    if (!re.test(startdate) || !re.test(enddate)) {
        return res.status(400).json({ error: 'illegal date-format' });
    };

    const start = new Date(startdate), end = new Date(enddate);
    // Validate number of days
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return res.status(400).json({ error: 'End-date is before Start-date' });
    if (diffDays > 30) return res.status(400).json({ error: 'Interval exceeds 30 days' });

    // API Call
    // close connection after response
    res.set('Connection', 'close');

    const apiKey = process.env.API_KEY;
    const url_path = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&start_date=${encodeURIComponent(startdate)}&end_date=${encodeURIComponent(enddate)}`;

    // Make paths
    const jsonDir = path.join(__dirname, 'public', 'archive', 'json');
    const imageDir = path.join(__dirname, 'public', 'archive', 'images');

    try {
        const respons = await fetch(url_path);
        if (!respons.ok) {
            throw new Error(`API-call failed: ${respons.status}`)
        }

        // Make folders if not exist
        if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir, { recursive: true });
        if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

        const data = await respons.json();
        if (!Array.isArray(data)) {
            return (res.status(502).json({ error: 'Unexpected NASA response' }));
        }

        const results = [];
        let downloaded = 0, cached = 0, videos = 0, failed = 0;

        for (const current_data of data) {
            const current_date = current_data['date'];
            const current_json_path = path.join(jsonDir, `${current_date}.json`);
            // Save it 
            fs.writeFileSync(current_json_path, JSON.stringify(current_data, null, 2));

            let statusVar, imageUrl, extension, currentImagePath;


            if (current_data.media_type === 'image') {
                // Prioritice hd over normal
                imageUrl = current_data.hdurl || current_data.url;
                // Find the extension, remove a eventual query
                extension = imageUrl.split('.').pop().split('?')[0];
                // Construct filename with current_date plus extension
                currentImagePath = path.join(imageDir, `${current_date}.${extension}`);


                if (fs.existsSync(currentImagePath)) {
                    statusVar = 'cached';
                    cached += 1;
                } else {
                    statusVar = 'downloaded';
                    downloaded += 1;
                    // Fetch image
                    const imageRes = await fetch(imageUrl);
                    if (!imageRes.ok) {
                        failed += 1;
                        throw new Error('Failed to fetch image');
                    }

                    // Save image
                    const buffer = await imageRes.buffer();
                    fs.writeFileSync(currentImagePath, buffer);

                    console.log('SERVER: data from NASA:', current_data);   // printed in terminal
                }
            } else {
                statusVar = 'video';
                videos += 1;
            }

            results.push({
                date: current_date,
                media_type: current_data['media_type'],
                status: statusVar,
                ...(statusVar === 'video'
                    ? { url: current_data['url'] }
                    : { imagePath: `/archive/images/${current_date}.${extension}` }
                )
            });
        }
        return res.json({
            range: { start: startdate, end: enddate, days: results.length },
            stats: { downloaded, cached, videos, failed },
            results
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(`❌ Error: ${err.message}`);

    }
});

app.get('/api/search', async (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    try {
        const jsonDir = path.join(__dirname, 'public', 'archive', 'json');
        const files = await fsp.readdir(jsonDir);
        const results = [];

        for (const file of files.filter(f => f.endsWith('.json'))) {
            const content = await fsp.readFile(path.join(jsonDir, file), 'utf-8');
            const data = JSON.parse(content);

            if (
                data.explanation.toLowerCase().includes(q) ||
                data.title.toLowerCase().includes(q)
            ) {
                results.push({
                    date: data.date,
                    title: data.title,
                    explanation: data.explanation,
                    media_type: data.media_type,
                    url: data.url,
                    hdurl: data.hdurl
                });
            }
        }

        res.json(results);
    } catch (err) {
        console.error("Error in /api/search:", err);
        res.status(500).send("Server error");
    }
});


app.get('/api/image-list', (req, res) => {
    const imagePath = path.join(__dirname, 'public', 'archive', 'images');
    fs.readdir(imagePath, (err, files) => {
        if (err) {
            console.log("Error fetching images: " + err);
            res.status(500).send("Error reading images");
        } else {
            const images = files.filter(file => /\.(jpg|jpeg|png)$/i.test(file) && !file.startsWith('.')
            );
            res.json(images);
        }
    });
});

app.get('/api/url-list', async (req, res) => {
    try {
        const jsonDir = path.join(__dirname, 'public', 'archive', 'json');
        const files = await fsp.readdir(jsonDir);

        const urls = [];

        for (const file of files.filter(f => f.endsWith('json'))) {
            const fullPath = path.join(jsonDir, file);
            const content = await fsp.readFile(fullPath, 'utf-8');
            const data = JSON.parse(content);

            if (data.media_type === 'video') {
                const url = data.url;

                urls.push(
                    {
                        filename: file,
                        url: url
                    }
                );
            }
        }

        res.json(urls);

    } catch (err) {
        console.error("Error in url list: ", err);
        res.status(500).send("Error while reading json archive");
    }
});

app.get('/explanation-list', async (req, res) => {
    try {
        const jsonDir = path.join(__dirname, 'public', 'archive', 'json');
        const files = await fsp.readdir(jsonDir);

        const explanations = [];

        for (const file of files.filter(f => f.endsWith('json'))) {
            const fullPath = path.join(jsonDir, file);
            const content = await fsp.readFile(fullPath, 'utf-8');
            const data = JSON.parse(content);
            const explanation = data.explanation;


            explanations.push(
                {
                    filemame: file,
                    explanation: explanation
                }
            );

        }

        res.json(explanations);

    } catch (err) {
        console.error("Error in url list: ", err);
        res.status(500).send("Error while reading json archive");
    }
});