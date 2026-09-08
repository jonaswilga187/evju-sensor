import * as weatherService from '../services/weatherService.js';

// GET /api/weather/24h - Außentemperatur der letzten 24h
export const get24HourTemperature = async (req, res, next) => {
  try {
    const latitude = req.query.latitude ? parseFloat(req.query.latitude) : 52.62;
    const longitude = req.query.longitude ? parseFloat(req.query.longitude) : 10.08;

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: 'Latitude und Longitude müssen numerisch sein'
      });
    }

    const data = await weatherService.get24HourTemperature(latitude, longitude);

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};
