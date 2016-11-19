const assert = require('assert');
var config = require('./config.js');
var mongoose = require('mongoose');

// Mongoose can be configured to use your favorite promise library.
var Promise = require('bluebird');
mongoose.Promise = Promise;

mongoose.connect('mongodb://' + config.mongodbHost + '/' + config.mongodbDb);

var db = mongoose.connection;

var schema = require('./lib/schema.js')(db);

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('Connected to database!');

  schema.Movie.findOne({title: 'Tremors'})
    .then(function (movie) {
      // If there's no movie object, we probably need to set up the database.
      if (null == movie) {
        return setup();
      }

      return movie;
    })
    .then(function (movie) {
      console.log("Movie title:", movie.title);

      return movie.getActors();
    })
    .then(function (actors) {
      actors.forEach(function (actor) {
        console.log(" Starring", actor.firstName, actor.lastName);
      });
    })
    .finally(function () {
      db.close();
    });
});

// This function will only be run once. It returns a promise that resolves to a Movie object.
function setup () {
  var promiseArray = [];

  console.log('Creating database records');
  
  // This object represents one movie.
  var tremorsMovie = new schema.Movie ({
    title: 'Tremors',
    year: 1990,
    rating: 'PG-13'
  });

  // These are the amazing actors from that movie.
  var actors = [
    new schema.Actor ({
      lastName: 'Bacon',
      firstName: 'Kevin'
    }),
    new schema.Actor ({
      lastName: 'Ward',
      firstName: 'Fred'
    }),
    new schema.Actor ({
      lastName: 'Carter',
      firstName: 'Finn'
    })
  ];

  // Create an array of promises to write actors to the DB.
  promiseArray = tremorsMovie.save()
    .then(function (movie) {
      var promises = [];

      console.log('Created movie record for', movie.title);
      
      actors.forEach(function (actor) {
        actor.addMovie(movie);
        promises.push(actor.save());
      });

      return promises;
    });

  // This chain eventually returns our movie object, saved to the DB.
  return Promise.all(promiseArray)
    .then(function (actors) {
      actors.forEach(function (actor) {
        console.log('Finishing actor record for', actor.firstName, actor.lastName);
        tremorsMovie.addActor(actor);
      });

      return tremorsMovie.save();
    });
};
