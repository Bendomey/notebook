const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
// Load User model
const User = require('../models/User');
const crypto = require('crypto')
const mail = require('../config/mail')


exports.loginPage = (req, res) => {
	res.render('login');
};

exports.registerPage = (req, res) => {
	res.render('register');
};

exports.validateRegister = (req, res, next) => {
	const { name, email, password, password2 } = req.body;
	req.sanitizeBody('name');
	req.checkBody('name','Name field cannot be empty').notEmpty();
	req.checkBody('email','Email field cannot be empty').isEmail();
	req.sanitizeBody('email').normalizeEmail({
		remove_dots:true,
		remove_extension:true,
		gmail_remove_subaddress:true
	});
	req.checkBody('password','Password field cannot be empty').notEmpty();
	req.checkBody('password2','Confirm password field cannot be empty').notEmpty();
	req.checkBody('password2','Oops, your passwords do not match').equals(password);
	req.checkBody('password','Password must have characters of 6 or more').isLength({min:6});
	let errors = req.validationErrors();
	if(errors){
		res.render('register',{
			errors
		});
	}
	next();
};

exports.register = (req, res, next) => {
	const { name, email, password, password2 } = req.body;
	User.findOne({email})
	.then(user => {
		if(user){
	      	let errors = [];
	      	errors.push({msg:'Email already exists'});
	      	res.render('register',{
	      		errors,
	      	});
	      	return next(null);
		}else{
			const newUser = new User({
	          name,
	          email,
	          password
	        });

	        bcrypt.genSalt(10, (err, salt) => {
	          bcrypt.hash(newUser.password, salt, (err, hash) => {
	            if (err) throw err;
	            newUser.password = hash;
	            newUser
	              .save()
	              .then(user => {
	                req.flash(
	                  'success_msg',
	                  'You are now registered and can log in'
	                );
	                res.redirect('/users/login');
	              })
	              .catch(err => console.log(err));
	          });
	        });
		}
	});
};

exports.login =  passport.authenticate('local',{
    failureRedirect: '/users/login',
    failureFlash: true
});

exports.rememberMe = (req, res, next) => {
    if (req.body.remember) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
    } else {
      req.session.cookie.expires = false; // Cookie expires at end of session
    }
    next();
};

exports.loginRedirect = (req, res) => {
	let path = req.session.redirect_to;
	delete req.session.redirect_to;
	res.redirect(req.session.redirect_to || '/dashboard');
}

exports.logout = (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
}

exports.updateProfilePage = (req, res) => {
	res.render('edit_profile');
}

exports.updateProfile = (req, res) => {
	req.sanitizeBody('name');
	req.checkBody('email','Email Field is empty').notEmpty();
	req.checkBody('email','Email is invalid').isEmail();
	req.sanitizeBody('email').normalizeEmail({
		remove_dots:false,
		remove_extension:false,
		gmail_remove_subaddress:false
	});
  	let errors = req.validationErrors();
  	const { id, name, email } = req.body;

  	if(errors){
  		res.redirect('back',{
  			errors
  		});
  	}else{
  		User.findOneAndUpdate({_id:id}, req.body, {
  			new:true,
  			runValidators:true
  		}).exec();
  		let user = User.findOne({_id:id});
      	user.updated_at = Date.now();
  		user.save();
  		req.flash(
          'success_msg',
          'Profile Changed successfully'
        );
        res.redirect('/edit_profile');
  	}

}

exports.updatePassword = (req, res) => {
	req.checkBody('oldPassword', 'Old Password field is empty').notEmpty();
	req.checkBody('password', 'New Password field is empty').notEmpty();
	req.checkBody('password2', 'Confirm Password field is empty').notEmpty();
	req.checkBody('password2','Oops, your passwords do not match').equals(req.body.password);
  const { id, oldPassword, password, password2 } = req.body;
  let errors = req.validationErrors();
  
  if (errors) {
    res.render('edit_profile', {
      errors,
    });
  }else{
    User.findOne({_id: id})
    .then(user => {

		bcrypt.compare(oldPassword, user.password, (err, isMatch) => {
	      if (err) throw err;
	      if (isMatch) {
	        
	      	user.password = password;
	      	user.updated_at = Date.now();
	      	bcrypt.genSalt(10, (err, salt) => {
	          bcrypt.hash(user.password, salt, (err, hash) => {
	            if (err) throw err;
	            user.password = hash;
	            user
	              .save()
	              .then(user => {
	                req.flash(
	                  'success_msg',
	                  'Password Changed successfully'
	                );
	                res.redirect('/edit_profile');
	              })
	              .catch(err => console.log(err));
	          });
	        });

	      } else {
	      	let errors = [];
	      	errors.push({msg:'Your Old Password is incorrect'})
	        res.render('edit_profile', {
		        errors
		    });
	      }
	    });

    });    
  }
}

/**
 * Reset Flow
*/

exports.resetPasswordPage = (req, res) => {
	res.render('reset_email');
};


exports.forgot = async (req, res) => {
	//find user
	let user = await User.findOne({email:req.body.email});
	if(!user){
		req.flash('success_msg','A password reset has been sent successfully');
		return res.redirect('/users/login');
	}
	//set reset tokens and expiry
	user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
	user.resetPasswordExpires = Date.now() + 3600000; //one hour validity
	await user.save();
	//send email to user
	const resetURL = `http://${req.headers.host}/users/account/reset/${user.resetPasswordToken}`;
	await mail.send({
		user,
		subject:"Password Reset Link - Auth System",
		resetURL,
		filename:'email'
	})
	req.flash('success_msg', `You have been mailed a password reset link`);
	res.redirect('/users/login');
};	


exports.reset = async (req, res) => {
	let user = await User.findOne({
		resetPasswordToken:req.params.token,
		resetPasswordExpires: { $gt: Date.now()}
	});

	if(!user){
		req.flash('error_msg','Password reset token is invalid or has expired');
		return res.redirect('/users/login');
	}

	res.render('reset');
};

exports.confirmedPasswords = (req, res, next) => {
	req.checkBody('password', 'New Password field is empty').notEmpty();
	req.checkBody('password2', 'Confirm Password field is empty').notEmpty();
	req.checkBody('password2','Oops, your passwords do not match').equals(req.body.password);

	let errors = req.validationErrors();
	if(errors){
		req.flash('error_msg', errors.map(err => err.msg));
		res.redirect('back');
		return;
	}

	next();
};

exports.update = (req, res) => {
	User.findOne({
		resetPasswordToken:req.params.token,
		resetPasswordExpires: { $gt: Date.now()}
	})
	.then(user => {
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;
		user.password = req.body.password;
		user.updated_at = Date.now();
      	bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) throw err;
            user.password = hash;
            user
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  'Your password has been reset successfully'
                );
                return res.redirect('/users/login');
              })
              .catch(err => console.log(err));
          });
        });

	})
	.catch(err => {
		req.flash('error_msg','Password reset token has expired');
		return res.redirect('/users/login');
	});

};
