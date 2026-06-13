'use client'

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts'

interface ChartData {
  name: string
  percentage: number
  date: string | null
  is_absent: boolean
}

export default function PerformanceChart({ data }: { data: ChartData[] }) {
  if (!data || data.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-500 text-sm">No data available</div>
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload
      return (
        <div className="bg-[#0f1729]/95 backdrop-blur border border-slate-700 rounded-xl p-3 shadow-xl">
          <p className="text-sm font-semibold text-white mb-1">{label}</p>
          <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-wider">
            {dataPoint.date ? new Date(dataPoint.date).toLocaleDateString() : 'Date unknown'}
          </p>
          {dataPoint.is_absent ? (
            <p className="text-sm font-bold text-red-400">Absent</p>
          ) : (
            <p className="text-sm font-bold text-blue-400">
              Score: {payload[0].value}%
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorPerc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis 
          dataKey="name" 
          stroke="rgba(255,255,255,0.4)" 
          fontSize={11} 
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
        />
        <YAxis 
          stroke="rgba(255,255,255,0.4)" 
          fontSize={11}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }} />
        <Area 
          type="monotone" 
          dataKey="percentage" 
          stroke="#3b82f6" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorPerc)" 
          activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
