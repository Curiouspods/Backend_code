const UserForm = require('../models/userForm');

const saveForm = async (formData) => {
  const form = new UserForm(formData);
  return await form.save();
};

const findFormByEmail = async (email) => {
  return await UserForm.findOne({ email });
};

const getAllForms = async () => {
  return await UserForm.find();
};

module.exports = { saveForm, findFormByEmail, getAllForms };
