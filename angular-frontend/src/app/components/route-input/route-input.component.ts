import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { RouteDisplayComponent } from '../route-display/route-display.component';

@Component({
  selector: 'app-route-input',
  templateUrl: './route-input.component.html',
  styleUrls: ['./route-input.component.scss'],
  imports: [FormsModule, ReactiveFormsModule, CommonModule, RouteDisplayComponent],
  standalone: true
})
export class RouteInputComponent {
  startLocation: string = '';
  destinationLocation: string = '';
  timeFilter: string = 'all_time';
  routeData: any = null;
  error: string | null = null;
  isLoading: boolean = false;

  constructor(private apiService: ApiService) {}

  getRoute(): void {
    if (!this.startLocation || !this.destinationLocation) {
      this.error = 'Please enter both start and destination locations';
      return;
    }

    const requestData = {
      start_location: this.startLocation,
      destination_location: this.destinationLocation,
      time_filter: this.timeFilter,
    };

    this.error = null;
    this.isLoading = true;
    this.routeData = null; // Clear existing route data

    this.apiService.getRoute(requestData).subscribe({
      next: (response: any) => {
        console.log('API Response:', response);
        this.routeData = response;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('API Error:', error);
        this.error = error.message || 'An error occurred while fetching routes';
        this.isLoading = false;
      }
    });
  }
}