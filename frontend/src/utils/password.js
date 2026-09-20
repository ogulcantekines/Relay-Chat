export const passwordIsValid = (password) =>
    password.length >= 8 && new TextEncoder().encode(password).length <= 72;
