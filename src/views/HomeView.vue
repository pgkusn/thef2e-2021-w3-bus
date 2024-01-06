<script lang="ts" setup>
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import { debounce } from 'lodash-es'
import { useTimeoutPoll } from '@vueuse/core'
import { AxiosError } from 'axios'
import { useMainStore } from '@/stores/main'
import { formatTime } from '@/utils/formatTime'
import * as Types from '@/types'

const props = defineProps<{
  city: string
  routeName: string
}>()

const mainStore = useMainStore()
const router = useRouter()
const route = useRoute()

const selectedCity = ref(props.city)
const selectedRoute = ref<Types.RouteList | null>()
const currentDirection = computed(() => Number(route.query.dir) || 0)

// city dropdown
const cityList = ref([])
const getCityList = async () => {
  try {
    cityList.value = await mainStore.getCityList()
  } catch (error) {
    const axiosError = error as AxiosError
    if (axiosError.response?.status === 429 || axiosError.response?.status === 401) {
      await mainStore.refreshToken()
      getCityList()
    }
  }
}

// route dropdown & direction tabs
const routeList = ref<Types.RouteList[]>([])
const directionTabs = computed(() => {
  return (
    routeList.value.find(el => el.routeName === selectedRoute.value?.routeName)?.direction || []
  )
})
const getRouteList = async () => {
  try {
    routeList.value = await mainStore.getRouteList(selectedCity.value)
    // search by url
    const route = routeList.value.find(item => item.routeName === props.routeName)
    if (route) {
      selectedRoute.value = route
      search()
    }
  } catch (error) {
    const axiosError = error as AxiosError
    if (axiosError.response?.status === 429 || axiosError.response?.status === 401) {
      await mainStore.refreshToken()
      getRouteList()
    }
  }
}

// arrival time
const arrivalTime = ref<Types.ApiEstimatedTimeOfArrival[]>([])
const getEstimatedTimeOfArrival = async (params: Types.ApiParam) => {
  try {
    arrivalTime.value = await mainStore.getEstimatedTimeOfArrival(params)
  } catch (error) {
    const axiosError = error as AxiosError
    if (axiosError.response?.status === 429 || axiosError.response?.status === 401) {
      await mainStore.refreshToken()
      getEstimatedTimeOfArrival(params)
    }
  }
}

// routes
const routeStop = ref<Types.ApiStopOfRoute[]>([])
const routes = computed(() => {
  const stopByDirection =
    routeStop.value.find(item => item.Direction === currentDirection.value)?.Stops || []
  return stopByDirection.map(item => {
    const stopName = item.StopName.Zh_tw
    const result = arrivalTime.value.find(
      ({ StopName, Direction }) =>
        StopName.Zh_tw === stopName && Direction === currentDirection.value
    )
    return {
      stopName,
      stopPosition: {
        latitude: item.StopPosition.PositionLat,
        longitude: item.StopPosition.PositionLon,
      },
      EstimateTime: result?.EstimateTime,
      NextBusTime: result?.NextBusTime,
      plateNumb: result?.PlateNumb,
    }
  })
})
const getStopOfRoute = async (params: Types.ApiParam) => {
  try {
    routeStop.value = await mainStore.getStopOfRoute(params)
  } catch (error) {
    const axiosError = error as AxiosError
    if (axiosError.response?.status === 429 || axiosError.response?.status === 401) {
      await mainStore.refreshToken()
      getStopOfRoute(params)
    }
  }
}

// map
const mapEl = ref()
const geometry = ref<string>('')
const getShapeOfRoute = async (params: Types.ApiParam) => {
  try {
    geometry.value = await mainStore
      .getShapeOfRoute(params)
      .then(
        res => res.find(el => el.RouteName.Zh_tw === selectedRoute.value?.routeName)?.Geometry || ''
      )
  } catch (error) {
    const axiosError = error as AxiosError
    if (axiosError.response?.status === 429 || axiosError.response?.status === 401) {
      await mainStore.refreshToken()
      getShapeOfRoute(params)
    }
  }
}

// search & refresh
const isSearching = ref(false)
const search = debounce(async () => {
  if (!selectedRoute.value || isSearching.value) return

  isSearching.value = true

  const params = {
    city: selectedCity.value,
    routeName: selectedRoute.value.routeName,
  }
  router.push({ params, query: { dir: currentDirection.value } })
  await Promise.all([
    getEstimatedTimeOfArrival(params),
    getStopOfRoute(params),
    getShapeOfRoute(params),
  ])
  mapEl.value.updateMap()

  isSearching.value = false
}, 500)
const refresh = debounce(async () => {
  if (!selectedRoute.value || isSearching.value) return

  isSearching.value = true

  await getEstimatedTimeOfArrival({
    city: selectedCity.value,
    routeName: selectedRoute.value.routeName,
  })

  isSearching.value = false
}, 500)

