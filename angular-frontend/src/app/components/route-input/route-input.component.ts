import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../services/api.service';
import { RouteDisplayComponent } from '../route-display/route-display.component';

@Component({
  selector: 'app-route-input',
  templateUrl: './route-input.component.html',
  styleUrls: ['./route-input.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouteDisplayComponent // Make sure RouteDisplayComponent is imported here
  ]
})
export class RouteInputComponent {
  routeForm: FormGroup;
  isLoading = false;
  routeData: any = null;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.routeForm = this.fb.group({
      startLocation: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9\s,.-]+$/)]],
      destinationLocation: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9\s,.-]+$/)]],
      timeFilter: ['all_time', Validators.required]
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.routeForm.get(controlName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('pattern')) {
      return 'Please enter a valid location (letters, numbers, spaces, and basic punctuation only)';
    }
    return '';
  }

  getRoute(): void {
    if (this.routeForm.invalid) {
      this.routeForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.error = null;
    this.routeData = null;

    const requestData = {
      start_location: this.routeForm.value.startLocation,
      destination_location: this.routeForm.value.destinationLocation,
      time_filter: this.routeForm.value.timeFilter
    };

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