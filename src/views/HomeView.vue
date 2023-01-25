<template>
  <div class="grid px-6 py-6 md:min-h-screen md:px-8 md:pt-8">
    <div
      v-show="cityList.length"
      class="form rounded-2xl bg-white px-7 py-5 shadow md:px-8 md:py-6"
    >
      <form class="flex flex-col gap-y-4" @submit.prevent="search">
        <p class="text-lg font-bold text-primary-light">路線搜尋</p>
        <v-select
          v-model="selected.city"
          :options="cityList"
          :reduce="option => option.City"
          label="CityName"
          :clearable="false"
          placeholder="選擇縣市"
          @option:selected="getRouteList"
        />
        <v-select
          v-model="selected.routeName"
          :options="routeList"
          :reduce="option => option.label"
          :clearable="false"
          placeholder="選擇路線"
        />
        <button
          type="submit"
          class="h-10 w-full rounded-full bg-primary-light text-sm font-bold text-white disabled:opacity-50"
          :disabled="!selected.routeName || isLoading"
        >
          搜尋
        </button>
      </form>
    </div>

    <div v-if="routes.length" class="route overflow-hidden rounded-2xl shadow">
      <nav class="flex">
        <router-link
          v-for="item in directionTabs"
          :to="{ query: { dir: item.dir } }"
          :class="[
            'w-1/2 p-1.5 text-center text-white',
            item.dir === direction ? 'bg-primary-light' : 'bg-[#BFCDFF]',
          ]"
        >
          往 {{ item.desc }}
        </router-link>
      </nav>
      <div class="table-container overflow-auto bg-white">
        <table class="w-full text-gray-900">
          <tr v-for="route in routes" class="h-10 odd:bg-[#F2F2F2] even:bg-[#FEFCFC]">
            <td width="50%">
              <div class="flex items-center">
                <img src="@/assets/icon-arrow.png" class="mx-3" />
                {{ route.stopName }}
              </div>
            </td>
            <td class="pl-2 font-bold" width="25%" v-html="formatTime(route)"></td>
            <td class="text-primary-light" width="25%">
              <div class="flex items-center">
                <img src="@/assets/icon-bus.png" class="mr-2 only:hidden" />
                <span v-if="route.plateNumb" class="text-sm">{{ route.plateNumb }}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div class="map-container overflow-hidden rounded-2xl shadow">
      <div id="map" class="h-full"></div>
    </div>

    <footer class="text-center text-sm font-bold text-gray-800 md:text-lg">
      ©2023 , Taiwan Bike. All Rights Reserved.
    </footer>
  </div>
</template>

<script setup>
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Wkt from 'wicket'
import dayjs from 'dayjs'
import { useMainStore } from '@/stores/main'

// leaflet marker
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

const props = defineProps({
  city: String,
  routeName: String,
})

const mainStore = useMainStore()
const router = useRouter()
const route = useRoute()

const selected = reactive({
  city: route.params.city,
  routeName: route.params.routeName,
})
const direction = computed(() => (route.query.dir === '1' ? 1 : 0))
const routes = computed(() => {
  return routeStopComputed.value.map(stop => {
    const { EstimateTime, NextBusTime, PlateNumb } =
      arrivalTime.value.find(time => {
        return time.StopName.Zh_tw === stop.StopName.Zh_tw && time.Direction === direction.value
      }) || {}
    return {
      stopName: stop.StopName.Zh_tw,
      EstimateTime,
      NextBusTime,
      plateNumb: PlateNumb === '-1' ? '' : PlateNumb,
    }
  })
})
const formatTime = ({ EstimateTime, NextBusTime }) => {
  if (EstimateTime >= 180)
    return `<span class="text-primary-light">約 ${Math.floor(EstimateTime / 60)} 分</span>`
  if (EstimateTime > 0) return '<span class="text-[#FFBD37]">即將進站</span>'
  if (EstimateTime === 0) return '<span class="text-[salmon]">進站中</span>'
  if (!NextBusTime) return '未發車'
  return dayjs(NextBusTime).format('HH:mm')
}
const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(pos => {
      resolve(pos.coords)
    }, reject)
  })
}

// city dropdown
const cityList = ref([])
const getCityList = async () => {
  try {
    cityList.value = await mainStore.getCityList()
  } catch (error) {
    console.error(error.message)
  }
}

