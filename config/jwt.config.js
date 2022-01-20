const jwt = require('jsonwebtoken');

const getToken = (payload) => {
    return jwt.sign({
        data: payload
    }, process.env.SECRET, { expiresIn: '24h' });
}

const getTokenData = (token) => {
    let data = null;
    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if(err) {
            return false;
        } else {
            data = decoded;
        }
    });

    return data;
}

module.exports = {
    getToken,
    getTokenData
}