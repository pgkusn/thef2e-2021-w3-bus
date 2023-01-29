import axios from 'axios'
import qs from 'qs'
import { useLocalStorage } from '@vueuse/core'

const basicAPI = axios.create({
  baseURL: 'https://tdx.transportdata.tw/api/basic',
})

export const useMainStore = defineStore('main', () => {
  const authorization = useLocalStorage('access_token', '')

  const refreshToken = async callback => {
    try {
      const data = {
        grant_type: 'client_credentials',
        client_id: import.meta.env.VITE_CLIENT_ID,
        client_secret: import.meta.env.VITE_CLIENT_SECRET,
      }
      const { access_token } = await axios({
        method: 'post',
        url: 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token',
        data: qs.stringify(data),
      }).then(res => res.data)
      authorization.value = `Bearer ${access_token}`
      return await callback()
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
      if (error.response.status === 429 || error.response.status === 401) {
        return await refreshToken(getCityList)
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
      if (error.response.status === 429 || error.response.status === 401) {
        return await refreshToken(() => getRouteList(city))
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
      if (error.response.status === 429 || error.response.status === 401) {
        return await refreshToken(() => getEstimatedTimeOfArrival(data))
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
      if (error.response.status === 429 || error.response.status === 401) {
        return await refreshToken(() => getStopOfRoute(data))
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
      if (error.response.status === 429 || error.response.status === 401) {
        return await refreshToken(() => getShapeOfRoute(data))
      }
      throw error
    }
  }

  return {
    authorization,
    getCityList,
    getRouteList,
    getEstimatedTimeOfArrival,
    getStopOfRoute,
    getShapeOfRoute,
  }
})
