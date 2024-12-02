import { Component, Input, ViewChild, OnInit, OnChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TopCrimesComponent } from '../top-crimes/top-crimes.component';

interface RouteData {
  id: number;
  crimeScore: number;
  distance: number;
  duration: number;
}

@Component({
  selector: 'app-route-display',
  templateUrl: './route-display.component.html',
  styleUrls: ['./route-display.component.scss'],
  imports: [
    CommonModule, 
    MatTableModule, 
    MatSortModule, 
    MatProgressSpinnerModule,
    TopCrimesComponent
  ],
  standalone: true
})
export class RouteDisplayComponent implements OnInit, OnChanges {
  @Input() routes: any[] = [];
  @Input() startLocation: string = '';
  @Input() destinationLocation: string = '';
  @Input() isLoading = false;
// In route-display.component.ts
  @Input() topCrimes: string[] = []; // Change type from [string, number][] to string[]
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['id', 'crimeScore', 'distance', 'duration'];
  dataSource: MatTableDataSource<RouteData>;
  @Output() routeHover = new EventEmitter<number | null>();
  hoveredRouteIndex: number | null = null;

  getRowClass(index: number): string {
    return this.hoveredRouteIndex === index ? 'bg-blue-50' : '';
  }
  onRouteHover(index: number | null) {
    this.hoveredRoute = index;      // Emit event to map component
    const event = new CustomEvent('routeHover', {         detail: { routeIndex: index } 
    });
    window.dispatchEvent(event);    }
  onMouseEnter(index: number) {
    this.hoveredRouteIndex = index;
    this.routeHover.emit(index);
  }

  onMouseLeave() {
    this.hoveredRouteIndex = null;
    this.routeHover.emit(null);
  }

  constructor() {
    this.dataSource = new MatTableDataSource<RouteData>();
  }

  ngOnInit() {
    this.updateTableData();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item: RouteData, property: string) => {
      switch(property) {
        case 'crimeScore': return item.crimeScore;
        case 'distance': return item.distance;
        case 'duration': return item.duration;
        default: return (item as any)[property];
      }
    };
  }

  ngOnChanges() {
    this.updateTableData();
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  updateTableData() {
    const tableData = this.routes.map((route, index) => ({
      id: index + 1,
      crimeScore: route.crime_score,
      distance: Number(route.distance),        // Already in km
      duration: Math.round(route.duration/60)  // Convert seconds to minutes and round to nearest minute
    }));
    this.dataSource = new MatTableDataSource(tableData);
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  getRouteColor(index: number): string {
    const colors = ['#2196F3', '#9C27B0', '#FF9800', '#4CAF50', '#F44336'];
    return colors[index % colors.length];
  }
 
  
  hoveredRoute: number | null = null;

    
  
}