const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const querystring = require('querystring');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const domain = 'https://dev-fy6qkss3y7aityfq.us.auth0.com';
const clientId = 'cwErKmr6lh7idK1GYKmtinzRhVV1NkPh';
const clientSecret = 'cFoeBYDJM9OfPamr1Zw173FnNhINyGgAyU1VJf1mdcbtQdIdrrtYWZ8EvwrPA1RJ';

app.use((req, res, next) => {
    const token = req.cookies?.token;

    axios.get(`${domain}/userinfo`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).then((response) => {
        req.user = response.data;
        next();
    }).catch((error) => {
        next();
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/me', (req, res) => {
    if (req.user) {
        return res.json({
            email: req.user.email,
            logout: 'http://localhost:3000/logout'
        });
    }
    return res.status(401).send('Unauthorized');
});

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    try {
        const body = {
            grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
            username: email,
            password: password,
            // audience: 'https://dev-fy6qkss3y7aityfq.us.auth0.com/api/v2/',
            scope: 'offline_access',
            client_id: clientId,
            client_secret: clientSecret,
            realm: 'Username-Password-Authentication',
        };
    
        axios.post(`${domain}/oauth/token`, querystring.stringify(body)).then((response) => {
            const accessToken = response.data.access_token;
            res.cookie('token', accessToken, { httpOnly: false });
            res.json({ token: accessToken });
        }).catch((error) => {
            res.status(401).send('Unauthorized');
        });
    } catch {
        res.status(401).send('Unauthorized');
    }
});

app.listen(3000, () => {
    console.log('Example app listening on port 3000');
});
