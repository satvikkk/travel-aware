import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapViewComponent } from '../map-view/map-view.component';

@Component({
  selector: 'app-route-display',
  templateUrl: './route-display.component.html',
  styleUrls: ['./route-display.component.scss'],
  imports: [CommonModule, MapViewComponent],
  standalone: true
})
export class RouteDisplayComponent {
  @Input() routes: any[] = [];
  @Input() startLocation: string = '';
  @Input() destinationLocation: string = '';
  @Input() isLoading = false;

  getRouteColor(index: number): string {
    const colors = ['#2196F3', '#9C27B0', '#FF9800', '#4CAF50', '#F44336'];
    return colors[index % colors.length];
  }
}