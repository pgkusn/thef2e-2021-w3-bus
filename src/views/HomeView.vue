<template>
  <div class="w-[500px]">
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
      <button type="submit">查詢</button>
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
          <th class="p-4 font-normal text-gray-900 border-b-2 dark:border-dark-5 whitespace-nowrap">
            站名
          </th>
          <th class="p-4 font-normal text-gray-900 border-b-2 dark:border-dark-5 whitespace-nowrap">
            預估到站
          </th>
          <th class="p-4 font-normal text-gray-900 border-b-2 dark:border-dark-5 whitespace-nowrap">
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
</template>

<script setup>
import dayjs from 'dayjs'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'
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

watch(selected, () => {
  routeStop.value = []
})
watch(
  () => selected.city,
  () => {
    selected.routeName = ''
  }
)

onMounted(() => {
  getCityList()
  if (props.city && props.routeName) {
    getRouteList()
    search()
  }
})
</script>
