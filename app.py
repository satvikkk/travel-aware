from flask import Flask, request, jsonify, render_template
import requests
import folium

app = Flask(__name__)

MAPBOX_ACCESS_TOKEN = 'pk.eyJ1Ijoic2ViYXN0aWFuYWwiLCJhIjoiY20zZ2wxajlhMDVuejJrcHRxbjZqYjd1ZSJ9.UuDU367Lnq-1vP260Xjygg'


@app.route('/')
def index():
    return render_template('index.html')  # A simple form with start and end input fields.


@app.route('/get_route', methods=['POST'])
def get_route():
    # Get start and destination locations from the form
    start_location = request.form.get('start_location')
    destination_location = request.form.get('destination_location')

    # Geocode the start and destination locations
    start_coords = geocode_location(start_location)
    end_coords = geocode_location(destination_location)

    if not start_coords or not end_coords:
        return jsonify({"error": "Invalid locations."}), 400

    # Get routes between the locations
    routes = get_directions(start_coords, end_coords)

    if not routes:
        return jsonify({"error": "No routes found."}), 400

    # Generate a map with all routes
    route_map = plot_route_on_map(start_coords, end_coords, routes)

    # Save the map as HTML
    route_map.save("templates/map.html")

    # Collect all coordinates in a variable
    all_coordinates = []
    for route in routes:
        all_coordinates.extend(route)

    # Log the coordinates for debugging (optional)
    print("All coordinates stored in variable:\n", all_coordinates)

    # Store the coordinates in a variable (example for further use)
    global stored_coordinates  # Declare a global variable to access it outside this function
    stored_coordinates = all_coordinates

    return render_template('map.html')


def geocode_location(location):
    """Converts a location into coordinates using Mapbox Geocoding API."""
    geocode_url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{location}.json"
    params = {
        "access_token": MAPBOX_ACCESS_TOKEN,
    }
    response = requests.get(geocode_url, params=params)
    data = response.json()

    if data['features']:
        coords = data['features'][0]['geometry']['coordinates']
        return coords
    return None


def get_directions(start_coords, end_coords):
    """Fetches directions including alternative routes between two coordinates."""
    directions_url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{start_coords[0]},{start_coords[1]};{end_coords[0]},{end_coords[1]}"
    params = {
        "geometries": "geojson",
        "alternatives": "true",  # Request alternative routes
        "access_token": MAPBOX_ACCESS_TOKEN,
    }
    response = requests.get(directions_url, params=params)
    data = response.json()

    if data['routes']:
        routes = [route['geometry']['coordinates'] for route in data['routes']]
        print("Routes: \n", routes)
        return routes
    return None


def plot_route_on_map(start_coords, end_coords, routes):
    """Plots multiple routes on a map using Folium."""
    # Center the map around the start point
    route_map = folium.Map(location=[start_coords[1], start_coords[0]], zoom_start=12)

    # Add markers for start and end
    folium.Marker([start_coords[1], start_coords[0]], tooltip="Start", icon=folium.Icon(color="green")).add_to(route_map)
    folium.Marker([end_coords[1], end_coords[0]], tooltip="Destination", icon=folium.Icon(color="red")).add_to(route_map)

    # Add each route as a line with a unique color
    colors = ["blue", "purple", "orange", "green", "red"]  # Cycle through colors
    for i, route in enumerate(routes):
        folium.PolyLine([(lat, lng) for lng, lat in route], color=colors[i % len(colors)], weight=5, tooltip=f"Route {i+1}").add_to(route_map)

    return route_map


if __name__ == '__main__':
    app.run(debug=True)
