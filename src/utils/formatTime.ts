import dayjs from 'dayjs'

export const formatTime = (EstimateTime = -1, NextBusTime = -1) => {
  if (EstimateTime >= 180)
    return `<span class="text-primary-light">約 ${Math.floor(EstimateTime / 60)} 分</span>`
  if (EstimateTime > 0) return '<span class="text-[#FFBD37]">即將進站</span>'
  if (EstimateTime === 0) return '<span class="text-[salmon]">進站中</span>'

  if (NextBusTime === -1) return '未發車'

  return dayjs(NextBusTime).format('HH:mm')
}