// countdown
const totalTime = 30
const time = ref(totalTime)
const { pause, resume } = useTimeoutPoll(() => {
  time.value--
  if (!time.value) {
    refresh()
  }
}, 1000)

watch(selectedCity, () => {
  selectedRoute.value = null
})
watch(selectedRoute, () => {
  routeStop.value = []
  pause()
  time.value = totalTime
})
watch(isSearching, value => {
  if (value) {
    pause()
  } else {
    resume()
    time.value = totalTime
  }
})

onMounted(() => {
  getCityList()
})
</script>

<template>
  <div class="grid px-6 py-6 md:min-h-screen md:px-8 md:pt-8">
    <div
      v-show="cityList.length"
      class="form rounded-2xl bg-white px-7 py-5 shadow md:px-8 md:py-6"
    >
      <form class="flex flex-col gap-y-4" @submit.prevent="search">
        <p class="text-lg font-bold text-primary-light">路線搜尋</p>
        <v-select
          v-model="selectedCity"
          :options="cityList"
          :reduce="(option: Types.ApiCityList) => option.City"
          :clearable="false"
          label="CityName"
          placeholder="選擇縣市"
          @option:selected="getRouteList"
        />
        <v-select
          v-model="selectedRoute"
          :options="routeList"
          :clearable="false"
          label="label"
          placeholder="選擇路線"
        />
        <div class="flex gap-4">
          <button
            type="submit"
            class="h-10 w-full rounded-full bg-primary-light text-sm font-bold text-white disabled:opacity-50"
            :disabled="!selectedRoute"
          >
            搜尋
          </button>
          <button
            class="h-10 w-full rounded-full bg-primary-light text-sm font-bold text-white disabled:opacity-50 [&:hover>span]:hidden [&:hover]:before:content-['立即更新']"
            :disabled="!selectedRoute || !routes.length"
            @click.prevent="refresh"
          >
            <span v-if="!isSearching && time">{{ time }} 秒後更新</span>
            <span v-else>更新中</span>
          </button>
        </div>
      </form>
    </div>

    <div v-if="routes.length" class="route overflow-hidden rounded-2xl shadow">
      <nav class="flex">
        <router-link
          v-for="item in directionTabs"
          :to="{ query: { dir: item.dir } }"
          :class="[
            'w-1/2 p-1.5 text-center text-white',
            item.dir === currentDirection ? 'bg-primary-light' : 'bg-[#BFCDFF]',
          ]"
        >
          往 {{ item.desc }}
        </router-link>
      </nav>
      <div class="h75 overflow-auto bg-white md:h-[calc(100vh-410px)]">
        <table class="w-full text-gray-900">
          <tr
            v-for="route in routes"
            class="h-10 odd:bg-[#F2F2F2] even:bg-[#FEFCFC] cursor-pointer hover:!bg-[#E5E5E5]"
            @click="mapEl.moveMap(route.stopPosition)"
          >
            <td width="50%">
              <div class="flex items-center">
                <img src="@/assets/icon-arrow.png" class="mx-3" />
                {{ route.stopName }}
              </div>
            </td>
            <td
              class="pl-2 font-bold"
              width="25%"
              v-html="formatTime(route.EstimateTime, route.NextBusTime)"
            ></td>
            <td class="text-primary-light" width="25%">
              <div v-if="route.plateNumb && route.plateNumb !== '-1'" class="flex items-center">
                <img src="@/assets/icon-bus.png" class="mr-2 only:hidden" />
                <span class="text-sm">{{ route.plateNumb }}</span>
              </div>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div class="map-container overflow-hidden rounded-2xl shadow">
      <TheMap :geometry="geometry" :routes="routes" ref="mapEl" @getRouteList="getRouteList" />
    </div>

    <footer class="text-center text-sm font-bold text-gray-800 md:text-lg">
      ©2023 , Taiwan Bike. All Rights Reserved.
    </footer>
  </div>
</template>

<style>
:root {
  --vs-dropdown-color: theme('colors.gray.1000');
  --vs-selected-color: theme('colors.gray.1000');
  --vs-search-input-placeholder-color: theme('colors.gray.1000');
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
</style>
