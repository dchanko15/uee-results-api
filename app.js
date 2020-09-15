let createError = require('http-errors');
let dotenv = require('dotenv').config({});

let express = require('express');
let path = require("path");

let logger = require('morgan');
let cors = require("cors");

let session = require('express-session');
let MemcachedStore = require('connect-memcached')(session);

let apiRouter = require('./routes/apiRoutes');


if (dotenv.error) {
    throw dotenv.error;
}

let app = express();
app.use(cors({
    credentials: true,
    origin: ["http://localhost", "http://localhost:8080", "http://localhost:5000"]
}));



app.set('ueedb_1_conn', process.env.UEEDB_1_CONN || "mssql://dch:M10yl@172.16.20.16/ueedb_1");
app.set('ueedb_2_conn', process.env.UEEDB_2_CONN || "mssql://dch:M10yl@172.16.20.16/ueedb_2");


let memcachedHosts =   (process.env.SESSIONSTORE && JSON.parse(process.env.SESSIONSTORE)) || ['127.0.0.1:11211'];

app.use(session({
    secret: 'D85D5EF26CBD4A9D9D771E7DB21763F8',
    resave: false,
    saveUninitialized: false,
    proxy: "true",
    name: 'mfdlvgodratkk.a2',
    store: new MemcachedStore({
        hosts: memcachedHosts,
        maxExpiration: 3600,
    })
}));


app.use(logger('[:date[iso]] ":method :url" :status :res[content-length] :response-time ms'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    console.log(err.message);
    res.status(err.status || 500);
    res.send(null);
});

module.exports = app;
