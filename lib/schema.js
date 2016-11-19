const assert = require('assert');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Create schemas to store movie and actor documents.
var movieSchema = new Schema ({
  title: String,
  year: {
    type: Number,
    min: 1890,
    get: v => Math.round(v),
    set: v => Math.round(v)
  },
  actors: [Schema.Types.ObjectId],
  rating: {
    enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', 'X', 'Not rated' ]
  }
})

var actorSchema = new Schema ({
  lastName: {
    type: String,
    required: true
  },
  firstName: String,
  birthday: Date,
  imageUrl: String,
  movies: [Schema.Types.ObjectId]
});

// Takes a mongoose DB as argument.
module.exports = function (db) {
  assert.notEqual(null, db);

  // Create methods here for schema objects.
  movieSchema.methods = {
    getActors: function () {
      return Actor.find({_id: {'$in': this.actors}});
    },

    addActor: function (actor) {
      this.actors.push(actor._id);
    }
  };

  actorSchema.methods = {
    getMovies: function () {
      return Movie.find({_id: {'$in': this.movies}});
    },

    addMovie: function (movie) {
      this.movies.push(movie._id);
    }
  };

  // Add your schema models to Mongoose.
  this.Movie = db.model('Movie', movieSchema);
  this.Actor = db.model('Actor', actorSchema);

  return this;
};
