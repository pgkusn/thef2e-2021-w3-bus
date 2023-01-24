<template>
  <div class="flex">
    <div class="flex-grow h-screen overflow-auto">
      <form @submit.prevent="search">
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
        <button type="submit" class="w-full">查詢</button>
      </form>

      <ul class="flex">
        <router-link
          v-for="item in directionTabs"
          :to="{ query: { dir: item.dir } }"
          custom
          v-slot="{ navigate }"
        >
          <li class="w-1/2 text-center cursor-pointer" @click="navigate">往 {{ item.desc }}</li>
        </router-link>
      </ul>

      <table class="table w-full p-4 bg-white rounded-lg shadow">
        <thead>
          <tr>
            <th
              class="p-4 font-normal text-gray-900 border-b-2 dark:border-dark-5 whitespace-nowrap"
            >
              站名
            </th>
            <th
              class="p-4 font-normal text-gray-900 border-b-2 dark:border-dark-5 whitespace-nowrap"
            >
              預估到站
            </th>
            <th
              class="p-4 font-normal text-gray-900 border-b-2 dark:border-dark-5 whitespace-nowrap"
            >
              車牌號碼
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="route in routes" class="text-gray-700">
            <td class="p-4 border-b-2 dark:border-dark-5">
              {{ route.stopName }}
            </td>
            <td class="p-4 border-b-2 dark:border-dark-5">
              {{ formatEstimateTime(route) }}
            </td>
            <td class="p-4 border-b-2 dark:border-dark-5">
              {{ route.plateNumb }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="w-2/3 h-screen">
      <div id="map" class="h-full"></div>
    </div>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Wkt from 'wicket'
import { useMainStore } from '@/stores/main'

const props = defineProps({
  city: String,
  routeName: String,
})

const mainStore = useMainStore()
const router = useRouter()
const route = useRoute()

const { authorization } = storeToRefs(mainStore)
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
const search = async () => {
  if (!selected.routeName) return

  const params = {
    city: selected.city,
    routeName: selected.routeName,
  }

  router.push({ params, query: { dir: direction.value } })

  getStopOfRoute(params)
  getEstimatedTimeOfArrival(params)
  addPolyline()
}
const formatEstimateTime = ({ EstimateTime, NextBusTime }) => {
  if (EstimateTime >= 180) return `約 ${Math.floor(EstimateTime / 60)} 分`
  if (EstimateTime > 0) return '即將進站'
  if (EstimateTime === 0) return '進站中'
  if (!NextBusTime) return '未發車'
  return dayjs(NextBusTime).format('HH:mm')
}
const checkToken = async (status, callback) => {
  if (status === 429 || status === 401) {
    const { access_token } = await mainStore.getToken()
    authorization.value = `Bearer ${access_token}`
    callback()
  }
}

// city list
const cityList = ref([])
const getCityList = async () => {
  try {
    cityList.value = await mainStore.getCityList()
  } catch (error) {
    console.error(error.message)
    if (error.response) {
      checkToken(error.response.status, getCityList)
    }
  }
}

// route list & direction tabs
const routeList = ref([])
const directionTabs = computed(() => {
  if (!routeStop.value.length) return []
  return routeList.value.find(el => el.label === selected.routeName)?.direction
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
    if (error.response) {
      checkToken(error.response.status, getRouteList)
    }
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
    if (error.response) {
      checkToken(error.response.status, () => getEstimatedTimeOfArrival(data))
    }
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
    if (error.response) {
      checkToken(error.response.status, () => getStopOfRoute(data))
    }
  }
}

// location
let currentPosition = {
  latitude: 25.0657976,
  longitude: 121.5352149,
}
const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(pos => {
      currentPosition = pos.coords
      resolve()
    }, reject)
  })
}

// map
let map = null
const initMap = () => {
  const { latitude, longitude } = currentPosition
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

    // remove all polyline
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
    if (error.response) {
      checkToken(error.response.status, addPolyline)
    }
  }
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
  await getCurrentPosition()
  initMap()
  getCityList()
  if (props.city && props.routeName) {
    getRouteList()
    search()
  }
})
</script>
