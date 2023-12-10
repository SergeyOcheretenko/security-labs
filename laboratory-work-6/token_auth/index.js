const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const domain = process.env.DOMAIN;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const audience = process.env.AUDIENCE;

const setUserMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    axios.get(`${domain}/userinfo/`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    }).then((response) => {
        req.user = response.data;
        next();
    }).catch((error) => {
        console.error(error)
        res.status(401).json();
    });
};

app.get('/login', (req, res) => {
    const authUrl = `${domain}/authorize?client_id=${clientId}&redirect_uri=http%3A%2F%2Flocalhost%3A3000/api/login-with-code&response_type=code&response_mode=query`;
    res.redirect(authUrl);
});

app.get('/me', setUserMiddleware, (req, res) => {
    return res.json({
        logout: 'http://localhost:3000/logout'
    });
});

app.get('/api/login-with-code', (req, res) => {
    const { code } = req.query;

    try {
        const body = {
            grant_type: 'authorization_code',
            scope: 'offline_access openid profile email read:current_user update:current_user_metadata',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: 'http://localhost:3000/'
        };
    
        axios.post(`${domain}/oauth/token`, querystring.stringify(body)).then((response) => {
            const accessToken = response.data.access_token;

            res.cookie('token', accessToken, { httpOnly: false });
            res.redirect('http://localhost:3000/')
        }).catch((error) => {
            console.error(error)
            res.status(401).send('Unauthorized');
        });
    } catch {
        res.status(401).send('Unauthorized');
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.listen(3000, () => {
    console.log('Example app listening on port 3000');
});
