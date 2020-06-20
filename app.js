var express = require('express');
var app = express();

var logger = require('morgan');
var bodyparser = require('body-parser');
var cookieparser = require('cookie-parser');
var session = require('express-session');
var expressHbs = require('express-handlebars');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var passport = require('passport');
var flash = require('connect-flash');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);
 



// BSON = require('mongodb-core').BSON;






app.use(logger('dev'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({
    extended: false
}));

app.use(cookieparser());

app.use(session({
    secret: 'mysupersecret',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));
app.use(function(req, res, next) {
   req.session.cookie.maxAge = 180 * 60 * 1000; // 3 hours
    next();
});
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());




// view engine setup
app.engine('.hbs', expressHbs({defaultLayout: 'layout', extname: '.hbs'}));
app.set('view engine', '.hbs');
app.use(express.static('public'));


app.use(function(req, res, next) {
    res.locals.login = req.isAuthenticated();
    next();
});
app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
});
app.use('/',require('./routes/index.js'));
app.use('/user',require('./routes/user.js'));


// MongoDB Connection

var uri = 'mongodb://localhost:27017/shopping';
mongoose.connect(uri,{useNewUrlParser:true,useUnifiedTopology:true},(err)=>{
    if(!err){
        console.log("Successfully connected to MongoDB.");
    }else{
        console.log(err);
    }
});

require('./config/passport');



app.listen(process.env.PORT || 3000,function(){
    console.log("Server running on port :3000");
})