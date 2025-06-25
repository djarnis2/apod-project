const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
// Endpoint to list dates from the archive folder
app.get('/dates', (req, res) => {
    const archivePath = path.join(__dirname, 'public', 'archive');
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
    const filePath = path.join(__dirname, 'public', 'archive', `${req.params.date}.json`);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error(`Failed to send file ${filePath}: ${err}`);
            res.status(404).send('File not found');
        }
    });
});



app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
