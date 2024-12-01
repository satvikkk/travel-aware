import pandas as pd
import numpy as np
from flask import Flask, request, jsonify, render_template, send_from_directory
import requests
import folium
from geopy.distance import geodesic
import torch
from tqdm import tqdm
from datetime import datetime, timedelta
from flask_cors import CORS
from collections import Counter

app = Flask(__name__)
CORS(app)


MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoic2ViYXN0aWFuYWwiLCJhIjoiY20zZ2wxajlhMDVuejJrcHRxbjZqYjd1ZSJ9.UuDU367Lnq-1vP260Xjygg'
RISK_LEVELS = {
    'Theft': 6, 'Burglary': 7, 'Sexual Offenses': 9, 'Assault': 9, 'Homicide': 10, 'Robbery': 8,
    'Vandalism': 3, 'Trespassing': 2, 'Crimes Against Children': 8, 'Criminal Threats': 6,
    'Weapon Offenses': 8, 'Order Violations': 4, 'Lewd Letters and Calls': 3, 'Fraud': 2, 
    'Kidnapping': 9, 'Traffic Offenses': 4, 'Public Disorder': 4
}

# Load crime data
crime_data = pd.read_csv('Modified_Crime_Data_LA_with_categories.csv')
crime_data[['LAT', 'LON']] = crime_data[['LAT', 'LON']].astype(np.float32)
crime_data['DATE OCC'] = pd.to_datetime(crime_data['DATE OCC'], format='%m/%d/%Y %I:%M:%S %p')

# Set device to MPS if available
device = torch.device("mps" if torch.backends.mps.is_built() else "cpu")

# Define the last date in the database (31st October 2024)
last_date = datetime(2024, 10, 31)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_route', methods=['POST'])
def get_route():
    try:
        data = request.get_json()
        start_location = data.get('start_location')
        destination_location = data.get('destination_location')
        time_filter = data.get('time_filter', 'all_time')
        user_demographics = data.get('user_demographics', {})

        start_coords = geocode_location(start_location)
        end_coords = geocode_location(destination_location)
        
        if not start_coords or not end_coords:
            return jsonify({
                "error": "Invalid locations."
            }), 400

        routes, route_info = get_directions(start_coords, end_coords)
        if not routes:
            return jsonify({
                "error": "No routes found."
            }), 400

        filtered_crime_data = filter_crime_data_by_time(time_filter)
        route_distances = [route['distance'] for route in route_info]
        route_durations = [route['duration'] for route in route_info]
        crime_scores = calculate_crime_scores(routes, filtered_crime_data, route_distances)
        
        # Get top crimes using the user-provided demographics
        top_crimes = get_top_crimes(
            filtered_crime_data,
            age=user_demographics.get('age'),
            gender=user_demographics.get('gender'),
            travel_time=user_demographics.get('travelTime')
        )

        response_data = {
            "routes": [{
                "coordinates": route,
                "crime_score": score,
                "distance": distance,
                "duration": duration
            } for route, score, distance, duration in zip(routes, crime_scores, route_distances, route_durations)],
            "crime_scores": crime_scores,
            "route_distances": route_distances,
            "route_durations": route_durations,
            "top_crimes": top_crimes
        }

        return jsonify(response_data), 200

    except Exception as e:
        print(f"Error in get_route: {str(e)}")
        return jsonify({
            "error": str(e)
        }), 500
    
@app.route('/map')
def serve_map():
    # Add CORS headers
    response = send_from_directory('templates', 'map.html')
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response


