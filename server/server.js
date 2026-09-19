// ==========================================
// SMART PROJECT MANAGER - SERVER
// ==========================================

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./User");
const Project = require("./project");
const Task = require("./task");
const Team = require("./team");
const ProjectMember = require("./ProjectMember");

const { GoogleGenAI } = require("@google/genai");


// ==========================================
// MONGODB CONNECTION
// ==========================================

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected successfully!");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });


// ==========================================
// EXPRESS APP
// ==========================================

const app = express();

app.use(cors());
app.use(express.json());


// ==========================================
// GEMINI AI
// ==========================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
    res.send("Smart Project Manager API is running!");
});


// ==========================================
// REGISTER
// ==========================================

app.post("/api/register", async (req, res) => {

    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {

            return res.status(400).json({
                error: "All fields are required."
            });
        }

        const userEmail = email.toLowerCase();

        const existingUser =
            await User.findOne({
                email: userEmail
            });

        if (existingUser) {

            return res.status(400).json({
                error: "User already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

const newUser = new User({
    name: name,
    email: userEmail,
    password: hashedPassword
});
        await newUser.save();

        res.json({
            message: "User registered successfully!"
        });

    } catch (error) {

        console.error("Register Error:", error);

        res.status(500).json({
            error: "Registration failed."
        });
    }
});


// ==========================================
// LOGIN
// ==========================================
app.post("/api/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {

            return res.status(400).json({
                error: "Email and password are required."
            });
        }

        const userEmail = email.toLowerCase();

        const user =
            await User.findOne({
                email: userEmail
            });

        if (!user) {

            return res.status(401).json({
                error: "Invalid email or password."
            });
        }

        let passwordValid = false;

        // Check whether password is already bcrypt hashed
        const isHashedPassword =
            user.password.startsWith("$2a$") ||
            user.password.startsWith("$2b$") ||
            user.password.startsWith("$2y$");

        if (isHashedPassword) {

            passwordValid =
                await bcrypt.compare(
                    password,
                    user.password
                );

        } else {

            // Support old plain-text password
            passwordValid =
                user.password === password;

            // Convert old password to bcrypt hash
            if (passwordValid) {

                user.password =
                    await bcrypt.hash(
                        password,
                        10
                    );

                await user.save();
            }
        }

        if (!passwordValid) {

            return res.status(401).json({
                error: "Invalid email or password."
            });
        }


        // Check team membership
        const teamMember =
            await Team.findOne({
                email: userEmail,
                teamId: "TEAM001"
            });

        if (!teamMember) {

            return res.status(403).json({
                error: "You are not a member of this team."
            });
        }


        res.json({

            message: "Login successful!",

            user: {
                name: user.name,
                email: user.email
            }

        });

    } catch (error) {

        console.error("Login Error:", error);

        res.status(500).json({
            error: "Login failed."
        });
    }
});

// ==========================================
// TEAM - GET MEMBERS
// ==========================================

app.get("/api/team", async (req, res) => {

    try {

        const { teamId } = req.query;

        if (!teamId) {

            return res.status(400).json({
                error: "Team ID is required."
            });
        }

        const members =
            await Team.find({
                teamId: teamId
            });

        res.json(members);

    } catch (error) {

        console.error("Get Team Error:", error);

        res.status(500).json({
            error: "Unable to load team members."
        });
    }
});


// ==========================================
// TEAM - ADD MEMBER
// ==========================================

app.post("/api/team", async (req, res) => {

    try {

        const {
            teamId,
            name,
            email,
            role
        } = req.body;


        if (!name || !email || !role) {

            return res.status(400).json({
                error: "Name, email and role are required."
            });
        }


        const userEmail =
            email.toLowerCase();


        const selectedTeamId =
            teamId || "TEAM001";

            const managerEmail = req.body.managerEmail;

if (!managerEmail) {
    return res.status(400).json({
        error: "Manager email is required."
    });
}

const manager =
    await Team.findOne({
        email: managerEmail.toLowerCase(),
        teamId: selectedTeamId
    });

if (!manager || manager.role !== "Manager") {
    return res.status(403).json({
        error: "Only Manager can add team members."
    });
}


        // Check whether user account exists
        const user =
            await User.findOne({
                email: userEmail
            });

        if (!user) {

            return res.status(404).json({
                error: "No registered account found with this email."
            });
        }


        // Check duplicate member in same team
        const existingMember =
            await Team.findOne({
                email: userEmail,
                teamId: selectedTeamId
            });

        if (existingMember) {

            return res.status(400).json({
                error: "This user is already in the team."
            });
        }


        // Maximum 4 members
        const teamCount =
            await Team.countDocuments({
                teamId: selectedTeamId
            });

        if (teamCount >= 4) {

            return res.status(400).json({
                error: "Team can have maximum 4 members."
            });
        }


        const member = new Team({

            teamId: selectedTeamId,

            name: name,

            email: userEmail,

            role: role

        });


        await member.save();


        res.json({

            message: "Team member added successfully!",

            member: member

        });

    } catch (error) {

        console.error(
            "Add Team Member Error:",
            error
        );

        res.status(500).json({
            error: "Unable to add team member."
        });
    }
});


