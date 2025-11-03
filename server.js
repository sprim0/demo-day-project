// server.js (Demo Day Project)
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 3000;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

// var dbUrl = process.env.MONGODB_URI || require('./config/database').url;
var dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database-name';

require('./config/passport')(passport);

mongoose.connect(dbUrl, (err, database) => {
  if (err) return console.log(err)
  require('./app/routes')(app, passport);
});

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('../public'));
app.set('view engine', 'ejs');

app.use(session({
  secret: process.env.SESSION_SECRET || 'rcbootcamp2021b',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.listen(port);
console.log('Demo Day app running on port ' + port);


// completed with Cursor