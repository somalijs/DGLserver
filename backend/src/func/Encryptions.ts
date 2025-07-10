import bcrypt from 'bcrypt';

export const passwordEncryption = {
  generate: async function () {
    const password = generateRandomToken(6);
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return {
      hash,
      password,
    };
  },
  hash: async function (password: string) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  },
  compare: async function (password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  },
};

export const codeEncryption = {
  generateOtp: async function (length = 5) {
    const code = generateRandomToken(length);
    const hash = await bcrypt.hash(code, await bcrypt.genSalt(10));

    return {
      hash,
      code,
      expire: Date.now() + 60 * 1000, // 72 hours
    };
  },

  validateOtp: async function (code: string, hash: string) {
    return await bcrypt.compare(code, hash);
  },
};
function generateRandomToken(length = 5) {
  // const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const numbers = '0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return token;
}
