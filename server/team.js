const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({

    teamId: {
        type: String,
        required: true,
    },

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["Manager", "Contributor", "Viewer"],
        default: "Contributor"
    }

});

module.exports = mongoose.model("Team", teamSchema);