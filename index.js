import snoowrap from 'snoowrap'
import config from './config'

const r = new snoowrap({
    userAgent: config.userAgent,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    username: config.username,
    password: config.password
});

console.log(r)