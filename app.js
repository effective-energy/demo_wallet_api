const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const aleWalletRoutes = require('./api/routes/Ale-wallets');
const aleTransactionsRoutes = require('./api/routes/Ale-transactions');
const aleUsersRoutes = require('./api/routes/Ale-users');
const aleOffersRoutes = require('./api/routes/Ale-offers');
const aleResumesRoutes = require('./api/routes/Ale-resumes');
const aleNotificationsRoutes = require('./api/routes/Ale-notifications');
const aleMessagesRoutes = require('./api/routes/Ale-messages');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const RateLimit = require('express-rate-limit');
app.enable('trust proxy');
var limiter = new RateLimit({
  windowMs: 600000,
  max: 1000,
  delayMs: 0,
  message: "Too many accounts created from this IP, please try again after an 3 minute"
});
app.use(limiter);

mongoose.Promise = global.Promise;
mongoose.connect(process.env.mongoConnectUrl);

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(bodyParser.json());

app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
	next();
});

app.use('/wallet', aleWalletRoutes);
app.use('/transactions', aleTransactionsRoutes);
app.use('/users', aleUsersRoutes);
app.use('/offers', aleOffersRoutes);
app.use('/resumes', aleResumesRoutes);
app.use('/notifications', aleNotificationsRoutes);
app.use('/messages', aleMessagesRoutes);

app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(cors());

app.use((req, res, next) => {
	const error = new Error('Not found');
	error.status = 404;
	next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
  	error: {
  		message: error.message
  	}
  })
});

module.exports = app;