const app = require('express')();
const bodyParser = require('body-parser');
//const upload = require('multer')(); // v1.0.5
const accountRoutes = require('./routes/account-routes');
const expressSession = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(expressSession);

const dbName = 'notesDB';
const connectionString = `mongodb://localhost:27017/${dbName}`;

mongoose.connect(connectionString);

app.use(expressSession({
    secret: 'AXCJRGSBJUHFOS-AVDAV-4FDfd',
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({
        url: 'mongodb://localhost/test-app',
        ttl: 20 * 24 * 60 * 60 // = 20 days.
    })
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', accountRoutes);

const server = app.listen(3000, () => {
    console.log(`Server listening on port ${server.address().port}`);
});