// ==========================================
// TEAM - REMOVE MEMBER
// ==========================================

app.delete("/api/team/:email", async (req, res) => {

    try {
        const managerEmail = req.body.managerEmail;

if (!managerEmail) {
    return res.status(400).json({
        error: "Manager email is required."
    });
}

const manager = await Team.findOne({
    email: managerEmail.toLowerCase(),
    teamId: "TEAM001"
});

if (!manager || manager.role !== "Manager") {
    return res.status(403).json({
        error: "Only Manager can remove team members."
    });
}

        const email =
            decodeURIComponent(
                req.params.email
            ).toLowerCase();


        const member =
            await Team.findOne({
                email: email,
                teamId: "TEAM001"
            });


        if (!member) {

            return res.status(404).json({
                error: "Team member not found."
            });
        }


        await Team.deleteOne({
            _id: member._id
        });


        res.json({
            message: "Team member removed successfully!"
        });

    } catch (error) {

        console.error(
            "Remove Team Member Error:",
            error
        );

        res.status(500).json({
            error: "Unable to remove team member."
        });
    }
});


// ==========================================
// TEAM - CHANGE ROLE
// ==========================================

app.put("/api/team/:email", async (req, res) => {

    try {

        const email =
            decodeURIComponent(
                req.params.email
            ).toLowerCase();

        const { role, managerEmail } = req.body;


        const validRoles = [
            "Manager",
            "Contributor",
            "Viewer"
        ];

        if (!managerEmail) {
    return res.status(400).json({
        error: "Manager email is required."
    });
}

const manager = await Team.findOne({
    email: managerEmail.toLowerCase(),
    teamId: "TEAM001"
});

if (!manager || manager.role !== "Manager") {
    return res.status(403).json({
        error: "Only Manager can change member roles."
    });
}


        if (!validRoles.includes(role)) {

            return res.status(400).json({
                error:
                    "Invalid role. Please use Manager, Contributor or Viewer."
            });
        }


        const member =
            await Team.findOne({
                email: email,
                teamId: "TEAM001"
            });


        if (!member) {

            return res.status(404).json({
                error: "Team member not found."
            });
        }


        member.role = role;

        await member.save();


        res.json({

            message: "Role updated successfully!",

            member: member

        });

    } catch (error) {

        console.error(
            "Change Role Error:",
            error
        );

        res.status(500).json({
            error: "Unable to change role."
        });
    }
});

// ==========================================
// PROJECTS - GET
// ==========================================

app.get("/api/projects", async (req, res) => {

    try {

        const { teamId } = req.query;

        if (!teamId) {

            return res.status(400).json({
                error: "Team ID is required."
            });
        }


        const projects =
            await Project.find({
                teamId: teamId
            });


        res.json(projects);

    } catch (error) {

        console.error(
            "Get Projects Error:",
            error
        );

        res.status(500).json({
            error: "Unable to load projects."
        });
    }
});


