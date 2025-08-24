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


### Download APODs with python script
Run download_apods.py with the flags -s  for start_date and -e for end_date to get more Apods to choose between.
Default is start_date = 2025-08-22 and end_date = 2025-08-24 if you run without flags.

* First install requirements
```bash
pip install -r requirements.txt
```
* Example:
```bash
python download_apods.py -s 2025-08-20 -e 2025-08-24
```


