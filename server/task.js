const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    projectName: {
        type: String,
        required: true
    },

    priority: {
        type: String,
        default: "Medium"
    },

    dueDate: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        default: "Pending"
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

module.exports = mongoose.model("Task", taskSchema);