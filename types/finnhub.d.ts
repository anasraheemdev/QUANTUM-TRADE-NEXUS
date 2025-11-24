declare module 'finnhub' {
  export class DefaultApi {
    constructor(apiKey?: string);
    apiKey?: string;
    quote(symbol: string, callback: (error: any, data: any, response: any) => void): void;
    stockCandles(symbol: string, resolution: string, from: number, to: number, callback: (error: any, data: any, response: any) => void): void;
    companyProfile(params: { symbol?: string; isin?: string; cusip?: string }, callback: (error: any, data: any, response: any) => void): void;
    companyProfile2(params: { symbol?: string; isin?: string; cusip?: string }, callback: (error: any, data: any, response: any) => void): void;
    [key: string]: any;
  }
  
  const finnhub: {
    DefaultApi: new (apiKey?: string) => DefaultApi;
  };
  
  export default finnhub;
}

