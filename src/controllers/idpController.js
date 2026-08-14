const idpService = require('../services/idpService');

exports.getProviders = async (req, res) => {
  try {
    const providers = await idpService.getAllProviders();
    res.status(200).json({
      items: providers,
      page: 0,
      pageSize: providers.length,
      totalElements: providers.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createProvider = async (req, res) => {
  try {
    const provider = await idpService.createProvider(req.body);
    res.status(201).json(provider);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.testProvider = async (req, res) => {
  try {
    const result = await idpService.testProvider(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status field is required' });
    }
    const result = await idpService.updateStatus(req.params.id, status);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};