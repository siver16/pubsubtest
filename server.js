const zmq = require('zeromq');

const pub = zmq.socket("pub");
const sub = zmq.socket("sub");

const args = require('minimist')(process.argv.slice(2));
const db = require('./db');

pub.bindSync(`tcp://127.0.0.1:${args['pub']}`);
sub.bindSync(`tcp://127.0.0.1:${args['sub']}`);

sub.subscribe('api_in');

sub.on('message', (type, data) => {
    let message = JSON.parse(data);
    if (message.type === 'login') {
        const sqlQuery = `SELECT user_id FROM users WHERE email = '${message.email}' AND passw = '${message.passw}';`;

        db.get(sqlQuery, (err, row) => {
            if (err) return console.error(err.message);
            if (row) {
                const outMessage = {
                    msg_id: message.msg_id,
                    user_id: row.user_id,
                    status: 'OK'
                };
                pub.send(['api_out', JSON.stringify(outMessage)]);
            } else {
                const outMessage = {
                    msg_id: message.msg_id,
                    status: 'ERROR',
                    error: message.passw === '' || message.email === '' ? 'WRONG_FORMAT' : 'WRONG_PWD'
                };
                pub.send(['api_out', JSON.stringify(outMessage)]);
            }
        });
    }
});

process.on('SIGINT', () => {
    pub.close();
    sub.close();
});