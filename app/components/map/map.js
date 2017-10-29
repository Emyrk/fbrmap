import './map.scss'
import L from 'leaflet'
import { Component } from '../component'

const template = '<div ref="mapContainer" class="map-container"></div>'

/**
 * Leaflet Map Component
 * Render GoT map items, and provide user interactivity.
 * @extends Component
 */
export class Map extends Component {
  /** Map Component Constructor
   * @param { String } placeholderId Element ID to inflate the map into
   * @param { Object } props.events.click Map item click listener
   */
  constructor (mapPlaceholderId, props) {
    super(mapPlaceholderId, props, template)


    if(false) {
      this.map = L.map('map', {
          crs: L.CRS.Simple,
          minZoom: -5,

      });
      var bounds = [[0,0], [1000,1000]];
      var image = L.imageOverlay('map.png', bounds).addTo(this.map);
      this.layers = {} // Map layer dict (key/value = title/layer)
      this.selectedRegion = null // Store currently selected region
      this.map.fitbounds(bounds);

    } else { // Default
      // Initialize Leaflet map
      this.map = L.map(this.refs.mapContainer, {
        center: [ 50, 50 ],
        zoom: 4,
        maxZoom: 6,
        minZoom: 3,
        crs: L.CRS.Simple

      })

      /*
      INSERT INTO table_name (column1, column2, column3, ...)
      VALUES (value1, value2, value3, ...);

       */
      
      function rand() {
        function getRandomArbitrary(min, max) {
          return Math.random() * (max - min) + min;
         }
         return Math.floor(getRandomArbitrary(0, 9999999999))
      }

      function format(lng, lat, secret) {
        var type = "chest"
        if(secret) {
          type = "secret-chest"
        }
        var geog = "ST_GeographyFromText('SRID=4326;POINT(" + lng + " " + lat + ")')"

        return           `INSERT INTO locations (name, type, geog, nonce)
                          VALUES (chest, ` + type + `,` + geog +`,` + rand() + `);`
      }

      this.map.on('click', function(e) {
          alert("Lng, Lat : " + e.latlng.lng + ", " + e.latlng.lat)
          switch (event.which) {
              case 1:
                  // Left
                  alert(format(e.latlng.lng, e.latlng.lat, false));
                  break;
              case 2:
                  // Middle
                  
                  break;
              case 3:
                  // Right
                  alert(format(e.latlng.lng, e.latlng.lat, true));
                  break;
              default:
                  alert('You have a strange Mouse!');
          }
          alert(e.which)
          /*
          UPDATE locations SET 
geog = ST_GeographyFromText('SRID=4326;POINT(43.75 62.84375)')
WHERE
gid=137;
           */
      });


      //this.map.zoomControl.setPosition('bottomright') // Position zoom control
      this.layers = {} // Map layer dict (key/value = title/layer)
      this.selectedRegion = null // Store currently selected region

        var bounds = [[0,0], [100,100]];

        var image = L.imageOverlay('map.png', bounds).addTo(this.map);

return

      // Render Carto GoT tile baselayer
      L.tileLayer(
        'https://cartocdn-ashbu.global.ssl.fastly.net/ramirocartodb/api/v1/map/named/tpl_756aec63_3adb_48b6_9d14_331c6cbc47cf/all/{z}/{x}/{y}.png',
        { crs: L.CRS.EPSG4326 }).addTo(this.map)
    }
  }


  /** Add location geojson to the leaflet instance */
  addLocationGeojson (layerTitle, geojson, iconUrl) {
    // Initialize new geojson layer
    this.layers[layerTitle] = L.geoJSON(geojson, {
      // Show marker on location
      pointToLayer: (feature, latlng) => {
        return L.marker(latlng, {
          icon: L.icon({ iconUrl, iconSize: [ 24, 56 ] }),
          title: feature.properties.name })
      },
      onEachFeature: this.onEachLocation.bind(this)
    })
  }

  /** Assign Popup and click listener for each location point */
  onEachLocation (feature, layer) {
    // Bind popup to marker
    layer.bindPopup(feature.properties.name, { closeButton: false })
    layer.on({ click: (e) => {
      this.setHighlightedRegion(null) // Deselect highlighed region
      const { name, id, type } = feature.properties
      this.triggerEvent('locationSelected', { name, id, type })
    }})
  }

  /** Add boundary (kingdom) geojson to the leaflet instance */
  addKingdomGeojson (geojson) {
    // Initialize new geojson layer
    this.layers.kingdom = L.geoJSON(geojson, {
      // Set layer style
      style: {
        'color': '#222',
        'weight': 1,
        'opacity': 0.65
      },
      onEachFeature: this.onEachKingdom.bind(this)
    })
  }

  /** Assign click listener for each kingdom GeoJSON item  */
  onEachKingdom (feature, layer) {
    layer.on({ click: (e) => {
      const { name, id } = feature.properties
      this.map.closePopup() // Deselect selected location marker
      this.setHighlightedRegion(layer) // Highlight kingdom polygon
      this.triggerEvent('locationSelected', { name, id, type: 'kingdom' })
    }})
  }

  /** Highlight the selected region */
  setHighlightedRegion (layer) {
    // If a layer is currently selected, deselect it
    if (this.selected) { this.layers.kingdom.resetStyle(this.selected) }

    // Select the provided region layer
    this.selected = layer
    if (this.selected) {
      this.selected.bringToFront()
      this.selected.setStyle({ color: 'blue' })
    }
  }

  /** Toggle map layer visibility */
  toggleLayer (layerName) {
    const layer = this.layers[layerName]
    if (this.map.hasLayer(layer)) {
      this.map.removeLayer(layer)
    } else {
      this.map.addLayer(layer)
    }
  }

  /** Check if layer is added to map  */
  isLayerShowing (layerName) {
    return this.map.hasLayer(this.layers[layerName])
  }

  /** Trigger "click" on layer with provided name */
  selectLocation (id, layerName) {
    // Find selected layer
    const geojsonLayer = this.layers[layerName]
    const sublayers = geojsonLayer.getLayers()
    const selectedSublayer = sublayers.find(layer => {
      return layer.feature.geometry.properties.id === id
    })

    // Zoom map to selected layer
    if (selectedSublayer.feature.geometry.type === 'Point') {
      this.map.flyTo(selectedSublayer.getLatLng(), 5)
    } else {
      this.map.flyToBounds(selectedSublayer.getBounds(), 5)
    }

    // Fire click event
    selectedSublayer.fireEvent('click')
  }
}