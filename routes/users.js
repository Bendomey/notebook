const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { catchErrors } = require('../config/errorHandlers');
const User = require('../models/User');
const { forwardAuthenticated, ensureAuthenticated } = require('../config/auth');
//controllers
const authController = require('../controllers/authController');


/**
 * Routes here
*/
router.get('/login', forwardAuthenticated, authController.loginPage);
router.get('/register', forwardAuthenticated, authController.registerPage);
router.post('/register', authController.validateRegister, authController.register);
router.post('/login',authController.login, authController.rememberMe, authController.loginRedirect);
router.get('/logout', authController.logout);

//
router.get('/reset_account', forwardAuthenticated, authController.resetPasswordPage);
router.post('/account/forgot',catchErrors(authController.forgot));
router.get('/account/reset/:token',catchErrors(authController.reset));
router.post('/account/reset/:token',authController.confirmedPasswords, authController.update);

router.get('/facebook', passport.authenticate('facebookAuth'));
router.get('/return', passport.authenticate('facebookAuth', {successRedirect:'/dashboard',failureRedirect:'/users/login'}));

module.exports = router;
