import { describe, it, expect } from 'vitest'
import { formatTime } from './formatTime'
import dayjs from 'dayjs'

describe('formatTime', () => {
  describe('Critical Tests - Core Functionality', () => {
    describe('EstimateTime >= 180 (時間間隔顯示)', () => {
      it('應該返回約 X 分的 HTML 格式當 EstimateTime 為 180', () => {
        const result = formatTime(180)
        expect(result).toBe('<span class="text-primary-light">約 3 分</span>')
      })

      it('應該正確計算分鐘數當 EstimateTime 為 300 秒', () => {
        const result = formatTime(300)
        expect(result).toBe('<span class="text-primary-light">約 5 分</span>')
      })

      it('應該正確計算分鐘數當 EstimateTime 為 600 秒', () => {
        const result = formatTime(600)
        expect(result).toBe('<span class="text-primary-light">約 10 分</span>')
      })

      it('應該向下取整分鐘數當 EstimateTime 為 199 秒', () => {
        const result = formatTime(199)
        expect(result).toBe('<span class="text-primary-light">約 3 分</span>')
      })

      it('應該正確處理大的 EstimateTime 值 (3600 秒)', () => {
        const result = formatTime(3600)
        expect(result).toBe('<span class="text-primary-light">約 60 分</span>')
      })

      it('應該正確處理邊界值 EstimateTime = 180', () => {
        const result = formatTime(180)
        expect(result).toContain('約 3 分')
      })

      it('應該返回包含正確 CSS 類名的 HTML', () => {
        const result = formatTime(180)
        expect(result).toContain('class="text-primary-light"')
      })

      it('應該使用 Math.floor 進行計算（向下取整）', () => {
        const result = formatTime(299)
        expect(result).toBe('<span class="text-primary-light">約 4 分</span>')
      })
    })

    describe('EstimateTime > 0 且 < 180 (即將進站)', () => {
      it('應該返回即將進站的 HTML 當 EstimateTime 為 1', () => {
        const result = formatTime(1)
        expect(result).toBe('<span class="text-#FFBD37">即將進站</span>')
      })

      it('應該返回即將進站的 HTML 當 EstimateTime 為 60', () => {
        const result = formatTime(60)
        expect(result).toBe('<span class="text-#FFBD37">即將進站</span>')
      })

      it('應該返回即將進站的 HTML 當 EstimateTime 為 179', () => {
        const result = formatTime(179)
        expect(result).toBe('<span class="text-#FFBD37">即將進站</span>')
      })

      it('應該返回包含正確顏色代碼的 HTML', () => {
        const result = formatTime(50)
        expect(result).toContain('text-#FFBD37')
      })
    })

    describe('EstimateTime === 0 (進站中)', () => {
      it('應該返回進站中的 HTML 當 EstimateTime 為 0', () => {
        const result = formatTime(0)
        expect(result).toBe('<span class="text-#FA8072">進站中</span>')
      })

      it('應該返回包含正確顏色代碼的 HTML', () => {
        const result = formatTime(0)
        expect(result).toContain('text-#FA8072')
      })
    })

    describe('NextBusTime === -1 (未發車)', () => {
      it('應該返回未發車 當 EstimateTime 為 -1 且 NextBusTime 為 -1（默認參數）', () => {
        const result = formatTime()
        expect(result).toBe('未發車')
      })

      it('應該返回未發車 當顯式傳遞 EstimateTime 為 -1 且 NextBusTime 為 -1', () => {
        const result = formatTime(-1, -1)
        expect(result).toBe('未發車')
      })

      it('應該返回未發車 當 EstimateTime 為 -1 且 NextBusTime 為 -1', () => {
        const result = formatTime(-1, -1)
        expect(result).toBe('未發車')
      })
    })

    describe('默認情況 - 格式化時間字符串', () => {
      it('應該返回格式化的時間 當 NextBusTime 為有效時間戳', () => {
        const timestamp = dayjs('2024-01-15 10:30:00').valueOf()
        const result = formatTime(-1, timestamp)
        expect(result).toBe('10:30')
      })

      it('應該返回 HH:mm 格式', () => {
        const timestamp = dayjs('2024-01-15 23:45:00').valueOf()
        const result = formatTime(-1, timestamp)
        expect(result).toBe('23:45')
      })

      it('應該正確處理早上的時間', () => {
        const timestamp = dayjs('2024-01-15 00:05:00').valueOf()
        const result = formatTime(-1, timestamp)
        expect(result).toBe('00:05')
      })

      it('應該正確處理午夜前的時間', () => {
        const timestamp = dayjs('2024-01-15 23:59:00').valueOf()
        const result = formatTime(-1, timestamp)
        expect(result).toBe('23:59')
      })
    })
  })

  describe('Important Tests - Edge Cases and Error Handling', () => {
    describe('邊界條件 - EstimateTime', () => {
      it('應該在 EstimateTime 為 179.9 時返回即將進站（邊界）', () => {
        const result = formatTime(179.9)
        expect(result).toBe('<span class="text-#FFBD37">即將進站</span>')
      })

      it('應該在 EstimateTime 為 180 時返回約分 HTML（臨界點）', () => {
        const result = formatTime(180)
        expect(result).toContain('約')
      })

      it('應該處理非常小的正數 EstimateTime', () => {
        const result = formatTime(0.1)
        expect(result).toBe('<span class="text-#FFBD37">即將進站</span>')
      })

      it('應該準確區分 EstimateTime 為 0 和 > 0', () => {
        const result0 = formatTime(0)
        const result1 = formatTime(1)
        expect(result0).not.toBe(result1)
        expect(result0).toContain('進站中')
        expect(result1).toContain('即將進站')
      })
    })

    describe('不同參數組合', () => {
      it('應該優先考慮 EstimateTime 而忽略 NextBusTime 當 EstimateTime >= 0', () => {
        const timestamp = dayjs('2024-01-15 10:30:00').valueOf()
        const result = formatTime(100, timestamp)
        expect(result).toBe('<span class="text-#FFBD37">即將進站</span>')
        expect(result).not.toContain('10:30')
      })

      it('應該正確處理 EstimateTime 為 0 而忽略 NextBusTime', () => {
        const timestamp = dayjs('2024-01-15 10:30:00').valueOf()
        const result = formatTime(0, timestamp)
        expect(result).toBe('<span class="text-#FA8072">進站中</span>')
        expect(result).not.toContain('10:30')
      })

      it('應該在 EstimateTime 為 -1 且 NextBusTime 有效時返回時間', () => {
        const timestamp = dayjs('2024-01-15 10:30:00').valueOf()
        const result = formatTime(-1, timestamp)
        expect(result).toBe('10:30')
      })

      it('應該當只傳遞一個參數時，第二個參數使用默認值 -1', () => {
        const result = formatTime(100)
        expect(result).toBe('<span class="text-#FFBD37">即將進站</span>')
      })
    })

    describe('負數和特殊值處理', () => {
      it('應該返回未發車 當 EstimateTime 為 -1 且 NextBusTime 為 -1', () => {
        const result = formatTime(-1, -1)
        expect(result).toBe('未發車')
      })

      it('應該返回未發車 當 EstimateTime 為負數且 NextBusTime 為 -1', () => {
        const result = formatTime(-100, -1)
        expect(result).toBe('未發車')
      })

      it('應該返回時間 當 EstimateTime 為負數但 NextBusTime 有效', () => {
        const timestamp = dayjs('2024-01-15 14:20:00').valueOf()
        const result = formatTime(-1, timestamp)
        expect(result).toBe('14:20')
      })

      it('應該處理 EstimateTime 為 -2 的情況', () => {
        const result = formatTime(-2, -1)
        expect(result).toBe('未發車')
      })
    })

    describe('HTML 輸出驗證', () => {
      it('應該返回有效的 HTML span 元素 對於估計時間', () => {
        const result = formatTime(300)
        expect(result).toMatch(/^<span[^>]*>.*<\/span>$/)
      })

      it('應該返回有效的 HTML span 元素 對於即將進站', () => {
        const result = formatTime(60)
        expect(result).toMatch(/^<span[^>]*>即將進站<\/span>$/)
      })

      it('應該返回有效的 HTML span 元素 對於進站中', () => {
        const result = formatTime(0)
        expect(result).toMatch(/^<span[^>]*>進站中<\/span>$/)
      })

      it('應該在 HTML 中包含適當的文本', () => {
        const result180 = formatTime(180)
        const result60 = formatTime(60)
        const result0 = formatTime(0)

        expect(result180).toContain('約')
        expect(result60).toContain('即將進站')
        expect(result0).toContain('進站中')
      })
    })

    describe('dayjs 時間格式化', () => {
      it('應該使用 dayjs 正確格式化時間戳', () => {
        const testDate = dayjs('2024-01-15 15:45:30')
        const timestamp = testDate.valueOf()
        const result = formatTime(-1, timestamp)
        const expected = testDate.format('HH:mm')
        expect(result).toBe(expected)
      })

      it('應該處理 0 時間戳（1970-01-01 00:00:00）', () => {
        const result = formatTime(-1, 0)
        const expected = dayjs(0).format('HH:mm')
        expect(result).toBe(expected)
      })

      it('應該處理大的時間戳值', () => {
        const largeTimestamp = dayjs('2025-12-31 22:15:00').valueOf()
        const result = formatTime(-1, largeTimestamp)
        const expected = dayjs(largeTimestamp).format('HH:mm')
        expect(result).toBe(expected)
      })

      it('應該保持時區無關的格式', () => {
        const timestamp = dayjs('2024-01-15 18:30:00').valueOf()
        const result = formatTime(-1, timestamp)
        expect(result).toMatch(/^\d{2}:\d{2}$/)
      })
    })
  })

  describe('Nice-to-have Tests - Extended Scenarios', () => {
    describe('數值計算精度', () => {
      it('應該正確計算 181 秒為 3 分', () => {
        const result = formatTime(181)
        expect(result).toContain('約 3 分')
      })

      it('應該正確計算 239 秒為 3 分', () => {
        const result = formatTime(239)
        expect(result).toContain('約 3 分')
      })

      it('應該正確計算 240 秒為 4 分', () => {
        const result = formatTime(240)
        expect(result).toContain('約 4 分')
      })

      it('應該正確計算 359 秒為 5 分', () => {
        const result = formatTime(359)
        expect(result).toContain('約 5 分')
      })

      it('應該正確計算 3599 秒為 59 分', () => {
        const result = formatTime(3599)
        expect(result).toContain('約 59 分')
      })

      it('應該正確計算 3600 秒為 60 分', () => {
        const result = formatTime(3600)
        expect(result).toContain('約 60 分')
      })
    })

    describe('返回值類型驗證', () => {
      it('應該始終返回字符串類型', () => {
        expect(typeof formatTime()).toBe('string')
        expect(typeof formatTime(0)).toBe('string')
        expect(typeof formatTime(100)).toBe('string')
        expect(typeof formatTime(300)).toBe('string')
        expect(typeof formatTime(-1, dayjs().valueOf())).toBe('string')
      })

      it('應該返回非空字符串', () => {
        expect(formatTime()).toBeTruthy()
        expect(formatTime(0)).toBeTruthy()
        expect(formatTime(100)).toBeTruthy()
        expect(formatTime(300)).toBeTruthy()
      })
    })

    describe('多次調用一致性', () => {
      it('應該對相同的輸入返回相同的輸出', () => {
        const input = 300
        const result1 = formatTime(input)
        const result2 = formatTime(input)
        expect(result1).toBe(result2)
      })

      it('應該對不同的輸入返回不同的輸出', () => {
        const result0 = formatTime(0)
        const result100 = formatTime(100)
        const result200 = formatTime(200)
        expect(result0).not.toBe(result100)
        expect(result100).not.toBe(result200)
      })
    })

    describe('特殊情況組合', () => {
      it('應該處理 EstimateTime 為 0 無論 NextBusTime 的值', () => {
        const result1 = formatTime(0, -1)
        const result2 = formatTime(0, dayjs('2024-01-15 10:00:00').valueOf())
        expect(result1).toBe(result2)
        expect(result1).toContain('進站中')
      })

      it('應該在 EstimateTime 為正數時忽略 NextBusTime', () => {
        const timestamp = dayjs('2024-01-15 10:00:00').valueOf()
        const result1 = formatTime(100, -1)
        const result2 = formatTime(100, timestamp)
        expect(result1).toBe(result2)
      })

      it('應該在 EstimateTime 為 180+ 時忽略 NextBusTime', () => {
        const timestamp = dayjs('2024-01-15 10:00:00').valueOf()
        const result1 = formatTime(300, -1)
        const result2 = formatTime(300, timestamp)
        expect(result1).toBe(result2)
      })
    })

    describe('中文文本驗證', () => {
      it('應該包含正確的中文文本「約」', () => {
        const result = formatTime(300)
        expect(result).toContain('約')
      })

      it('應該包含正確的中文文本「分」', () => {
        const result = formatTime(300)
        expect(result).toContain('分')
      })

      it('應該包含正確的中文文本「即將進站」', () => {
        const result = formatTime(60)
        expect(result).toContain('即將進站')
      })

      it('應該包含正確的中文文本「進站中」', () => {
        const result = formatTime(0)
        expect(result).toContain('進站中')
      })

      it('應該包含正確的中文文本「未發車」', () => {
        const result = formatTime(-1, -1)
        expect(result).toContain('未發車')
      })
    })

    describe('參數默認值驗證', () => {
      it('應該使用 -1 作為 EstimateTime 的默認值', () => {
        const resultNoArgs = formatTime()
        const resultWithDefault = formatTime(-1, -1)
        expect(resultNoArgs).toBe(resultWithDefault)
      })

      it('應該使用 -1 作為 NextBusTime 的默認值', () => {
        const resultPartial = formatTime(100)
        const resultWithDefault = formatTime(100, -1)
        expect(resultPartial).toBe(resultWithDefault)
      })
    })

    describe('浮點數精度', () => {
      it('應該正確處理浮點數的分鐘計算', () => {
        const result = formatTime(180.5)
        expect(result).toContain('約 3 分')
      })

      it('應該在使用 Math.floor 時向下取整浮點數', () => {
        const result = formatTime(599.9)
        expect(result).toContain('約 9 分')
        expect(result).not.toContain('約 10 分')
      })
    })
  })

  describe('Integration Tests - Real-world Scenarios', () => {
    it('公車到達時間流程：尚未發車 -> 即將進站 -> 進站中 -> 已發車', () => {
      const scenario1 = formatTime(-1, -1)
      const scenario2 = formatTime(60)
      const scenario3 = formatTime(0)
      const scenario4 = formatTime(-1, dayjs('2024-01-15 10:30:00').valueOf())

      expect(scenario1).toBe('未發車')
      expect(scenario2).toContain('即將進站')
      expect(scenario3).toContain('進站中')
      expect(scenario4).toContain(':')
    })

    it('應該在不同時間段返回適當的信息', () => {
      const times = [
        { input: formatTime(0), expected: '進站中' },
        { input: formatTime(30), expected: '即將進站' },
        { input: formatTime(180), expected: '約' },
        { input: formatTime(600), expected: '約 10 分' },
        { input: formatTime(-1, -1), expected: '未發車' },
      ]

      times.forEach(({ input, expected }) => {
        expect(input).toContain(expected)
      })
    })

    it('應該在顯示時間時使用 24 小時格式', () => {
      const morningTime = dayjs('2024-01-15 06:30:00').valueOf()
      const afternoonTime = dayjs('2024-01-15 14:45:00').valueOf()
      const eveningTime = dayjs('2024-01-15 22:15:00').valueOf()

      expect(formatTime(-1, morningTime)).toBe('06:30')
      expect(formatTime(-1, afternoonTime)).toBe('14:45')
      expect(formatTime(-1, eveningTime)).toBe('22:15')
    })
  })
})
