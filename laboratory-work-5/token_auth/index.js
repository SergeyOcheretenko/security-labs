const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();
const { auth } = require('express-oauth2-jwt-bearer');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const domain = process.env.DOMAIN;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const audience = process.env.AUDIENCE;

const checkJwt = auth({
    audience: audience,
    issuerBaseURL: domain,
  });

const setUserMiddleware = (req, res, next) => {
    const authorization = req.headers.authorization;
    const token = authorization ? authorization.split(' ')[1] : null;
    axios.get(`${domain}/userinfo/`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    }).then((response) => {
        req.user = response.data;
        next();
    }).catch((error) => {
        next();
    });
};

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/me', checkJwt, setUserMiddleware, (req, res) => {
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
            audience: audience,
            scope: 'offline_access openid profile email read:current_user update:current_user_metadata',
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
