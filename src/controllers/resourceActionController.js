const resourceActionService = require("../services/resourceActionService");

class ResourceActionController {
  async getResourceCategories(req, res, next) {
    try {
      const results = await resourceActionService.getResourceCategories();
      return res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }

  async getResources(req, res, next) {
    try {
      const { page, limit, status, userType, search } = req.query;

      const results = await resourceActionService.getResources({
        page,
        limit,
        status,
        userType,
        search,
      });
      return res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }

  async getResourcesById(req, res, next) {
    try {
      const results = await resourceActionService.getResourcesById(
        req.params.resourceId,
      );
      return res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }

  async getResourcesByCategories(req, res, next) {
    try {
      const results = await resourceActionService.getResourceByCategory(
        req.params.category,
      );
      return res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }

  async createResource(req, res, next) {
    try {
      const result = await resourceActionService.createResource(req.body);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateResource(req, res, next) {
    try {
      const result = await resourceActionService.updateResource(
        req.params.resourceId,
        req.body,
        req.auth.userId,
      );
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteResource(req, res, next) {
    try {
      const result = await resourceActionService.deleteResource(
        req.params.resourceId,
        req.body,
        req.auth.userId,
      );
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getActionCategories(req, res, next) {
    try {
      const results = await resourceActionService.getActionCategories();
      return res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }

  async getActions(req, res, next) {
    try {
      const { page, limit, status, userType, search } = req.query;

      const results = await resourceActionService.getActions({
        page,
        limit,
        status,
        userType,
        search,
      });
      return res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }

  async getActionsById(req, res, next) {
    try {
      const results = await resourceActionService.getActionsById(
        req.params.actionId,
      );
      return res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }

  async getActionsByCategories(req, res, next) {
    try {
      const results = await resourceActionService.getActionByCategory(
        req.params.category,
      );
      return res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }
  async createAction(req, res, next) {
    try {
      const result = await resourceActionService.createAction(req.body);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateAction(req, res, next) {
    try {
      const result = await resourceActionService.updateAction(
        req.params.actionId,
        req.body,
        req.auth.userId,
      );
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteAction(req, res, next) {
    try {
      const result = await resourceActionService.deleteAction(
        req.params.actionId,
        req.body,
        req.auth.userId,
      );
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ResourceActionController();
