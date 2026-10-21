const express = require('express');
const router = express.Router();

const { getCurrentWeather } = require('../services/weatherService');
const protect = require('../middleware/authMiddleware');

router.get('/current', protect, async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (
      latitude === undefined ||
      longitude === undefined ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return res.status(400).json({
        message: 'Valid latitude and longitude are required',
      });
    }

    const weather = await getCurrentWeather(lat, lon);

    res.status(200).json(weather);
  } catch (error) {
    res.status(502).json({
      message: error.message || 'Unable to retrieve weather information',
    });
  }
});

module.exports = router;