import * as analysisService from '../services/analysisService.js';

// GET /api/analysis/consumption?days=30
export const getConsumptionComparison = async (req, res, next) => {
  try {
    const days = req.query.days ? parseInt(req.query.days, 10) : 30;
    const data = await analysisService.getConsumptionComparison(days);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
