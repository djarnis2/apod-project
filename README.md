To fetch images from NASA add api key as API_KEY=<your-api-key-here> in .env file in root folder
You can get an api key here: https://api.nasa.gov/
You need npm ('npm install')
Use 'npm start' to run app

Example on a script to automate:

@echo off
cd <your project folder>
call npm start
echo opening browser...
timeout /t 3
start http://localhost:3000
