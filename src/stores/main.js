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
  const checkToken = async (status, callback) => {
    if (status === 429 || status === 401) {
      const { access_token } = await getToken()
      authorization.value = `Bearer ${access_token}`
      callback()
    }
  }
  const getCityList = async () => {
    try {
      return await basicAPI({
        url: '/v2/Basic/City',
        headers: { Authorization: authorization.value },
      }).then(res => res.data)
    } catch (error) {
      if (error.response) {
        checkToken(error.response.status, getCityList)
      }
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
      if (error.response) {
        checkToken(error.response.status, getRouteList)
      }
      throw error
    }
  }
  const getEstimatedTimeOfArrival = async data => {
    const { city, routeName } = data
    try {
      return await basicAPI({
        url: `/v2/Bus/EstimatedTimeOfArrival/City/${city}/${routeName}`,
        headers: { Authorization: authorization.value },
      }).then(res => res.data)
    } catch (error) {
      if (error.response) {
        checkToken(error.response.status, () => getEstimatedTimeOfArrival(data))
      }
      throw error
    }
  }
  const getStopOfRoute = async data => {
    const { city, routeName } = data
    try {
      return await basicAPI({
        url: `/v2/Bus/StopOfRoute/City/${city}/${routeName}`,
        headers: { Authorization: authorization.value },
      }).then(res => res.data)
    } catch (error) {
      if (error.response) {
        checkToken(error.response.status, () => getStopOfRoute(data))
      }
      throw error
    }
  }
  const getShapeOfRoute = async data => {
    const { city, routeName } = data
    try {
      return await basicAPI({
        url: `/v2/Bus/Shape/City/${city}/${routeName}`,
        headers: { Authorization: authorization.value },
      }).then(res => res.data)
    } catch (error) {
      if (error.response) {
        checkToken(error.response.status, () => getShapeOfRoute(data))
      }
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
    getShapeOfRoute,
  }
})
