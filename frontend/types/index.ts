export interface RSIData {
  token_address: string;
  timestamp: number;
  price: number;
  rsi: number;
  period_count: number;
  block_time: number;
}

export interface ChartData {
  timestamp: number;
  price: number;
  rsi: number;
  time: string;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
}

export const TOKEN_ADDRESSES = [
  'FCuk4XWLR6fAJFTcQoMrm3KeywSt2X6wK4Ufh4Xjpump',
  'Ab6VFq1eje9J8zNCqE9RdjYESMTPgz6cdir5gzWv2fxt',
  'G5UZAVbAf46s7cKWoyKu8kYTip9DGTpbLZ2qa9Aq69dP',
  'CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM',
  '62qc2CNXwrYqQScmEdiZFFAnJR262PxWEuNQtxfafNgV'
];
