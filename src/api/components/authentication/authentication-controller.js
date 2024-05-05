const { errorResponder, errorTypes } = require('../../../core/errors');
const authenticationServices = require('./authentication-service');


/**
 * Handle login request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */

// Object to track failed login attempts
let loginAttempts = {};

async function login(request, response, next) {
  const { email, password } = request.body;

// Helper function to calculate remaining time until the attempts limit resets
const calculateRemainingTime = (email) => {
  const lastAttemptTime = loginAttempts[email].timestamp;
  const elapsedTime = (Date.now() - lastAttemptTime) / 1000; // Convert milliseconds to minutes
  return Math.max(0, 1800 - Math.floor(elapsedTime)); // Assuming the limit resets after 30 minutes (1800 seconds)
};

  try {
    // Get the number of failed attempts for the email
    if (loginAttempts[email] === undefined) {
      loginAttempts[email] = {
        count: 1,
        timestamp: new Date().getTime(),
      };
    }

    const attempts = loginAttempts[email].count;

    // Check if the number of attempts exceeds the limit
    if (attempts > 5) {
      const remainingTime = calculateRemainingTime(email);
      throw errorResponder(
        errorTypes.FORBIDDEN,
        `Too many failed login attempts. Please try again in ${(remainingTime / 60).toFixed(2)} minutes.`
      );
    }

    // Check login credentials
    const loginSuccess = await authenticationServices.checkLoginCredentials(
      email,
      password
    );

    if (!loginSuccess) {
      loginAttempts[email].count = attempts + 1;
      loginAttempts[email].timestamp = new Date().getTime();

      throw errorResponder(
        errorTypes.FORBIDDEN, // Unauthorized status code
        'Wrong email or password'
      );
    }

    // If login succeeds, reset failed attempts
    delete loginAttempts[email];

    return response.status(200).json(loginSuccess);
  } catch (error) {
    return next(error); // Pass any error to the next middleware
  }
}

module.exports = {
  login,
};