def get_top_crimes(data, age, gender, travel_time):

    # Categorize age into 10-year intervals
    age_group_start = (age // 10) * 10
    age_group_end = age_group_start + 9

    # Filter data by age group (Vict Age is 0 for missing data)
    filtered_data = data[(data['Vict Age'] >= age_group_start) & (data['Vict Age'] <= age_group_end)]

    # Filter data by gender
    filtered_data = filtered_data[filtered_data['Vict Sex'] == gender]

    # Adjust for the 12 PM fallback spike
    if travel_time == 1200:
        # Remove all entries with time set at the fallback (e.g., 1200 hours)
        filtered_data = filtered_data[filtered_data['TIME OCC'] != 1200]
    else:
        # Filter data by the time of travel (e.g., hour matching)
        filtered_data = filtered_data[(filtered_data['TIME OCC'] // 100 == travel_time // 100)]

    # Sort by priority (assume high-priority crimes are in Part 1, but this can be adjusted)
    filtered_data = filtered_data.sort_values(by=['Part 1-2'], ascending=False)

    # Extract the top 100 coordinates with their categories
    top_coordinates = filtered_data.head(100)['Category'].values.tolist()

    freq_dict = Counter(top_coordinates)

    top_three = freq_dict.most_common(3)

    return top_three


def geocode_location(location):
    # Los Angeles Coordinates (Latitude, Longitude)
    la_center_lat, la_center_lon = 34.0522, -118.2437
    geocode_url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{location}.json"
    params = {
        "access_token": MAPBOX_ACCESS_TOKEN,
        "proximity": f"{la_center_lon},{la_center_lat}"  # Bias towards central LA
    }
    response = requests.get(geocode_url, params=params).json()
    if response['features']:
        return response['features'][0]['geometry']['coordinates']
    return None


def get_directions(start_coords, end_coords, max_routes=5, detail_level="full"):
    directions_url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{start_coords[0]},{start_coords[1]};{end_coords[0]},{end_coords[1]}"
    params = {
        "geometries": "geojson",
        "alternatives": "true",
        "overview": detail_level,
        "access_token": MAPBOX_ACCESS_TOKEN
    }
    response = requests.get(directions_url, params=params).json()
    
    route_info = []
    routes = []
    for route in response['routes'][:max_routes]:
        route_info.append({
            'distance': route['distance'],  # Distance in meters
            'duration': route['duration']   # Duration in seconds
        })
        routes.append(route['geometry']['coordinates'])
        
    return routes, route_info

def filter_crime_data_by_time(time_filter):
    """Filter crime data based on the selected time filter."""
    if time_filter == 'past_7_days':
        cutoff_date = last_date - timedelta(days=7)
    elif time_filter == 'past_1_month':
        cutoff_date = last_date - timedelta(days=30)
    elif time_filter == 'past_6_months':
        cutoff_date = last_date - timedelta(days=180)
    elif time_filter == 'past_1_year':
        cutoff_date = last_date - timedelta(days=365)
    else:
        # For 'all_time', no filter is applied
        return crime_data

    # Filter the crime data based on the cutoff date
    return crime_data[crime_data['DATE OCC'] >= cutoff_date]

def calculate_distance(coord_pair):
    crime_coords, coord = coord_pair
    return geodesic(crime_coords, (coord[1], coord[0])).meters

def calculate_route_distance(route):
    """Calculate the total distance of the route in meters."""
    distance = 0
    for i in range(1, len(route)):
        distance += geodesic((route[i-1][1], route[i-1][0]), (route[i][1], route[i][0])).meters
    return distance

def get_crime_score_bulk(route_coords, crime_data, buffer_miles=0.1):
    buffer_meters = buffer_miles * 1609.34
    route_coords = torch.tensor(route_coords, dtype=torch.float32, device=device)
    
    # Convert crime data to tensor
    crime_coords_list = torch.tensor(crime_data[['LAT', 'LON']].to_numpy(), dtype=torch.float32, device=device)
    
    total_risk = torch.zeros(1, device=device)
    
    # Loop over each crime coordinate and check if it's within the buffer from any route point
    for i, crime_coords in tqdm(enumerate(crime_coords_list), total=len(crime_coords_list), desc="Filtering Nearby Points", unit="crime"):
        # Calculate distance from each route point to the current crime point
        distances = torch.norm(route_coords - crime_coords, dim=1)
        
        # Filter out crime points that are within the buffer
        if torch.any(distances <= buffer_meters):
            # Add the risk level for the current crime if it is within the buffer
            crime_category = crime_data.loc[
                (crime_data['LAT'] == crime_coords[0].item()) & (crime_data['LON'] == crime_coords[1].item()),
                'Category'
            ].values[0]
            tcr_1 = get_top_crimes(crime_data, age=25, gender="M", travel_time=2130) 
            if crime_category in tcr_1:
                total_risk += RISK_LEVELS.get(crime_category, 0)*1.2
            else:
                total_risk += RISK_LEVELS.get(crime_category, 0)
    
    return total_risk.item()

def calculate_crime_scores(routes, filtered_crime_data, route_distances):
    crime_scores = []
    
    # Use tqdm to show a progress bar in the CLI during the computation
    for i, (route, distance) in tqdm(enumerate(zip(routes, route_distances)), desc="Calculating crime scores", unit="route"):
        # Calculate the total crime score for the current route
        crime_score = get_crime_score_bulk(route, filtered_crime_data)
        
        # Normalize the crime score by dividing it by the route's distance
        # Add a small epsilon to prevent division by zero errors in case of very short routes
        normalized_crime_score = crime_score / (distance + 1e-6)
        
        # Round the normalized crime score to 4 decimal places
        normalized_crime_score_rounded = round(normalized_crime_score, 4)
        
        # Append the rounded normalized crime score
        crime_scores.append(normalized_crime_score_rounded)
    
    return crime_scores

def plot_route_on_map(start_coords, end_coords, routes, crime_scores, distances, durations):
    route_map = folium.Map(location=[start_coords[1], start_coords[0]], zoom_start=12)
    folium.Marker([start_coords[1], start_coords[0]], tooltip="Start", icon=folium.Icon(color="green")).add_to(route_map)
    folium.Marker([end_coords[1], end_coords[0]], tooltip="Destination", icon=folium.Icon(color="red")).add_to(route_map)

    colors = ["blue", "purple", "orange", "green", "red"]
    for i, (route, crime_score, distance, duration) in enumerate(zip(routes, crime_scores, distances, durations)):
        route_info = f"Route {i + 1}: Crime Score {crime_score}, Distance: {distance/1000:.2f} km, Duration: {duration/60:.2f} min"
        folium.PolyLine(
            [(lat, lng) for lng, lat in route],
            color=colors[i % len(colors)],
            weight=5,
            tooltip=route_info
        ).add_to(route_map)

    return route_map

if __name__ == '__main__':
    app.run(debug=True)