// route dropdown & direction tabs
const routeList = ref([])
const directionTabs = computed(() => {
  if (routes.value.length === 0) return []
  return routeList.value.find(el => el.label === selected.routeName)?.direction || []
})
const getRouteList = async () => {
  try {
    routeList.value = await mainStore.getRouteList(selected.city).then(res =>
      res.map(el => {
        const set = new Set()
        return {
          label: el.RouteName.Zh_tw,
          direction: el.SubRoutes.map(subEl => ({
            dir: subEl.Direction,
            desc: subEl.Direction ? el.DepartureStopNameZh : el.DestinationStopNameZh,
          })).filter(subEl => (!set.has(subEl.dir) ? set.add(subEl.dir) : false)),
        }
      })
    )
  } catch (error) {
    console.error(error.message)
  }
}

// arrival time
const arrivalTime = ref([])
const getEstimatedTimeOfArrival = async data => {
  try {
    arrivalTime.value = await mainStore
      .getEstimatedTimeOfArrival(data)
      .then(res => res.filter(el => el.RouteName.Zh_tw === selected.routeName))
  } catch (error) {
    console.error(error.message)
  }
}

// route stop
const routeStop = ref([])
const routeStopComputed = computed(
  () => routeStop.value.find(el => el.Direction === direction.value)?.Stops || []
)
const getStopOfRoute = async data => {
  try {
    routeStop.value = await mainStore
      .getStopOfRoute(data)
      .then(res => res.filter(el => el.RouteName.Zh_tw === selected.routeName))
  } catch (error) {
    console.error(error.message)
  }
}

// map
let map = null
const initMap = ({ latitude, longitude }) => {
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
  try {
    const geometry = await mainStore
      .getShapeOfRoute({
        city: selected.city,
        routeName: selected.routeName,
      })
      .then(res => res.find(el => el.RouteName.Zh_tw === selected.routeName)?.Geometry)

    if (!geometry) return

    // remove polyline
    map.eachLayer(layer => {
      if (layer instanceof L.Polyline) {
        map.removeLayer(layer)
      }
    })

    const wkt = new Wkt.Wkt()
    const json = wkt.read(geometry).toJson()
    const layer = L.geoJSON(json).addTo(map)
    map.fitBounds(layer.getBounds())
  } catch (error) {
    console.error(error.message)
  }
}
const showCurrentPosition = ({ latitude, longitude }) => {
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
  L.marker([latitude, longitude], { icon }).addTo(map).bindPopup('You are here').openPopup()
}

// search
const isLoading = ref(false)
const search = async () => {
  if (!selected.routeName) return

  const params = {
    city: selected.city,
    routeName: selected.routeName,
  }

  router.push({ params, query: { dir: direction.value } })

  isLoading.value = true
  await Promise.all([getStopOfRoute(params), getEstimatedTimeOfArrival(params), addPolyline()])
  isLoading.value = false
}

watch(selected, () => {
  routeStop.value = []
})
watch(
  () => selected.city,
  () => {
    selected.routeName = ''
  }
)

onMounted(async () => {
  getCityList()

  let position = { latitude: 25.0657976, longitude: 121.5352149 }
  try {
    position = await getCurrentPosition()
    initMap(position)
    showCurrentPosition(position)
  } catch (error) {
    initMap(position)
  }

  if (props.city && props.routeName) {
    getRouteList()
    search()
  }
})
</script>

<style lang="postcss">
:root {
  --vs-dropdown-color: theme('colors.gray.1000');
  --vs-selected-color: theme('colors.gray.1000');
  background-color: #e5e5e5;
}
.grid {
  grid-template-areas:
    'form'
    'map'
    'route'
    'footer';
  grid-template-rows: auto 343px 1fr auto;
  gap: 40px;
}
@screen md {
  .grid {
    grid-template-areas:
      'form map'
      'route map'
      'footer footer';
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 400px 1fr;
    gap: 28px;
  }
}
.form {
  grid-area: form;
}
.route {
  grid-area: route;
}
.map-container {
  grid-area: map;
}
footer {
  grid-area: footer;
}
.table-container {
  height: 300px;
}
@screen md {
  .table-container {
    height: calc(100vh - 410px);
  }
}
</style>
