<script lang="ts" setup>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Wkt from 'wicket'
import { isEqual } from 'lodash-es'
import * as Types from '@/types'

// marker icon
import retinaBlueIcon from 'leaflet/dist/images/marker-icon-2x.png'
import blueIcon from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

interface RouteItem {
  stopName: string
  stopPosition: Types.Position
  EstimateTime?: number
  NextBusTime?: number
  plateNumb?: string
}

interface TheMapProps {
  geometry: string
  routes: RouteItem[]
}

const props = defineProps<TheMapProps>()

const emit = defineEmits<{
  (e: 'getRouteList'): void
}>()

const route = useRoute()

let currentPosition: Types.Position
const getCurrentPosition = (): Promise<Types.Position> => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(pos => {
      resolve(pos.coords)
    }, reject)
  })
}

let map: L.Map
const initMap = (position: Types.Position) => {
  const { latitude, longitude } = position
  map = L.map('map', {
    center: [latitude, longitude],
    zoom: 15,
  })
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
  if (!props.geometry) return

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

// marker
const addMarker = ({
  position,
  popupMsg,
  iconColor = 'blue',
  isOpenPopup = false,
}: Types.Marker) => {
  const iconRetinaUrl = {
    blue: retinaBlueIcon,
    green:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  }
  const iconUrl = {
    blue: blueIcon,
    green:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  }
  const icon = new L.Icon({
    iconRetinaUrl: iconRetinaUrl[iconColor],
    iconUrl: iconUrl[iconColor],
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
  })
  const marker = L.marker([position.latitude, position.longitude], { icon })
    .addTo(map)
    .bindPopup(popupMsg)
  if (isOpenPopup) {
    marker.openPopup()
  }
}
const removeMarkers = () => {
  map.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      map?.removeLayer(layer)
    }
  })
}
const addStopMarkers = (position?: Types.Position) => {
  props.routes.forEach(item => {
    addMarker({
      position: item.stopPosition,
      popupMsg: item.stopName,
      isOpenPopup: isEqual(item.stopPosition, position),
    })
  })
}
const addUserMarker = (isOpenPopup: boolean = false) => {
  if (!currentPosition) return
  addMarker({
    position: currentPosition,
    popupMsg: 'You are here',
    iconColor: 'green',
    isOpenPopup,
  })
}

const updateMap = () => {
  addPolyline()
  removeMarkers()
  addStopMarkers()
  addUserMarker()
}
const moveMap = (position: Types.Position) => {
  removeMarkers()
  addStopMarkers(position)
  addUserMarker()
  map.flyTo([position.latitude, position.longitude], 15)
}
defineExpose({ updateMap, moveMap })

watch(
  () => route.query.dir,
  async () => {
    await nextTick()
    updateMap()
  }
)

onMounted(async () => {
  try {
    currentPosition = await getCurrentPosition()
    initMap(currentPosition)
    addUserMarker(true)
  } catch (error) {
    initMap({ latitude: 25.0657976, longitude: 121.5352149 })
  }

  if (route.params.city && route.params.routeName) {
    emit('getRouteList')
  }
})
</script>

<template>
  <div id="map" class="h-full"></div>
</template>
