const usersRepository = require('./users-repository');
const { hashPassword, passwordMatched } = require('../../../utils/password');


/**
 * Get list of users
 * @returns {Array}
 */
async function getUsers(page, limit, search, sort) {
  try {
    let filteredUsers = await usersRepository.getUsers();
    let filteredCount = filteredUsers.length;

    if (search) {
      // const parts = search.split(':').map((part) => part.trim().toLowerCase());
      const parts = search.split(':').map((part) => part.trim());
      if (parts.length === 2) {
        const [field, value] = parts;
        const filteredBySearch = filteredUsers.filter((user) =>
          user[field].includes(value)
          
        );
        filteredCount = filteredBySearch.length;
        filteredUsers = filteredBySearch;
        if (filteredCount === 0) {
          console.log(`User dengan ${field} '${value}' tidak ditemukan.`);
          return null; // Mengembalikan null jika tidak ada pengguna yang cocok dengan kriteria pencarian
        }
      }
    }

    if (sort) {
      const parts = sort.split(':').map((part) => part.trim().toLowerCase());
      if (parts.length === 2) {
        const [field, order] = parts;
        let sortBy = 'email';
        let sortOrder = 1;
        if (field === 'name' || field === 'email') {
          sortBy = field;
        }
        if (order === 'desc') {
          sortOrder = -1;
        }
        filteredUsers.sort((a, b) => {
          const valueA = a[sortBy].toLowerCase(); // Ubah ke huruf kecil
          const valueB = b[sortBy].toLowerCase(); // Ubah ke huruf kecil

          if (valueA < valueB) return -1 * sortOrder;
          if (valueA > valueB) return 1 * sortOrder;
          return 0;
        });
      }
    }

    if (!limit || isNaN(limit)) {
      limit = filteredCount;
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const data = [];
    for (let i = startIndex; i < endIndex && i < filteredUsers.length; i++) {
      const user = filteredUsers[i];
      data.push({
        id: user.id,
        name: user.name,
        balance: user.balance,
        email: user.email,
        phone: user.phone,
        account_number: user.account_number,
      });
    }

    const total_pages = Math.ceil(filteredCount / limit);
    const has_previous_page = page > 1;
    const has_next_page = page < total_pages;

    return {
      page_number: page,
      page_size: limit,
      count: filteredCount,
      total_pages: total_pages,
      has_previous_page: has_previous_page,
      has_next_page: has_next_page,
      data: data,
    };
  } catch (error) {
    console.error('Error dalam pengambilan data pengguna:', error.message);
    return null; // Mengembalikan null jika terjadi kesalahan
  }
}


/**
 * Get user detail
 * @param {string} id - User ID
 * @returns {Object}
 */
async function getUser(id) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    account_number: user.account_number,
  };
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} phone - Phone number
 * @param {string} account_number - Account number
 * @param {string} balance - Balance
 * @param {string} password - Password
 * @returns {boolean}
 */
async function createUser(name, email, phone, account_number, balance, password) {
  // Hash password
  const hashedPassword = await hashPassword(password);

  try {
    await usersRepository.createUser(name, email, phone, account_number, balance, hashedPassword);
  } catch (err) {
    return null;
  }

  return true;
}


/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {boolean}
 */
async function updateUser(id, name, email) {
  const user = await usersRepository.getUser(id);

  // User not found
  if (!user) {
    return null;
  }

  try {
    await usersRepository.updateUser(id, name, email);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Top-up user balance
 * @param {string} id - User ID
 * @param {number} amount - Amount to top-up
 * @param {string} account_number - Email
 * @returns {boolean}
 */
async function updateBalance(id, amount, account_number) {
  const user = await usersRepository.getUser(id);

  if (!user) {
    return null;
  }

  try {
    // Extract email from user object
    const userAccount = user.account_number;

    // Check if email matches the provided email
    if (userAccount !== account_number) {
      return null;
    }

    // Convert amount to string
    const amountStr = amount.toString();

    // Convert current balance to number, add top-up amount, and convert back to string
    const newBalance = (parseFloat(user.balance) + parseFloat(amountStr)).toString();

    await usersRepository.updateBalance(id, userAccount, newBalance);
  } catch (err) {
    return null;
  }

  return true;
}

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {Promise<boolean>}
 */
async function deleteUser(id) {
  const user = await usersRepository.getUser(id);
try {
  // User not found
  if (!user) {
    return null;
  }
  
    await usersRepository.deleteUser(id);
    return true;
  } catch (err) {
    return null;
  }
}

/**
 * Check whether the email is registered
 * @param {string} email - Email
 * @returns {boolean}
 */
async function emailIsRegistered(email) {
  const user = await usersRepository.getUserByEmail(email);

  if (user) {
    return true;
  }

  return false;
}

/**
 * Generate a unique account number
 * @returns {string}
 */
async function generateAccountNumber() {
  let account_number = '535';
  while (true) {
    account_number += Math.floor(Math.random() * 10000000);
    if (!await usersRepository.getUAN(account_number)) {
      break;
    }
  }
  return account_number;
}

/**
 * Check whether the account number is valid
 * @param {string} account_number - account_number
 * @returns {boolean}
 */
async function getUAN(account_number) {
  const user = await usersRepository.getUAN(account_number);

  if (user) {
    return true;
  }

  return false;
}

/**
 * Check whether the password is correct
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function checkPassword(userId, password) {
  const user = await usersRepository.getUser(userId);
  return passwordMatched(password, user.password);
}

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} password - Password
 * @returns {boolean}
 */
async function changePassword(userId, password) {
  const user = await usersRepository.getUser(userId);

  // Check if user not found
  if (!user) {
    return null;
  }

  const hashedPassword = await hashPassword(password);

  const changeSuccess = await usersRepository.changePassword(
    userId,
    hashedPassword
  );

  if (!changeSuccess) {
    return null;
  }

  return true;
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  emailIsRegistered,
  checkPassword,
  changePassword,
  updateBalance,
  getUAN,
  generateAccountNumber,
};
