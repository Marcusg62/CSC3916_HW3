const mongoose = require('mongoose');
var Schema = mongoose.Schema;


//mongoose.connect(process.env.DB, { useNewUrlParser: true });
try {
    mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true }, () =>
        console.log("connected"));
} catch (error) {
    console.error("could not connect");
}
mongoose.set('useCreateIndex', true);


//    Movie Schema
var MovieSchema = new Schema({
    title: { type: String, required: true, index: { unique: true } },
    year_released: { type: String, required: true },
    genre:
    {
        type: String,
        required: true,
        enum: ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Thriller", "Western"]
    },
    actors:
        [
            { actor_name: { type: String, required: true }, character_name: { type: String, required: true } },

        ]
});

MovieSchema.pre('save', function (next) {
    next();
});

//return the model to server
module.exports = mongoose.model('Movie', MovieSchema);