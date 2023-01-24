import axios from 'axios'
import qs from 'qs'
import { useLocalStorage } from '@vueuse/core'

const basicAPI = axios.create({
  baseURL: 'https://tdx.transportdata.tw/api/basic',
})

export const useMainStore = defineStore('main', () => {
  const authorization = useLocalStorage('access_token', '')
  const isLoading = ref(false)

  const getToken = async () => {
    try {
      const data = {
        grant_type: 'client_credentials',
        client_id: import.meta.env.VITE_CLIENT_ID,
        client_secret: import.meta.env.VITE_CLIENT_SECRET,
      }
      return await axios({
        method: 'post',
        url: 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token',
        data: qs.stringify(data),
      }).then(res => res.data)
    } catch (error) {
      console.error(error.message)
    }
  }
  const getCityList = async () => {
    try {
      return await basicAPI({
        url: '/v2/Basic/City',
        headers: { Authorization: authorization.value },
      }).then(res => res.data)
    } catch (error) {
      throw error
    }
  }
  const getRouteList = async city => {
    try {
      return await basicAPI({
        url: `/v2/Bus/Route/City/${city}`,
        headers: { Authorization: authorization.value },
      }).then(res => res.data)
    } catch (error) {
      throw error
    }
  }
  const getEstimatedTimeOfArrival = async ({ city, routeName }) => {
    try {
      return await basicAPI({
        url: `/v2/Bus/EstimatedTimeOfArrival/City/${city}/${routeName}`,
        headers: { Authorization: authorization.value },
      }).then(res => res.data)
    } catch (error) {
      throw error
    }
  }
  const getStopOfRoute = async ({ city, routeName }) => {
    try {
      return await basicAPI({
        url: `/v2/Bus/StopOfRoute/City/${city}/${routeName}`,
        headers: { Authorization: authorization.value },
      }).then(res => res.data)
    } catch (error) {
      throw error
    }
  }

  return {
    authorization,
    isLoading,
    getToken,
    getCityList,
    getRouteList,
    getEstimatedTimeOfArrival,
    getStopOfRoute,
  }
})
