const zmq = require('zeromq');

const pub = zmq.socket("pub", null);
const sub = zmq.socket("sub", null);

const nanoid = require('nanoid');
const args = require('minimist')(process.argv.slice(2));
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

pub.connect(`tcp://127.0.0.1:${args['sub']}`);
sub.connect(`tcp://127.0.0.1:${args['pub']}`);

sub.subscribe('api_out');

let message = {
    type: 'login',
    email: '',
    passw: '',
    msg_id: nanoid(10)
};

readline.question('Your email?\n', (email) => {
    message.email = email;
    readline.question('Your password?\n', (passw) => {
        message.passw = passw;
        pub.send(['api_in', JSON.stringify(message)]);
        pub.close();
    });
});

sub.on('message', (type, data) => {
    let message = JSON.parse(data);
    if (message.status === 'ERROR') console.log(message.error);
});