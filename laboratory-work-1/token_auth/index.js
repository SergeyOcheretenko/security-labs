const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const secretKey = 'SECRET';

const users = [
    {
        login: 'Login',
        password: 'Password',
        username: 'Username',
    },
    {
        login: 'Login1',
        password: 'Password1',
        username: 'Username1',
    }
];

app.use((req, res, next) => {
    const token = req.cookies?.token;

    if (token) {
        jwt.verify(token, secretKey, (err, decoded) => {
            if (!err) {
                req.user = decoded;
            }
        });
    }

    next();
});

function createToken(user) {
    return jwt.sign({ username: user.username, login: user.login }, secretKey, { expiresIn: '1h' });
}


app.get('/', (req, res) => {
    // if (req.user) {
    //     return res.json({
    //         username: req.user.username,
    //         logout: 'http://localhost:3000/logout'
    //     });
    // }
    return res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/me', (req, res) => {
    if (req.user) {
        return res.json({
            username: req.user.username,
            logout: 'http://localhost:3000/logout'
        });
    }
    // res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

app.post('/api/login', (req, res) => {
    const { login, password } = req.body;

    const user = users.find((user) => user.login === login && user.password === password);

    if (user) {
        const token = createToken(user);
        res.cookie('token', token, { httpOnly: true });
        res.json({ token });
    } else {
        res.status(401).send('Unauthorized');
    }
});

app.listen(3000, () => {
    console.log('Example app listening on port 3000');
});