// ==========================================
// PROJECTS - CREATE
// ==========================================
app.post("/api/projects", async (req, res) => {

    try {

        const {
            name,
            createdBy,
            teamId
        } = req.body;

        if (!name || !createdBy || !teamId) {

            return res.status(400).json({
                error: "Project name and user are required."
            });
        }

        const teamMember =
            await Team.findOne({
                email: createdBy.toLowerCase(),
                teamId: teamId
            });

        if (!teamMember) {

            return res.status(403).json({
                error: "You are not a member of this team."
            });
        }

        if (teamMember.role === "Viewer") {

            return res.status(403).json({
                error: "Viewers cannot create projects."
            });
        }

        const project = new Project({

            name: name,

            createdBy:
                createdBy.toLowerCase(),

            teamId: teamId

        });

        await project.save();

        const projectMember =
            new ProjectMember({

                projectId:
                    project._id,

                teamId:
                    teamId,

                email:
                    createdBy.toLowerCase(),

                role:
                    teamMember.role

            });

        await projectMember.save();

        res.json({

            message:
                "Project created successfully!",

            project:
                project

        });

    } catch (error) {

        console.error(
            "Create Project Error:",
            error
        );

        res.status(500).json({
            error:
                "Unable to create project."
        });
    }
});
app.post("/api/project-members", async (req, res) => {

    try {

        const {
            projectId,
            teamId,
            email,
            role,
            managerEmail
        } = req.body;

        if (
            !projectId ||
            !teamId ||
            !email ||
            !role ||
            !managerEmail
        ) {

            return res.status(400).json({
                error:
                    "All fields are required."
            });
        }

        const manager =
            await Team.findOne({

                email:
                    managerEmail.toLowerCase(),

                teamId:
                    teamId

            });

        if (
            !manager ||
            manager.role !== "Manager"
        ) {

            return res.status(403).json({
                error:
                    "Only Manager can assign project roles."
            });
        }

        const teamMember =
            await Team.findOne({

                email:
                    email.toLowerCase(),

                teamId:
                    teamId

            });

        if (!teamMember) {

            return res.status(404).json({
                error:
                    "User is not a member of this team."
            });
        }

        const project =
            await Project.findOne({

                _id:
                    projectId,

                teamId:
                    teamId

            });

        if (!project) {

            return res.status(404).json({
                error:
                    "Project not found."
            });
        }

        const validRoles = [
            "Manager",
            "Contributor",
            "Viewer"
        ];

        if (!validRoles.includes(role)) {

            return res.status(400).json({
                error:
                    "Invalid project role."
            });
        }

        const existingMember =
            await ProjectMember.findOne({

                projectId:
                    projectId,

                email:
                    email.toLowerCase()

            });

        if (existingMember) {

            existingMember.role =
                role;

            await existingMember.save();

            return res.json({

                message:
                    "Project role updated successfully!",

                member:
                    existingMember

            });
        }

        const member =
            new ProjectMember({

                projectId:
                    projectId,

                teamId:
                    teamId,

                email:
                    email.toLowerCase(),

                role:
                    role

            });

        await member.save();

        res.json({

            message:
                "Project member added successfully!",

            member:
                member

        });

    } catch (error) {

        console.error(
            "Project Member Error:",
            error
        );

        res.status(500).json({

            error:
                "Unable to assign project role."

        });
    }
});
app.get("/api/project-members", async (req, res) => {

    try {

        const {
            projectId,
            teamId
        } = req.query;

        if (!projectId || !teamId) {

            return res.status(400).json({
                error:
                    "Project ID and Team ID are required."
            });
        }

        const members =
            await ProjectMember.find({

                projectId:
                    projectId,

                teamId:
                    teamId

            });

        res.json(
            members
        );

    } catch (error) {

        console.error(
            "Get Project Members Error:",
            error
        );

        res.status(500).json({

            error:
                "Unable to load project members."

        });
    }
});


// ==========================================
// PROJECT - UPDATE
// ==========================================
app.put("/api/projects/:id", async (req, res) => {

    try {

        const {
            name,
            userEmail,
            teamId
        } = req.body;


        if (!name || !userEmail || !teamId) {

            return res.status(400).json({
                error:
                    "Project name, user and team are required."
            });
        }


        const userEmailLower =
            userEmail.toLowerCase();


        const teamMember =
            await Team.findOne({

                email:
                    userEmailLower,

                teamId:
                    teamId

            });


        if (!teamMember) {

            return res.status(403).json({
                error:
                    "You are not a member of this team."
            });
        }


        const project =
            await Project.findOne({

                _id:
                    req.params.id,

                teamId:
                    teamId

            });


        if (!project) {

            return res.status(404).json({
                error:
                    "Project not found."
            });
        }


        let effectiveRole =
            teamMember.role;


        const projectMember =
            await ProjectMember.findOne({

                projectId:
                    project._id,

                teamId:
                    teamId,

                email:
                    userEmailLower

            });


        if (projectMember) {

            effectiveRole =
                projectMember.role;
        }


        if (effectiveRole !== "Manager") {

            return res.status(403).json({
                error:
                    "Only Project Manager can edit this project."
            });
        }


        project.name =
            name;

        await project.save();


        res.json({

            message:
                "Project updated successfully!",

            project:
                project

        });

    } catch (error) {

        console.error(
            "Update Project Error:",
            error
        );

        res.status(500).json({
            error:
                "Unable to update project."
        });
    }
});


