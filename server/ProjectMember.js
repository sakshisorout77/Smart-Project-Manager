const mongoose = require("mongoose");

const projectMemberSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true
    },

    teamId: {
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
        required: true
    }
});

// Same user cannot have duplicate role entries in the same project
projectMemberSchema.index(
    { projectId: 1, email: 1 },
    { unique: true }
);

module.exports = mongoose.model(
    "ProjectMember",
    projectMemberSchema
);