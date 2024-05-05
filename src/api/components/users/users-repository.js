const { toNumber } = require('lodash');
const { User } = require('../../../models');
const { account_number } = require('../../../models/users-schema');

/**
 * Get a list of users
 * @returns {Promise}
 */
async function getUsers() {
  return User.find({});
}

/**
 * Get user detail
 * @param {string} id - User ID
 * @returns {Promise}
 */
async function getUser(id) {
  return User.findById(id);
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} account_number - Account number
 * @param {string} phone
 * @param {string} balance - Balance
 * @param {string} password - Hashed password
 * @returns {Promise}
 */
async function createUser(name, email, phone, account_number, balance, password) {
  return User.create({
    name,
    email,
    phone,
    account_number,
    balance,
    password,
  });
}

/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {Promise}
 */
async function updateUser(id, name, email) {
  return User.updateOne(
    {
      _id: id,
    },
    {
      $set: {
        name,
        email,
      },
    }
  );
}

/**
 * Update User Balance when do topup
 * @param {string} id
 * @param {string} account_number
 * @param {string} amount
 * @return {Promise}
 */
async function updateBalance(id, account_number, amount) {
  return User.updateOne(
    {
      _id: id,
      account_number: account_number,
    },
    {
      $set: {
        balance: amount, // Use the newBalance string
      },
    }
  );
}


/**
 * Delete a user
 * @param {string} id - User ID
 * @returns {Promise}
 */
async function deleteUser(id) {
  return User.deleteOne({ _id: id });
}

/**
 * Get user by email to prevent duplicate email
 * @param {string} email - Email
 * @returns {Promise}
 */
async function getUserByEmail(email) {
  return User.findOne({ email });
}

/**
 * Get user by account number
 * @param {string} account_number
 * @returns {Promise} 
 */
async function getUAN(account_number) {
  return User.findOne({ account_number });
}

/**
 * Update user password
 * @param {string} id - User ID
 * @param {string} password - New hashed password
 * @returns {Promise}
 */
async function changePassword(id, password) {
  return User.updateOne({ _id: id }, { $set: { password } });
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserByEmail,
  changePassword,
  updateBalance,
  getUAN,
};
