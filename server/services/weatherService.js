const axios = require('axios');

const getCurrentWeather = async (latitude, longitude) => {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      throw new Error('OpenWeather API key is missing');
    }

    const response = await axios.get(
      'https://api.openweathermap.org/data/2.5/weather',
      {
        params: {
          lat: latitude,
          lon: longitude,
          appid: apiKey,
          units: 'metric',
        },
        timeout: 10000,
      }
    );

    return {
      location: response.data.name,
      temperature: response.data.main.temp,
      feelsLike: response.data.main.feels_like,
      humidity: response.data.main.humidity,
      condition: response.data.weather[0].description,
      windSpeed: response.data.wind.speed,
    };
  } catch (error) {
    console.error(
      'Weather service error:',
      error.response?.data || error.message
    );

    throw new Error('Unable to retrieve weather information');
  }
};

module.exports = { getCurrentWeather };