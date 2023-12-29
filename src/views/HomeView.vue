<script lang="ts" setup>
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
import dayjs from 'dayjs'
import { debounce } from 'lodash-es'
import { useTimeoutPoll } from '@vueuse/core'
import { promiseTimeout } from '@vueuse/shared'
import { useMainStore } from '@/stores/main'
import * as Types from '@/types'

const props = defineProps<{
  city: string
  routeName: string
}>()

const mainStore = useMainStore()
const router = useRouter()
const route = useRoute()

const selectedCity = ref(props.city)
const selectedRouteName = ref(props.routeName)
const currentDirection = computed(() => (route.query.dir === '1' ? 1 : 0))

const formatTime = (EstimateTime = -1, NextBusTime = -1) => {
  if (EstimateTime >= 180)
    return `<span class="text-primary-light">約 ${Math.floor(EstimateTime / 60)} 分</span>`
  if (EstimateTime > 0) return '<span class="text-[#FFBD37]">即將進站</span>'
  if (EstimateTime === 0) return '<span class="text-[salmon]">進站中</span>'

  if (NextBusTime === -1) return '未發車'

  return dayjs(NextBusTime).format('HH:mm')
}

// city dropdown
const cityList = ref([])
const getCityList = async () => {
  try {
    cityList.value = await mainStore.getCityList()
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message)
    }
  }
}

// route dropdown & direction tabs
const routeList = ref<Types.RouteList[]>([])
const directionTabs = computed(() => {
  if (routes.value.length === 0) return []
  return routeList.value.find(el => el.label === selectedRouteName.value)?.direction || []
})
const getRouteList = async () => {
  try {
    routeList.value = await mainStore.getRouteList(selectedCity.value).then(res =>
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
    if (error instanceof Error) {
      console.error(error.message)
    }
  }
}

// arrival time
const arrivalTime = ref<Types.ApiEstimatedTimeOfArrival[]>([])
const getEstimatedTimeOfArrival = async (data: Types.ApiParam) => {
  try {
    arrivalTime.value = await mainStore
      .getEstimatedTimeOfArrival(data)
      .then(res => res.filter(el => el.RouteName.Zh_tw === selectedRouteName.value))
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message)
    }
  }
}

// routes
const routeStop = ref<Types.ApiStopOfRoute[]>([])
const routes = computed(() => {
  const routeStopByDirection =
    routeStop.value.find(el => el.Direction === currentDirection.value)?.Stops || []
  return routeStopByDirection.map(stop => {
    const { EstimateTime, NextBusTime, PlateNumb } =
      arrivalTime.value.find(time => {
        return (
          time.StopName.Zh_tw === stop.StopName.Zh_tw && time.Direction === currentDirection.value
        )
      }) || {}
    return {
      stopName: stop.StopName.Zh_tw,
      EstimateTime,
      NextBusTime,
      plateNumb: PlateNumb === '-1' ? '' : PlateNumb,
    }
  })
})
const getStopOfRoute = async (data: Types.ApiParam) => {
  try {
    routeStop.value = await mainStore
      .getStopOfRoute(data)
      .then(res => res.filter(el => el.RouteName.Zh_tw === selectedRouteName.value))
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message)
    }
  }
}

// map
const geometry = ref<string>('')
const getShapeOfRoute = async () => {
  try {
    geometry.value = await mainStore
      .getShapeOfRoute({
        city: selectedCity.value,
        routeName: selectedRouteName.value,
      })
      .then(res => res.find(el => el.RouteName.Zh_tw === selectedRouteName.value)?.Geometry || '')
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message)
    }
  }
}

// search & refresh
const isSearching = ref(false)
const search = debounce(async () => {
  if (!selectedRouteName.value || isSearching.value) return

  const params = {
    city: selectedCity.value,
    routeName: selectedRouteName.value,
  }

  router.push({ params, query: { dir: currentDirection.value } })

  isSearching.value = true
  pause()

  await Promise.all([getEstimatedTimeOfArrival(params), getStopOfRoute(params), getShapeOfRoute()])

  isSearching.value = false
  resume()
  time.value = totalTime
}, 500)
const refresh = debounce(async () => {
  if (isSearching.value) return

  pause()

  await getEstimatedTimeOfArrival({
    city: selectedCity.value,
    routeName: selectedRouteName.value,
  })

  if (!time.value) {
    await promiseTimeout(1000)
  }

  resume()
  time.value = totalTime
}, 500)

// countdown
const totalTime = 30
const time = ref(totalTime)
const { pause, resume } = useTimeoutPoll(async () => {
  time.value--
  if (!time.value) {
    refresh()
  }
}, 1000)

watch(selectedCity, () => {
  selectedRouteName.value = ''
})
watch(selectedRouteName, () => {
  routeStop.value = []
  pause()
  time.value = totalTime
})

onMounted(() => {
  getCityList()
  if (props.city && props.routeName) {
    getRouteList()
    search()
  }
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
          label="CityName"
          :clearable="false"
          placeholder="選擇縣市"
          @option:selected="getRouteList"
        />
        <v-select
          v-model="selectedRouteName"
          :options="routeList"
          :reduce="(option: Types.RouteList) => option.label"
          :clearable="false"
          placeholder="選擇路線"
        />
        <div class="flex gap-4">
          <button
            type="submit"
            class="h-10 w-full rounded-full bg-primary-light text-sm font-bold text-white disabled:opacity-50"
            :disabled="!selectedRouteName"
          >
            搜尋
          </button>
          <button
            class="h-10 w-full rounded-full bg-primary-light text-sm font-bold text-white disabled:opacity-50 [&:hover>span]:hidden [&:hover]:before:content-['立即更新']"
            :disabled="!selectedRouteName || !routes.length"
            @click.prevent="refresh"
          >
            <span v-if="routes.length"> {{ time }} 秒後更新 </span>
            <span v-else> 立即更新 </span>
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
      <div class="table-container overflow-auto bg-white">
        <table class="w-full text-gray-900">
          <tr v-for="route in routes" class="h-10 odd:bg-[#F2F2F2] even:bg-[#FEFCFC]">
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
      <TheMap :geometry="geometry" />
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
.table-container {
  height: 300px;
}
@screen md {
  .table-container {
    height: calc(100vh - 410px);
  }
}
.map-container {
  grid-area: map;
}
footer {
  grid-area: footer;
}
</style>
