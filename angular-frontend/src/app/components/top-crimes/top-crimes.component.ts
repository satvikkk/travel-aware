import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSortModule, MatSort } from '@angular/material/sort';

interface CrimeData {
  type: string;
  incidents: number;
}

@Component({
  selector: 'app-top-crimes',
  template: `
    <div class="mat-elevation-z2 mt-8">
      <table mat-table [dataSource]="dataSource" class="w-full">
        <!-- Crime Type Column -->
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef class="bg-gray-50 font-bold text-gray-700"> Crime Type </th>
          <td mat-cell *matCellDef="let crime"> {{crime.type}} </td>
        </ng-container>

        <!-- Incidents Column -->
        <ng-container matColumnDef="incidents">
          <th mat-header-cell *matHeaderCellDef class="bg-gray-50 font-bold text-gray-700 text-right"> Incidents </th>
          <td mat-cell *matCellDef="let crime" class="text-right"> 
            <span class="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
              {{crime.incidents}} incidents
            </span>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    </div>
  `,
  styles: [`
    .mat-mdc-row:hover {
      background-color: #f8f9fa;
    }
    .mat-mdc-cell, .mat-mdc-header-cell {
      padding: 16px;
    }
  `],
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule, MatSortModule]
})
export class TopCrimesComponent {
  @Input() set crimes(value: [string, number][]) {
    this._crimes = value;
    this.updateDataSource();
  }
  get crimes(): [string, number][] {
    return this._crimes;
  }

  private _crimes: [string, number][] = [];
  displayedColumns: string[] = ['type', 'incidents'];
  dataSource = new MatTableDataSource<CrimeData>();

  private updateDataSource() {
    const tableData: CrimeData[] = this._crimes.map(([type, incidents]) => ({
      type,
      incidents
    }));
    this.dataSource.data = tableData;
  }
}