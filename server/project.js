const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    createdAt: {
        type: String,
        default: () => new Date().toLocaleDateString()
    },

    progress: {
        type: Number,
        default: 0
    },

    createdBy: {
        type: String,
        required: true
    },

    teamId: {
    type: String,
    required: true
}
});

module.exports = mongoose.model("Project", projectSchema);