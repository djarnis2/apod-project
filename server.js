import { config } from 'dotenv';
config();

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import open from 'open';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const server = app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
    open(`http://localhost:${port}`)
});

// Serve static files from the 'public' directory
app.use(express.static('public'));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
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
        if (!fs.existsSync(jsonDir)) fs.mkdirSync(jsonDir, {recursive: true});
        if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, {recursive: true});

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

})

