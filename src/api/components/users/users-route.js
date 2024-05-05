const express = require('express');

const authenticationMiddleware = require('../../middlewares/authentication-middleware');
const celebrate = require('../../../core/celebrate-wrappers');
const usersControllers = require('./users-controller');
const usersValidator = require('./users-validator');

const route = express.Router();

module.exports = (app) => {
  app.use('/users', route);

  // Get list of m-banking users
  route.get('/mbanking-info', authenticationMiddleware, usersControllers.getUsers);

  // Create new m-banking user
  route.post(
    '/new-bank-account',
    authenticationMiddleware,
    celebrate(usersValidator.createUser),
    usersControllers.createUser
  );

  // Get user detail
  route.get('/mbanking-info/:id', authenticationMiddleware, usersControllers.getUser);

  // Update user
  route.put(
    '/:id',
    authenticationMiddleware,
    celebrate(usersValidator.updateUser),
    usersControllers.updateUser
  );

  // Top-up bank balance
  route.put(
    '/top-up/:id',
    authenticationMiddleware,
    celebrate(usersValidator.topUp),
    usersControllers.topUp
  );

  // Delete user
  route.delete('/m-banking/delete/:id', authenticationMiddleware, celebrate(usersValidator.deleteUser),usersControllers.deleteUser);

  // Change password
  route.post(
    '/:id/change-password',
    authenticationMiddleware,
    celebrate(usersValidator.changePassword),
    usersControllers.changePassword
  );
};
