const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');
const bcrypt = require('bcryptjs');
const passport = require('passport');
// Load User model
const User = require('../models/User');
//controllers
const authController = require('../controllers/authController');

router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));
router.get('/dashboard', ensureAuthenticated, (req, res) =>
  res.render('dashboard')
);
router.get('/edit_profile', ensureAuthenticated, authController.updateProfilePage);
router.post('/edit_password', authController.updatePassword);
router.post('/edit_profile', authController.updateProfile);

module.exports = router;
