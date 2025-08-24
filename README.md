# The Apod Project

## Build a collection of APOD's (Astronomy Picture Of the Day)

*  The code will create two folders, one for your images and one for the json files with data.
 * Every day you log in the image and data of that day will be stored in your folders.
### Preparations
*  To fetch images from NASA you need your own api key and store it as API_KEY="your-api-key" in a .env file in root folder
*  You can get your api key here: [NASA](https://api.nasa.gov/)
*  First, clone the code in a folder, I used C:\Projects as example.
### Launch
*  To start, you need npm installed ('npm install')
*  Use 'npm start' to run the app.

### Automate with script
* Example on a script to automate launch:
```bash
@echo off
cd C:\Projects\apod-project
start cmd /k "npm start"
```


