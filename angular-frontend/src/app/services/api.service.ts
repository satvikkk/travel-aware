import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RouteResponse {
  routes: Array<{
    coordinates: number[][];
    crime_score: number;
    distance: number;
    duration: number;
  }>;
  crime_scores: number[];
  route_distances: number[];
  route_durations: number[];
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private BASE_URL = 'http://localhost:5000';
  
  constructor(private http: HttpClient) {}

  getRoute(data: {
    start_location: string;
    destination_location: string;
    time_filter: string;
  }): Observable<RouteResponse> {
    const headers = new HttpHeaders()
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json');

    return this.http.post<RouteResponse>(
      `${this.BASE_URL}/get_route`, 
      data,
      { headers }
    );
  }
}