// ==========================================
// PROJECT - DELETE
// ==========================================
app.delete("/api/projects/:id", async (req, res) => {

    try {

        const {
            userEmail,
            teamId
        } = req.body;


        if (!userEmail || !teamId) {

            return res.status(400).json({
                error:
                    "User and team are required."
            });
        }


        const userEmailLower =
            userEmail.toLowerCase();


        const teamMember =
            await Team.findOne({

                email:
                    userEmailLower,

                teamId:
                    teamId

            });


        if (!teamMember) {

            return res.status(403).json({
                error:
                    "You are not a member of this team."
            });
        }


        const project =
            await Project.findOne({

                _id:
                    req.params.id,

                teamId:
                    teamId

            });


        if (!project) {

            return res.status(404).json({
                error:
                    "Project not found."
            });
        }


        let effectiveRole =
            teamMember.role;


        const projectMember =
            await ProjectMember.findOne({

                projectId:
                    project._id,

                teamId:
                    teamId,

                email:
                    userEmailLower

            });


        if (projectMember) {

            effectiveRole =
                projectMember.role;
        }


        if (effectiveRole !== "Manager") {

            return res.status(403).json({
                error:
                    "Only Project Manager can delete this project."
            });
        }


        await Project.findOneAndDelete({

            _id:
                req.params.id,

            teamId:
                teamId

        });


        await ProjectMember.deleteMany({

            projectId:
                project._id,

            teamId:
                teamId

        });


        res.json({
            message:
                "Project deleted successfully!"
        });

    } catch (error) {

        console.error(
            "Delete Project Error:",
            error
        );

        res.status(500).json({
            error:
                "Unable to delete project."
        });
    }
});

// ==========================================
// TASKS - GET
// ==========================================

app.get("/api/tasks", async (req, res) => {

    try {

        const { teamId } = req.query;

        if (!teamId) {

            return res.status(400).json({
                error:
                    "Team ID is required."
            });
        }


        const tasks =
            await Task.find({
                teamId: teamId
            });


        res.json(tasks);

    } catch (error) {

        console.error(
            "Get Tasks Error:",
            error
        );

        res.status(500).json({
            error:
                "Unable to load tasks."
        });
    }
});


// ==========================================
// TASK - CREATE
// ==========================================
app.post("/api/tasks", async (req, res) => {

    try {

        const {
            name,
            projectName,
            priority,
            dueDate,
            createdBy,
            teamId
        } = req.body;


        if (
            !name ||
            !projectName ||
            !createdBy ||
            !teamId
        ) {

            return res.status(400).json({
                error:
                    "Task name, project and user are required."
            });
        }


        const userEmail =
            createdBy.toLowerCase();


        const teamMember =
            await Team.findOne({

                email:
                    userEmail,

                teamId:
                    teamId

            });


        if (!teamMember) {

            return res.status(403).json({
                error:
                    "You are not a member of this team."
            });
        }


        if (projectName !== "General") {

            const project =
                await Project.findOne({

                    name:
                        projectName,

                    teamId:
                        teamId

                });


            if (!project) {

                return res.status(404).json({
                    error:
                        "Project not found."
                });
            }


            const projectMember =
                await ProjectMember.findOne({

                    projectId:
                        project._id,

                    teamId:
                        teamId,

                    email:
                        userEmail

                });


            const effectiveRole =
                projectMember
                    ? projectMember.role
                    : teamMember.role;


            if (
                effectiveRole === "Viewer"
            ) {

                return res.status(403).json({
                    error:
                        "Viewers cannot add tasks to this project."
                });
            }
        }


        const task = new Task({

            name:
                name,

            projectName:
                projectName,

            priority:
                priority || "Medium",

            dueDate:
                dueDate || "",

            createdBy:
                userEmail,

            teamId:
                teamId

        });


        await task.save();


        res.json({

            message:
                "Task created successfully!",

            task:
                task

        });

    } catch (error) {

        console.error(
            "Create Task Error:",
            error
        );

        res.status(500).json({
            error:
                "Unable to create task."
        });
    }
});


