<script lang="ts" setup>
import L from 'leaflet'
import Wkt from 'wicket'
import 'leaflet/dist/leaflet.css'
import * as Types from '@/types'

// marker
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

const props = defineProps<{
  geometry: string
}>()

// map & polyline
let map: L.Map
const initMap = ({ latitude, longitude }: Types.Position) => {
  map = L.map('map').setView([latitude, longitude], 15)
  L.tileLayer(
    'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
    {
      attribution:
        '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
      id: 'mapbox/streets-v12',
      accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
    }
  ).addTo(map)
}
const addPolyline = async () => {
  // remove polyline
  map.eachLayer(layer => {
    if (layer instanceof L.Polyline) {
      map?.removeLayer(layer)
    }
  })

  const wkt = new Wkt.Wkt()
  const json = wkt.read(props.geometry).toJson()
  const layer = L.geoJSON(json).addTo(map)
  map.fitBounds(layer.getBounds())
}

// position & marker
const getCurrentPosition = (): Promise<Types.Coords> => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(pos => {
      resolve(pos.coords)
    }, reject)
  })
}
const showCurrentPosition = ({ latitude, longitude }: Types.Position) => {
  const icon = new L.Icon({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
  })
  if (map) {
    L.marker([latitude, longitude], { icon }).addTo(map).bindPopup('You are here').openPopup()
  }
}

onMounted(async () => {
  let position = { latitude: 25.0657976, longitude: 121.5352149 }

  try {
    position = await getCurrentPosition()
    initMap(position)
    showCurrentPosition(position)
  } catch (error) {
    initMap(position)
  }

  watchEffect(() => {
    if (props.geometry) {
      addPolyline()
    }
  })
})
</script>

<template>
  <div id="map" class="h-full"></div>
</template>
