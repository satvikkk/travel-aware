import { Component, Input, ViewChild, OnInit, OnChanges } from '@angular/core';
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
  @Input() topCrimes: [string, number][] = [];

  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['id', 'crimeScore', 'distance', 'duration'];
  dataSource: MatTableDataSource<RouteData>;

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
}