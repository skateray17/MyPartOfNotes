const express = require('express');
const bodyParser = require('body-parser');
//const upload = require('multer')(); // v1.0.5
const accountRoutes = require('./routes/account-routes');
const notesRoutes = require('./routes/notes-routes');
const expressSession = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(expressSession);
const path = require('path');
const front = require('./routes/front');
const tags = require('./routes/tags');
const folders = require('./routes/folders');

const app = express();

const dbName = 'notesDB';
const connectionString = `mongodb://localhost:27017/${dbName}`;

//const connectionString = 'mongodb+srv://skateray17:Qu16TDFtDqoRoot5@mycluster0-shard-00-00.mongodb.net:27017,mycluster0-shard-00-01.mongodb.net:27017,mycluster0-shard-00-02.mongodb.net:27017/admin?ssl=true&replicaSet=Mycluster0-shard-0&authSource=admin';
mongoose.connect(connectionString);

app.use(expressSession({
    secret: 'AXCJRGSBJUHFOS-AVDAV-4FDfd',
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({
        url: `${connectionString}-app`,
        ttl: 20 * 24 * 60 * 60 // = 20 days.
    })
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', [accountRoutes, notesRoutes, tags, folders]);

app.use('/front', front);

app.get('/', (req, res) => { res.sendFile(path.resolve('front/index.html')); });
    

const server = app.listen(3000, () => {
    console.log(`Server listening on port ${server.address().port}`);
});
