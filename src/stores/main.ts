import axios, { AxiosError } from 'axios'
import qs from 'qs'
import { useLocalStorage } from '@vueuse/core'
import * as Types from '@/types'

const tdxApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export const useMainStore = defineStore('main', () => {
  const authorization = useLocalStorage('access_token', '')

  // 更新 token
  const refreshToken = async (callback: () => Promise<unknown>) => {
    try {
      const data = {
        grant_type: 'client_credentials',
        client_id: import.meta.env.VITE_CLIENT_ID,
        client_secret: import.meta.env.VITE_CLIENT_SECRET,
      }
      const { access_token } = await tdxApi({
        method: 'post',
        url: '/auth/realms/TDXConnect/protocol/openid-connect/token',
        data: qs.stringify(data),
      }).then(res => res.data)
      authorization.value = `Bearer ${access_token}`
      callback()
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message)
      }
    }
  }
  // 縣市列表
  const getCityList = async () => {
    try {
      return await tdxApi({
        url: '/api/basic/v2/Basic/City',
        headers: { Authorization: authorization.value },
      }).then(res => res.data)
    } catch (error) {
      const axiosError = error as AxiosError
      if (
        axiosError.response &&
        (axiosError.response.status === 429 || axiosError.response.status === 401)
      ) {
        refreshToken(getCityList)
      }
      throw error
    }
  }
  // 市區公車之路線資料
  const getRouteList = async (city: string): Promise<Types.ApiRouteList[]> => {
    try {
      return await tdxApi({
        url: `/api/basic/v2/Bus/Route/City/${city}`,
        headers: { Authorization: authorization.value },
      }).then(res => res.data)
    } catch (error) {
      const axiosError = error as AxiosError
      if (
        axiosError.response &&
        (axiosError.response.status === 429 || axiosError.response.status === 401)
      ) {
        refreshToken(() => getRouteList(city))
      }
      throw error
    }
  }
  // 市區公車之預估到站資料
  const getEstimatedTimeOfArrival = async (
    data: Types.ApiParam
  ): Promise<Types.ApiEstimatedTimeOfArrival[]> => {
    const { city, routeName } = data
    try {
      return await tdxApi({
        url: `/api/basic/v2/Bus/EstimatedTimeOfArrival/City/${city}/${routeName}`,
        headers: { Authorization: authorization.value },
      }).then(res => res.data)
    } catch (error) {
      const axiosError = error as AxiosError
      if (
        axiosError.response &&
        (axiosError.response.status === 429 || axiosError.response.status === 401)
      ) {
        refreshToken(() => getEstimatedTimeOfArrival(data))
      }
      throw error
    }
  }
  // 市區公車之路線站序資料
  const getStopOfRoute = async (data: Types.ApiParam): Promise<Types.ApiStopOfRoute[]> => {
    const { city, routeName } = data
    try {
      return await tdxApi({
        url: `/api/basic/v2/Bus/StopOfRoute/City/${city}/${routeName}`,
        headers: { Authorization: authorization.value },
      }).then(res => res.data)
    } catch (error) {
      const axiosError = error as AxiosError
      if (
        axiosError.response &&
        (axiosError.response.status === 429 || axiosError.response.status === 401)
      ) {
        refreshToken(() => getStopOfRoute(data))
      }
      throw error
    }
  }
  // 市區公車之線型資料
  const getShapeOfRoute = async (data: Types.ApiParam): Promise<Types.ApiShapeOfRoute[]> => {
    const { city, routeName } = data
    try {
      return await tdxApi({
        url: `/api/basic/v2/Bus/Shape/City/${city}/${routeName}`,
        headers: { Authorization: authorization.value },
      }).then(res => res.data)
    } catch (error) {
      const axiosError = error as AxiosError
      if (
        axiosError.response &&
        (axiosError.response.status === 429 || axiosError.response.status === 401)
      ) {
        refreshToken(() => getShapeOfRoute(data))
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
