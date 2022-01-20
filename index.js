import express from 'express';

import morgan from 'morgan';

import cors from 'cors';

import path from 'path';
import mongoose from 'mongoose';

import router from './routes';

require('dotenv').config()

//Conexión a la base de datos MongoDB
mongoose.Promise = global.Promise;

const dbUrl = 'mongodb://localhost:27017/madmy';
//const dbUrl = 'mongodb+srv://alaynsn:89112232986@cluster0.raydf.mongodb.net/madmy?retryWrites=true&w=majority';

mongoose.connect(dbUrl, { useNewUrlParser: true })
    .then(mongoose => console.log('Conectado a la BD'))
    .catch(err => console.log('Error al conectar a la base de datos'));

const app = express();
app.use(morgan('dev'));
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')))

app.use('/api', router);
app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), () => {
    console.log('server on port ' + app.get('port'));
});