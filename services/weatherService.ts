
import { WeatherData } from '../types';

export class WeatherService {
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    try {
      // Fetch current weather and solar data
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,rain,weather_code&daily=sunrise,sunset&timezone=auto`;
      const weatherRes = await fetch(weatherUrl);
      const weatherJson = await weatherRes.json();
      
      const current = weatherJson.current;
      const daily = weatherJson.daily;
      const isRaining = current.rain > 0 || (current.weather_code >= 51 && current.weather_code <= 67) || (current.weather_code >= 80 && current.weather_code <= 82);

      // Fetch Air Quality
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi`;
      const aqiRes = await fetch(aqiUrl);
      const aqiJson = await aqiRes.json();
      const aqi = aqiJson.current?.us_aqi || 50;

      let aqiLabel: WeatherData['aqiLabel'] = 'Good';
      if (aqi > 50) aqiLabel = 'Moderate';
      if (aqi > 100) aqiLabel = 'Unhealthy';
      if (aqi > 200) aqiLabel = 'Hazardous';

      const month = new Date().getMonth();
      let seasonCode: WeatherData['seasonCode'] = 'Spring';
      if (month >= 5 && month <= 8) seasonCode = 'Monsoon';
      else if (month >= 2 && month <= 4) seasonCode = 'Summer';
      else if (month >= 10 || month <= 1) seasonCode = 'Winter';

      if (isRaining) seasonCode = 'Monsoon';

      return {
        temp: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        isRaining,
        aqi,
        aqiLabel,
        seasonCode,
        sunrise: daily.sunrise[0],
        sunset: daily.sunset[0]
      };

    } catch (error) {
      console.error("Weather fetch failed", error);
      return {
        temp: 25,
        humidity: 60,
        isRaining: false,
        aqi: 50,
        aqiLabel: 'Good',
        seasonCode: 'Spring'
      };
    }
  }
}
