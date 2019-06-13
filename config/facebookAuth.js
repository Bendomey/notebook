const FacebookStrategy = require('passport-facebook');
const User = require('../models/User');
const mongoose = require('mongoose');


module.exports = function(passport){
	passport.use('facebookAuth',new FacebookStrategy({
		clientID:process.env.FACEBOOK_CLIENT_ID,
		clientSecret:process.env.FACEBOOK_CLIENT_SECRET,
		callBackURL:'/users/return'
	},async (accessToken, refreshToken, profile, done) => {
		try{
			//check if user exists in our database
			let existingUser = await User.findOne({"facebook.id":profile.id});
			if(existingUser){
				return done(null,existingUser);
			}

			let newUser = new User({
				facebook:{
					id:profile.id,
				},
				email:profile.emails[0].value,
				name:profile.displayName
			});
			await newUser.save();
			done(null,newUser);
		}catch(err){
			done(err,false,err.message);
		}
	}));

	passport.serializeUser(function(user, done) {
	  done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
	  User.findById(id, function(err, user) {
	    done(err, user);
	  });
	});
};