// ==========================================
// TASK - UPDATE
// ==========================================
app.put("/api/tasks/:id", async (req, res) => {

    try {

        const {
            name,
            projectName,
            priority,
            dueDate,
            status,
            userEmail,
            teamId
        } = req.body;


        if (!userEmail || !teamId) {

            return res.status(400).json({
                error:
                    "User and team are required."
            });
        }


        const userEmailLower =
            userEmail.toLowerCase();


        const teamMember =
            await Team.findOne({

                email:
                    userEmailLower,

                teamId:
                    teamId

            });


        if (!teamMember) {

            return res.status(403).json({
                error:
                    "You are not a member of this team."
            });
        }


        const task =
            await Task.findOne({

                _id:
                    req.params.id,

                teamId:
                    teamId

            });


        if (!task) {

            return res.status(404).json({
                error:
                    "Task not found."
            });
        }


        let effectiveRole =
            teamMember.role;


        if (
            task.projectName &&
            task.projectName !== "General"
        ) {

            const project =
                await Project.findOne({

                    name:
                        task.projectName,

                    teamId:
                        teamId

                });


            if (project) {

                const projectMember =
                    await ProjectMember.findOne({

                        projectId:
                            project._id,

                        teamId:
                            teamId,

                        email:
                            userEmailLower

                    });


                if (projectMember) {

                    effectiveRole =
                        projectMember.role;
                }
            }
        }


        if (effectiveRole === "Viewer") {

            return res.status(403).json({
                error:
                    "Viewers cannot modify tasks in this project."
            });
        }


        const updateData = {};


        if (name !== undefined)
            updateData.name = name;

        if (projectName !== undefined)
            updateData.projectName = projectName;

        if (priority !== undefined)
            updateData.priority = priority;

        if (dueDate !== undefined)
            updateData.dueDate = dueDate;

        if (status !== undefined)
            updateData.status = status;


        const updatedTask =
            await Task.findOneAndUpdate(

                {
                    _id:
                        req.params.id,

                    teamId:
                        teamId

                },

                updateData,

                {
                    new: true
                }
            );


        res.json({

            message:
                "Task updated successfully!",

            task:
                updatedTask

        });

    } catch (error) {

        console.error(
            "Update Task Error:",
            error
        );

        res.status(500).json({
            error:
                "Unable to update task."
        });
    }
});

// ==========================================
// TASK - DELETE
// ==========================================
app.delete("/api/tasks/:id", async (req, res) => {

    try {

        const {
            userEmail,
            teamId
        } = req.body;


        if (!userEmail || !teamId) {

            return res.status(400).json({
                error:
                    "User and team are required."
            });
        }


        const userEmailLower =
            userEmail.toLowerCase();


        const teamMember =
            await Team.findOne({

                email:
                    userEmailLower,

                teamId:
                    teamId

            });


        if (!teamMember) {

            return res.status(403).json({
                error:
                    "You are not a member of this team."
            });
        }


        const task =
            await Task.findOne({

                _id:
                    req.params.id,

                teamId:
                    teamId

            });


        if (!task) {

            return res.status(404).json({
                error:
                    "Task not found."
            });
        }


        let effectiveRole =
            teamMember.role;


        if (
            task.projectName &&
            task.projectName !== "General"
        ) {

            const project =
                await Project.findOne({

                    name:
                        task.projectName,

                    teamId:
                        teamId

                });


            if (project) {

                const projectMember =
                    await ProjectMember.findOne({

                        projectId:
                            project._id,

                        teamId:
                            teamId,

                        email:
                            userEmailLower

                    });


                if (projectMember) {

                    effectiveRole =
                        projectMember.role;
                }
            }
        }


        if (effectiveRole !== "Manager") {

            return res.status(403).json({
                error:
                    "Only Project Manager can delete tasks in this project."
            });
        }


        await Task.findOneAndDelete({

            _id:
                req.params.id,

            teamId:
                teamId

        });


        res.json({
            message:
                "Task deleted successfully!"
        });

    } catch (error) {

        console.error(
            "Delete Task Error:",
            error
        );

        res.status(500).json({
            error:
                "Unable to delete task."
        });
    }
});


// ==========================================
// AI ASSISTANT
// ==========================================

app.post("/api/ai", async (req, res) => {

    try {

        const userPrompt =
            req.body.prompt;


        if (!userPrompt) {

            return res.status(400).json({
                error:
                    "Please enter a prompt."
            });
        }


        const response =
            await ai.models.generateContent({

                model:
                    "gemini-3.5-flash",

                contents:
                    userPrompt

            });


        res.json({

            response:
                response.text

        });

    } catch (error) {

        console.error(
            "AI Error:",
            error
        );

        res.status(500).json({
            error:
                "Unable to get AI response."
        });
    }
});


// ==========================================
// START SERVER
// ==========================================

const PORT = 3000;

app.listen(PORT, () => {

    console.log(`Server running on http://localhost:${PORT}`);
});