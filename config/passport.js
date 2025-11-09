var LocalStrategy = require('passport-local').Strategy;
var User = require('../app/models/user');

module.exports = function (passport) {

    // =========================================================================
    // PASSPORT SESSION SETUP ==================================================
    // =========================================================================
    // This saves the user's ID in the session (like a login cookie)
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // This retrieves the full user info from the database using the ID
    passport.deserializeUser(async function(id, done) {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // This handles when someone creates a new account with email/password
    passport.use('local-signup', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    async function(req, email, password, done) {
        try {
            // Check if email already exists in database
            const existingUser = await User.findOne({ 'local.email': email });
            
            // If email is already taken
            if (existingUser) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            }
            
            // Create new user
            var newUser = new User();
            newUser.local.email = email;
            newUser.local.password = newUser.generateHash(password);

            // Save user to database
            await newUser.save();
            return done(null, newUser);
            
        } catch (err) {
            return done(err);
        }
    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // This handles when someone logs in with email/password
    passport.use('local-login', new LocalStrategy({
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true
    },
    async function(req, email, password, done) {
        try {
            // Find user by email
            const user = await User.findOne({ 'local.email': email });

            // If no user found
            if (!user) {
                return done(null, false, req.flash('loginMessage', 'No user found.'));
            }

            // If password is wrong
            if (!user.validPassword(password)) {
                return done(null, false, req.flash('loginMessage', 'Wrong password.'));
            }

            // All good! Return user
            return done(null, user);
            
        } catch (err) {
            return done(err);
        }
    }));

};

// <!-- completed with the help of claude sonnet -->










//     // This retrieves the full user info from the database using the ID
//     // passport.deserializeUser(function (id, done) {
//     //     User.findById(id, function (err, user) {
//     //         done(err, user);
//     //     });
//     // });

//     passport.deserializeUser(async function(id, done) {
//         try {
//             const user = await User.findById(id);
//             done(null, user);
//         } catch (err) {
//             done(err);
//         }
//     });

//     // =========================================================================
//     // LOCAL SIGNUP ============================================================
//     // =========================================================================
//     // This handles when someone creates a new account with email/password
//     passport.use('local-signup', new LocalStrategy({
//         usernameField: 'email',
//         passwordField: 'password',
//         passReqToCallback: true
//     },
//     async function (req, email, password, done) {
//         try {
//             // process.nextTick(function () {
//                 // Check if email already exists in database
//                 // User.findOne({ 'local.email': email }, function (err, user) {
//                 //     if (err)
//                 //         return done(err);
//                 const existingUser = await User.findOne({ 'local.email': email });

//                     // If email is already taken
//                 if (existingUser) {
//                 return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
//             }    
//                     // if (user) {
//                     //     return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
//                     // } else {
//                         // Create new user
//                         var newUser = new User();
//                         newUser.local.email = email;
//                         newUser.local.password = newUser.generateHash(password);

//                         // Save user to database
//                         newUser.save(function (err) {
//                             if (err)
//                                 throw err;
//                             return done(null, newUser);
//                         });
//                     }
//                 });
//             });
//         }));

//     // =========================================================================
//     // LOCAL LOGIN =============================================================
//     // =========================================================================
//     // This handles when someone logs in with email/password
//     passport.use('local-login', new LocalStrategy({
//         usernameField: 'email',
//         passwordField: 'password',
//         passReqToCallback: true
//     },
//         function (req, email, password, done) {
//             // Find user by email
//             // User.findOne({ 'local.email' :  email }, function(err, user) {
//             //     if (err)
//             //         return done(err);

//             User.findOne({ 'local.email': email }, function (err, user) {
//                 if (err) return done(err);
//                 if (!user) return done(null, false, req.flash('loginMessage', 'No user found.'));
//                 // ... more code
//             });

//             // If no user found
//             if (!user)
//                 return done(null, false, req.flash('loginMessage', 'No user found.'));

//             // If password is wrong
//             if (!user.validPassword(password))
//                 return done(null, false, req.flash('loginMessage', 'Wrong password.'));

//             // All good! Return user
//             return done(null, user);
//         // });
// }));

