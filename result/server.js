var express = require('express'),
    async = require('async'),
    pg = require("pg"),
    path = require("path"),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    app = express(),
    server = require('http').Server(app),
    io = require('socket.io')(server);


const fs = require('fs');

io.set('transports', ['polling']);

var port = process.env.PORT || 4000;

io.sockets.on('connection', function (socket) {

  socket.emit('message', { text : 'Welcome!' });

  socket.on('subscribe', function (data) {
    socket.join(data.channel);
  });
});

async.retry(
  {times: 1000, interval: 1000},
  function(callback) {
    pg.connect('postgres://postgres@db/postgres', function(err, client, done) {
      if (err) {
        console.error("Waiting for db!");
      }
      callback(err, client);
    });
  },
  function(err, client) {
    if (err) {
      return console.error("Giving up!");
    }
    console.log("Connected to db!");
    getVotes(client);
  }
);

function getVotes(client) {
  client.query('SELECT vote, COUNT(id) AS count FROM votes GROUP BY vote', [], function(err, result) {
    if (err) {
      console.error("Error performing query: " + err);
    } else {
      var votes = collectVotesFromResult(result);
      io.sockets.emit("scores", JSON.stringify(votes));
    }

    setTimeout(function() {getVotes(client) }, 1000);
  });
}

function collectVotesFromResult(result) {
  var votes = {a: 0, b: 0};

  result.rows.forEach(function (row) {
    votes[row.vote] = parseInt(row.count);
  });

  return votes;
}

app.use(cookieParser());
app.use(bodyParser());
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});

app.use(express.static(__dirname + '/views'));

app.get('/', function (req, res) {
  const fs = require('fs');

  // const db = fs.readFileSync('/run/secrets/DB_PASSWORD', 'utf8')
  // console.log('db', db)
  res.sendFile(path.resolve(__dirname + '/views/index.html'));
});

server.listen(port, function () {
  var port = server.address().port;
  // const db = fs.readFileSync('/run/secrets/DB_PASSWORD', 'utf8'); ///run/secrets/DB_PASSWORD
  // console.log('db1', db)  
  console.log('App running on port ' + port);
});
