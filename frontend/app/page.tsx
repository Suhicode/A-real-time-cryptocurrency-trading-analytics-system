'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #1a1a1a;
  margin-bottom: 10px;
  font-size: 2.5rem;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1.1rem;
`;

const Controls = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  align-items: center;
  justify-content: center;
`;

const Select = styled.select`
  padding: 10px 15px;
  border: 2px solid #e1e1e1;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: #0070f3;
  }
`;

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e1e1e1;
`;

const ChartTitle = styled.h2`
  margin: 0 0 20px 0;
  color: #1a1a1a;
  font-size: 1.3rem;
  text-align: center;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e1e1e1;
  text-align: center;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 5px;
`;

const StatValue = styled.div`
  color: #1a1a1a;
  font-size: 1.5rem;
  font-weight: bold;
`;

const StatusIndicator = styled.div<{ $connected: boolean }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$connected === true ? '#10b981' : '#ef4444'};
  margin-right: 10px;
`;

const StatusText = styled.div`
  color: #666;
  font-size: 0.9rem;
  text-align: center;
  margin-top: 10px;
`;

interface RSIData {
  token_address: string;
  timestamp: number;
  price: number;
  rsi: number;
  period_count: number;
  block_time: number;
}

interface ChartData {
  timestamp: number;
  price: number;
  rsi: number;
  time: string;
}

const TOKEN_ADDRESSES = [
  'FCuk4XWLR6fAJFTcQoMrm3KeywSt2X6wK4Ufh4Xjpump',
  'Ab6VFq1eje9J8zNCqE9RdjYESMTPgz6cdir5gzWv2fxt',
  'G5UZAVbAf46s7cKWoyKu8kYTip9DGTpbLZ2qa9Aq69dP',
  'CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM',
  '62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV'
];

export default function Dashboard() {
  const [selectedToken, setSelectedToken] = useState(TOKEN_ADDRESSES[0]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [currentRSI, setCurrentRSI] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch RSI data from API
  const fetchRSIData = useCallback(async (token: string) => {
    try {
      const response = await fetch(`/api/rsi?token=${encodeURIComponent(token)}`);
      if (response.ok) {
        const rsiData: RSIData = await response.json();
        const chartPoint: ChartData = {
          timestamp: rsiData.timestamp,
          price: rsiData.price,
          rsi: rsiData.rsi,
          time: new Date(rsiData.timestamp).toLocaleTimeString(),
        };

        setChartData(prev => {
          const filtered = prev.filter(p => p.timestamp > Date.now() - 3600000); // Keep last hour
          return [...filtered, chartPoint].slice(-100); // Keep last 100 points
        });

        setCurrentPrice(rsiData.price);
        setCurrentRSI(rsiData.rsi);
        setIsConnected(true);
      } else {
        console.error('Failed to fetch RSI data');
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error fetching RSI data:', error);
      setIsConnected(false);
    }
  }, []);

  // Fetch data when token changes
  useEffect(() => {
    fetchRSIData(selectedToken);
  }, [selectedToken, fetchRSIData]);

  // Poll for new data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRSIData(selectedToken);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedToken, fetchRSIData]);

  const handleTokenChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedToken(event.target.value);
  };

  return (
    <Container>
      <Header>
        <Title>Cryptocurrency Trading Analytics</Title>
        <Subtitle>Real-time price and RSI data from pump.fun</Subtitle>
      </Header>

      <Controls>
        <Select value={selectedToken} onChange={handleTokenChange}>
          {TOKEN_ADDRESSES.map(token => (
            <option key={token} value={token}>
              {token.substring(0, 8)}...{token.substring(token.length - 6)}
            </option>
          ))}
        </Select>
        <StatusText>
          <StatusIndicator $connected={isConnected} />
          {isConnected ? 'Connected to Redpanda' : 'Disconnected from Redpanda'}
        </StatusText>
      </Controls>

      <StatsContainer>
        <StatCard>
          <StatLabel>Current Price (SOL)</StatLabel>
          <StatValue>{currentPrice.toFixed(8)}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>RSI (14-period)</StatLabel>
          <StatValue>{currentRSI.toFixed(2)}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Data Points</StatLabel>
          <StatValue>{chartData.length}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Selected Token</StatLabel>
          <StatValue>{TOKEN_ADDRESSES.indexOf(selectedToken) + 1}/5</StatValue>
        </StatCard>
      </StatsContainer>

      <DashboardContainer>
        <ChartContainer>
          <ChartTitle>Price Chart</ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                domain={['dataMin - 0.00000001', 'dataMax + 0.00000001']}
              />
              <Tooltip
                formatter={(value: number) => [value.toFixed(8), 'Price (SOL)']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#0070f3"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer>
          <ChartTitle>RSI Chart</ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [value.toFixed(2), 'RSI']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="5 5" />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="5 5" />
              <Line
                type="monotone"
                dataKey="rsi"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </DashboardContainer>

      <StatsContainer>
        <StatCard>
          <StatLabel>RSI Status</StatLabel>
          <StatValue style={{ color: currentRSI > 70 ? '#ef4444' : currentRSI < 30 ? '#10b981' : '#1a1a1a' }}>
            {currentRSI > 70 ? 'Overbought' : currentRSI < 30 ? 'Oversold' : 'Neutral'}
          </StatValue>
        </StatCard>
        <StatCard>
          <StatLabel>Last Update</StatLabel>
          <StatValue>
            {chartData.length > 0
              ? new Date(chartData[chartData.length - 1].timestamp).toLocaleTimeString()
              : 'No data'
            }
          </StatValue>
        </StatCard>
      </StatsContainer>
    </Container>
  );
}
