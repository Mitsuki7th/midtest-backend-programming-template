const usersService = require('./users-service');
const { errorResponder, errorTypes } = require('../../../core/errors');
const { account_number } = require('../../../models/users-schema');

/**
 * Handle get list of users request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUsers(request, response, next) {
  try {
    // Pagination parameters
    const page = parseInt(request.query.page_number) || 1; // Query untuk nomor halaman saat ini
    const limit = parseInt(request.query.page_size) || undefined; // Query untuk banyak data yang ditampilkan dalam satu halaman
    const { search, sort } = request.query;

    // Memanggil function di userService yang mengimplementasikan query diatas
    const users = await usersService.getUsers(page, limit, search, sort);

    // Memeriksa jika hasil pencarian null
    if (users === null) {
      throw errorResponder(errorTypes.NOT_FOUND, 'Pengguna tidak ditemukan.');
    }

    return response.status(200).json(users);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle get user detail request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function getUser(request, response, next) {
  try {
    const user = await usersService.getUser(request.params.id);

    if (!user) {
      throw errorResponder(errorTypes.UNPROCESSABLE_ENTITY, 'Unknown user');
    }

    return response.status(200).json(user);
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle create user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function createUser(request, response, next) {
  try {
    const name = request.body.name;
    const email = request.body.email;
    const balance = request.body.balance || '0'; // Set balance to '0' if it's not provided
    const phone = request.body.phone_number;
    const password = request.body.password;
    const password_confirm = request.body.password_confirm;

    // Check confirmation password
    if (password !== password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Email must be unique
    const emailIsRegistered = await usersService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
);
    }

    // Generate user account number
    const account_number = await usersService.generateAccountNumber();

    const success = await usersService.createUser(name, email, phone, account_number, balance, password);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to create user'
      );
    }

    return response.status(200).json({ account_number, name, email, balance });
  } catch (error) {
    return next(error);
  }
}


/**
 * Handle update user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function updateUser(request, response, next) {
  try {
    const id = request.params.id;
    const name = request.body.name;
    const email = request.body.email;

    // Email must be unique
    const emailIsRegistered = await usersService.emailIsRegistered(email);
    if (emailIsRegistered) {
      throw errorResponder(
        errorTypes.EMAIL_ALREADY_TAKEN,
        'Email is already registered'
      );
    }

    const success = await usersService.updateUser(id, name, email);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to update user'
      );
    }

    return response.status(200).json({ id });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle user top-up request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function topUp(request, response, next) {
  try {
    const id = request.params.id;
    const account_number = request.body.account;
    let amount = request.body.amount;

    // Check if amount is a string
    if (typeof amount !== 'string') {
      throw errorResponder(
        errorTypes.INVALID_AMOUNT,
        'Invalid top-up amount(min. top-up 10000)'
      );
    }

    // Parse amount to float
    amount = parseFloat(amount);

    // Check if email is registered
    const accountRegistered = await usersService.getUAN(account_number);
    if (!accountRegistered) {
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Account is not valid'
      );
    }

    // Check if amount is valid
    if (isNaN(amount) || amount <= 0) {
      throw errorResponder(
        errorTypes.INVALID_CREDENTIALS,
        'Invalid top-up amount'
      );
    }

    // Update user balance
    const success = await usersService.updateBalance(id, amount, account_number);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to top-up user balance'
      );
    }

    return response.status(200).json({ message: `Top-up successful. You have topped up ${amount} to your bank account` });
  } catch (error) {
    return next(error);
  }
}

/**
 * Handle delete user request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function deleteUser(request, response, next) {
  try {
    const email = request.body.email;
    const password = request.body.password;
    const deleteConfirm = request.body.deleteConfirm;
    const id = request.params.id;

    // Check if email is registered
    const emailIsRegistered = await usersService.emailIsRegistered(email);
    if (!emailIsRegistered) {
      throw errorResponder(
        errorTypes.NOT_FOUND,
        'Email is not valid'
      );
    }

    // Check password
    if (!(await usersService.checkPassword(id, password))) {
      throw errorResponder(errorTypes.INVALID_CREDENTIALS, 'Wrong password');
    }

    // Check if the user has confirmed the deletion
    if (deleteConfirm !== 'Yes') {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Please confirm the deletion by entering "Yes"'
      );
    }

    const success = await usersService.deleteUser(id);
    if (!success) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to delete user'
      );
    }

    return response.status(200).json({ message:`m-banking user with id ${id} has been removed.` });
  } catch (error) {
    return next(error);
  }
}


/**
 * Handle change user password request
 * @param {object} request - Express request object
 * @param {object} response - Express response object
 * @param {object} next - Express route middlewares
 * @returns {object} Response object or pass an error to the next route
 */
async function changePassword(request, response, next) {
  try {
    // Check password confirmation
    if (request.body.password_new !== request.body.password_confirm) {
      throw errorResponder(
        errorTypes.INVALID_PASSWORD,
        'Password confirmation mismatched'
      );
    }

    // Check old password
    if (
      !(await usersService.checkPassword(
        request.params.id,
        request.body.password_old
      ))
    ) {
      throw errorResponder(errorTypes.INVALID_CREDENTIALS, 'Wrong password');
    }

    const changeSuccess = await usersService.changePassword(
      request.params.id,
      request.body.password_new
    );

    if (!changeSuccess) {
      throw errorResponder(
        errorTypes.UNPROCESSABLE_ENTITY,
        'Failed to change password'
      );
    }

    return response.status(200).json({ id: request.params.id });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  topUp,
};
