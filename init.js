// DOTENV CONFIG
require('dotenv').config();


/**
 * Module dependencies.
 */
const express = require('express');
const app = express();
const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const MongoStore = require('connect-mongo')(session);
const mongoose = require('mongoose');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const responseTime = require('response-time');

/**
 * DB Config and Connection
 */

let mongoConnectionString = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}`;

mongoose.Promise = global.Promise;
mongoose.connect(
    mongoConnectionString, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
        reconnectInterval: 500, // Reconnect every 500ms
        poolSize: 10, // Maintain up to 10 socket connections
    },
    err => {
        if (err) {
            console.log(err);
        } else {
            console.log(`Connection to Database: ${process.env.MONGO_DB} Successfull`);
        }
    }
);

/**
 * Routers
 */

const auth = require('./controllers/api.auth');
const checker = require('./controllers/api.checker');

/**
 * Express configuration.
 */

app.use(expressStatusMonitor());
app.use(compression());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.use(responseTime());
app.use(cookieParser());
app.use(expressValidator());
app.use(
    session({
        resave: true,
        saveUninitialized: true,
        secret: 'IntentsLibrary!Secr@t<>!@%.',
        cookie: {
            maxAge: 30 * 24 * 60 * 60 * 1000
        },
        store: new MongoStore({
            mongooseConnection: mongoose.connection,
            autoReconnect: true,
        })
    })
);


app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');

/**
 * CORS
 */

app.use((req, res, next) => {
    req.userip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS, POST, PUT, DELETE');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, authtoken, contentType, Content-Type, Authorization'
    );
    next();
});

/**
 * API Urls
 */

app.use('/api', auth);
app.use('/api', checker);

app.options('*', (req, res) => {
    res.end();
});

/**
 * Error Handler.
 */
if (process.env.NODE_ENV === 'development') {
    // only use in development
    app.use(errorHandler());
} else {
    app.use((err, req, res, next) => {
        console.error(err);
        res.status(500).send('Server Error');
    });
}

/**
 * Uncaught Exceptions and Unhandled Rejections Handler
 */
process.on('unhandledRejection', (reason, rejectedPromise) => {
    console.log('error', reason);
});

process.on('uncaughtException', err => {
    console.log('error', err.message, err.stack);
    process.exit(1);
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 1,
        message: 'URL Not Found'
    });
});

app.listen(process.env.PORT, () => {
    console.log(
        `app is running at port ${process.env.PORT}`,
        chalk.green('✓')
    );
});
