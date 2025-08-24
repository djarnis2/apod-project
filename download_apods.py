import os
from dotenv import load_dotenv
import requests
import json
from urllib.parse import urlparse
import sys
import argparse

load_dotenv()

api_key = os.environ.get('API_KEY')
if not api_key:
    raise ValueError("API key not found. Please set the NASA_API_KEY environment variable.")

parser = argparse.ArgumentParser(description='Download APOD for a date range')
parser.add_argument("--start", "-s", default="2025-08-22", help="Start date (YYYY-MM-DD)")
parser.add_argument("--end", "-e", default="2025-08-24", help="End date (YYYY-MM-DD)")
args = parser.parse_args()
start_date, end_date = args.start, args.end

cur_dir = (os.getcwd())
url = f"https://api.nasa.gov/planetary/apod?api_key={api_key}&start_date={start_date}&end_date={end_date}"

# Make paths for data and images if not exist

json_path = os.path.join(cur_dir, 'public', 'archive', 'json')
image_path = os.path.join(cur_dir, 'public', 'archive', 'images')

os.makedirs(json_path, exist_ok=True)
os.makedirs(image_path, exist_ok=True)

try:
    response = requests.get(url)
    # ensure status is 200
    response.raise_for_status()
    data = response.json()
    for item in data:
        print(f"{item['date']}:")

        # image
        image_extension = os.path.splitext(urlparse(item['url']).path)[1].lower()
        current_image_path = os.path.join(image_path, item['date']) + image_extension
        if item['media_type'] == 'image' and (image_extension == '.jpg' or image_extension == '.png' or image_extension =='.jpeg' or image_extension =='.gif'):
            img_url = item.get('hdurl') or item.get('url')
            if os.path.exists(current_image_path):
                print(" - image exists")
            else:
                with requests.get(img_url, stream=True, timeout=60) as img_response:
                    img_response.raise_for_status()
                    with open(current_image_path, 'wb') as f:
                        for chunk in img_response.iter_content(chunk_size=8192):
                            if chunk:
                                f.write(chunk)
                    print(" - image is saved.")
        # json
        current_json_path = os.path.join(json_path, item['date']) + '.json'
        if os.path.exists(current_json_path):
            print(" - json exist")
            
        else:
            with open(current_json_path, 'w', encoding='utf-8') as f:
                json.dump(item, f, ensure_ascii=False, indent=2)
                print(" - json is saved.")
except:
    print('Failed to get url')
