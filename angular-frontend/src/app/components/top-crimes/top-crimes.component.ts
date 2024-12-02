import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatSortModule } from '@angular/material/sort';

interface CrimeData {
  type: string;
  riskLevel: number;
}

@Component({
  selector: 'app-top-crimes',
  template: `
    <div class="mat-elevation-z2 mt-8">
      <table mat-table [dataSource]="dataSource" class="w-full">
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef class="bg-gray-50"> Crime Type </th>
          <td mat-cell *matCellDef="let crime"> {{crime.type}} </td>
        </ng-container>

        <ng-container matColumnDef="riskLevel">
          <th mat-header-cell *matHeaderCellDef class="bg-gray-50 font-bold text-gray-700 text-right"> Risk Level </th>
          <td mat-cell *matCellDef="let crime" class="text-right"> 
            <span class="px-2 py-1" [ngClass]="getRiskLevelClass(crime.riskLevel)">
              {{crime.riskLevel}}
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
  @Input() set crimes(value: string[]) {
    this._crimes = value;
    this.updateDataSource();
  }

  private _crimes: string[] = [];
  displayedColumns: string[] = ['type', 'riskLevel'];
  dataSource = new MatTableDataSource<CrimeData>();

  private riskLevels: {[key: string]: number} = {
    'Theft': 6, 'Burglary': 7, 'Sexual Offenses': 9, 'Assault': 9, 'Homicide': 10,
    'Robbery': 8, 'Vandalism': 3, 'Trespassing': 2, 'Crimes Against Children': 8,
    'Criminal Threats': 6, 'Weapon Offenses': 8, 'Order Violations': 4,
    'Lewd Letters and Calls': 3, 'Fraud': 2, 'Kidnapping': 9, 'Traffic Offenses': 4,
    'Public Disorder': 4
  };

  private updateDataSource() {
    const tableData: CrimeData[] = this._crimes.map(type => ({
      type,
      riskLevel: this.riskLevels[type] || 0
    }));
    this.dataSource.data = tableData;
  }

  getRiskLevelClass(level: number): string {
    if (level >= 8) return 'bg-red-100 text-red-800 rounded-full text-sm';
    if (level >= 5) return 'bg-orange-100 text-orange-800 rounded-full text-sm';
    return 'bg-yellow-100 text-yellow-800 rounded-full text-sm';
  }
}