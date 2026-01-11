import * as temperatureCycleService from '../services/temperatureCycleService.js';

// GET /api/cycles - Alle Zyklen mit Filtern
export const getCycles = async (req, res, next) => {
  try {
    const { startDate, endDate, cycleType } = req.query;
    
    // Standard: Letzte 30 Tage
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    
    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;
    
    // Validierung
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiges Datumsformat. Verwende ISO-Format (YYYY-MM-DD)'
      });
    }
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start-Datum muss vor End-Datum liegen'
      });
    }
    
    // Cycle Type Validierung
    let type = null;
    if (cycleType) {
      if (!['heating', 'cooling'].includes(cycleType)) {
        return res.status(400).json({
          success: false,
          message: 'cycleType muss "heating" oder "cooling" sein'
        });
      }
      type = cycleType;
    }
    
    const data = await temperatureCycleService.getCycles(start, end, type);
    
    res.status(200).json({
      success: true,
      count: data.length,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      cycleType: type || 'all',
      data
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/cycles/daily - Tagesstatistiken
export const getDailyStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Standard: Letzte 30 Tage
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    
    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;
    
    // Validierung
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiges Datumsformat. Verwende ISO-Format (YYYY-MM-DD)'
      });
    }
    
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start-Datum muss vor End-Datum liegen'
      });
    }
    
    const data = await temperatureCycleService.getDailyAverages(start, end);
    
    res.status(200).json({
      success: true,
      count: data.length,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      data
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/cycles/:date - Zyklen für bestimmten Tag
export const getCyclesByDate = async (req, res, next) => {
  try {
    const { date } = req.params;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Datum ist erforderlich (Format: YYYY-MM-DD)'
      });
    }
    
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Ungültiges Datumsformat. Verwende YYYY-MM-DD'
      });
    }
    
    const data = await temperatureCycleService.getCyclesByDate(dateObj);
    
    res.status(200).json({
      success: true,
      count: data.length,
      date: date,
      data
    });
  } catch (error) {
    next(error);
  }
};

