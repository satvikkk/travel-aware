import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, PLATFORM_ID, Inject } from '@angular/core';
import type mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-map-view',
  template: `
    <div id="map" class="map-container"></div>
    <div id="route-tooltip" class="route-tooltip"></div>
  `,
  styles: [`
    :host {
      position: relative;
      display: block;
      width: 100%;
      min-height: 500px;
    }
    .map-container {
      position: relative;
      width: 100%;
      height: 500px;
      border-radius: 4px;
    }
    .route-tooltip {
      display: none;
      position: absolute;
      background: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
      pointer-events: none;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 1000;
      transform: translateY(-20px);
    }
  `],
  standalone: true,
  imports: [CommonModule]
})
export class MapViewComponent implements OnInit, OnChanges {
  @Input() routes: any[] = [];
  @Input() startLocation: string = '';
  @Input() destinationLocation: string = '';
  
  private map: mapboxgl.Map | undefined;
  private mapbox: typeof mapboxgl | null = null;
  private tooltip: HTMLElement | null = null;
  private readonly MAPBOX_TOKEN = 'pk.eyJ1Ijoic2ViYXN0aWFuYWwiLCJhIjoiY20zZ2wxajlhMDVuejJrcHRxbjZqYjd1ZSJ9.UuDU367Lnq-1vP260Xjygg';
  private readonly LA_CENTER: [number, number] = [-118.2437, 34.0522];
  private readonly DEFAULT_ZOOM = 10;

  constructor(
    private elementRef: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeMapbox();
      this.setupRouteHoverListener();
    }
  }

  private setupRouteHoverListener() {
    window.addEventListener('routeHover', ((event: CustomEvent) => {
      const routeIndex = event.detail.routeIndex;
      this.routes.forEach((_, i) => {
        const layer = this.map?.getLayer(`route-${i}`);
        if (layer) {
          this.map?.setPaintProperty(
            `route-${i}`,
            'line-opacity',
            routeIndex === null || routeIndex === i ? 0.8 : 0.3
          );
        }
      });
    }) as EventListener);
  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes['routes'] && this.map) {
      if (this.routes.length > 0) {
        this.drawRoutes();
      } else {
        this.map.flyTo({
          center: this.LA_CENTER,
          zoom: this.DEFAULT_ZOOM,
          essential: true
        });
      }
    }
  }

  private async initializeMapbox() {
    try {
      const mapboxgl = await import('mapbox-gl');
      this.mapbox = mapboxgl.default;
      
      if (this.mapbox) {
        (this.mapbox as any).accessToken = this.MAPBOX_TOKEN;
        this.initializeMap();
        this.tooltip = document.getElementById('route-tooltip');
      }
    } catch (error) {
      console.error('Error loading Mapbox GL:', error);
    }
  }

  private initializeMap() {
    if (!this.mapbox) return;

    this.map = new this.mapbox.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: this.LA_CENTER,
      zoom: this.DEFAULT_ZOOM
    });

    this.map.on('load', () => {
      if (this.routes.length > 0) {
        this.drawRoutes();
      }
    });
  }

  private drawRoutes() {
    if (!this.map || !this.mapbox) return;

    const colors = ['#2196F3', '#9C27B0', '#FF9800', '#4CAF50', '#F44336'];

    // Remove existing route layers and sources
    this.routes.forEach((_, i) => {
      const id = `route-${i}`;
      if (this.map && this.map.getLayer(id)) {
        this.map.removeLayer(id);
      }
      if (this.map && this.map.getSource(id)) {
        this.map.removeSource(id);
      }
    });

    // Add new routes
    this.routes.forEach((route, i) => {
      const id = `route-${i}`;
      
      if (!this.map) return;

      // Add source
      this.map.addSource(id, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route.coordinates
          }
        }
      });

      // Add route layer
      this.map.addLayer({
        id: id,
        type: 'line',
        source: id,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': colors[i % colors.length],
          'line-width': 6,
          'line-opacity': 0.8
        }
      });

      // Add hover interactions
      this.map.on('mousemove', id, (e) => {
        if (this.tooltip) {
          this.tooltip.style.display = 'block';
          this.tooltip.style.left = `${e.point.x + 10}px`;
          this.tooltip.style.top = `${e.point.y + 10}px`;
          this.tooltip.textContent = `Route ${i + 1}`;
        }
        
        if (this.map && this.map.getCanvas()) {
          this.map.getCanvas().style.cursor = 'pointer';
        }
      });

      this.map.on('mouseleave', id, () => {
        if (this.tooltip) {
          this.tooltip.style.display = 'none';
        }
        
        if (this.map && this.map.getCanvas()) {
          this.map.getCanvas().style.cursor = '';
        }
      });
    });

    // Fit bounds to show all routes
    if (this.routes.length > 0 && this.mapbox) {
      const bounds = new this.mapbox.LngLatBounds();
      this.routes.forEach(route => {
        route.coordinates.forEach((coord: [number, number]) => {
          bounds.extend(coord);
        });
      });
      this.map.fitBounds(bounds, { padding: 50 });
    }
  }
}