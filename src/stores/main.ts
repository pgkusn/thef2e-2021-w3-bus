import axios from 'axios'
import qs from 'qs'
import { useLocalStorage } from '@vueuse/core'
import * as Types from '@/types'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

export const useMainStore = defineStore('main', () => {
  const authorization = useLocalStorage('access_token', '')

  // 更新 token
  const refreshToken = async () => {
    try {
      const data = {
        grant_type: 'client_credentials',
        client_id: import.meta.env.VITE_CLIENT_ID,
        client_secret: import.meta.env.VITE_CLIENT_SECRET,
      }
      const { access_token } = await instance({
        method: 'post',
        url: '/auth/realms/TDXConnect/protocol/openid-connect/token',
        data: qs.stringify(data),
      }).then(res => res.data)
      authorization.value = `Bearer ${access_token}`
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message)
      }
    }
  }
  // 縣市列表
  const getCityList = async () => {
    try {
      return await instance({
        url: 'https://kenge-hsieh.firebaseio.com/city.json',
      }).then(res => res.data)
    } catch (error) {
      throw error
    }
  }
  // 市區公車之路線資料
  const getRouteList = async (city: string): Promise<Types.RouteList[]> => {
    try {
      const result = (await instance({
        url: `/api/basic/v2/Bus/Route/City/${city}`,
        headers: { Authorization: authorization.value },
      }).then(res => res.data)) as Types.ApiRouteList[]
      return result.map(el => {
        const set = new Set()
        const direction = el.SubRoutes.map(subEl => {
          const desc = [el.DestinationStopNameZh, el.DepartureStopNameZh]
          return {
            dir: subEl.Direction,
            desc: desc[subEl.Direction],
            headSign: subEl.Headsign,
          }
        }).filter(subEl => (!set.has(subEl.dir) ? set.add(subEl.dir) : false))
        const label =
          direction.length === 1
            ? `${el.RouteName.Zh_tw}【${direction[0].headSign}】`
            : el.RouteName.Zh_tw
        return {
          direction,
          label,
          routeName: el.RouteName.Zh_tw,
        }
      })
    } catch (error) {
      throw error
    }
  }
  // 市區公車之預估到站資料
  const getEstimatedTimeOfArrival = async (
    params: Types.ApiParam
  ): Promise<Types.ApiEstimatedTimeOfArrival[]> => {
    const { city, routeName } = params
    try {
      const result = (await instance({
        url: `/api/basic/v2/Bus/EstimatedTimeOfArrival/City/${city}/${routeName}`,
        headers: { Authorization: authorization.value },
      }).then(res => res.data)) as Types.ApiEstimatedTimeOfArrival[]
      return result.filter(el => el.RouteName.Zh_tw === routeName)
    } catch (error) {
      throw error
    }
  }
  // 市區公車之路線站序資料
  const getStopOfRoute = async (params: Types.ApiParam): Promise<Types.ApiStopOfRoute[]> => {
    const { city, routeName } = params
    try {
      const result = (await instance({
        url: `/api/basic/v2/Bus/StopOfRoute/City/${city}/${routeName}`,
        headers: { Authorization: authorization.value },
      }).then(res => res.data)) as Types.ApiStopOfRoute[]
      return result.filter(el => el.RouteName.Zh_tw === routeName)
    } catch (error) {
      throw error
    }
  }
  // 市區公車之線型資料
  const getShapeOfRoute = async (params: Types.ApiParam): Promise<Types.ApiShapeOfRoute[]> => {
    const { city, routeName } = params
    try {
      return await instance({
        url: `/api/basic/v2/Bus/Shape/City/${city}/${routeName}`,
        headers: { Authorization: authorization.value },
      }).then(res => res.data)
    } catch (error) {
      throw error
    }
  }

  return {
    authorization,
    refreshToken,
    getCityList,
    getRouteList,
    getEstimatedTimeOfArrival,
    getStopOfRoute,
    getShapeOfRoute,
  }
})
