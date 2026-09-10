// =====================================================
// SMART PROJECT MANAGER - SCRIPT.JS
// =====================================================

// ===============================
// DATA
// ===============================

let projects = [];
let tasks = [];

// ===============================
// TEAM & ROLE SYSTEM
// ===============================

let teamMembers = [];

const ROLE_MANAGER = "Manager";
const ROLE_CONTRIBUTOR = "Contributor";
const ROLE_VIEWER = "Viewer";

function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser")) || null;
}

function getUserRole() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
        return null;
    }

    const member = teamMembers.find(
        member => member.email === currentUser.email
    );

    return member ? member.role : null;
}

function isManager() {
    return getUserRole() === ROLE_MANAGER;
}

function isViewer() {
    return getUserRole() === ROLE_VIEWER;
}

// ===============================
// LOAD TEAM MEMBERS
// ===============================

async function loadTeamData() {

    const currentUser = getCurrentUser();

    if (!currentUser) {
        teamMembers = [];
        return;
    }

    try {

        const response = await fetch(
            "http://localhost:3000/api/team?teamId=TEAM001"
        );

        const data = await response.json();

        if (!response.ok) {

            console.error(data.error);
            teamMembers = [];
            return;
        }

        teamMembers = data.map(member => ({
            name: member.name,
            email: member.email,
            role: member.role
        }));

        // If no team exists, make the first logged-in user Manager
        if (teamMembers.length === 0) {

            const managerResponse = await fetch(
                "http://localhost:3000/api/team",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                   body: JSON.stringify({
    teamId: "TEAM001",
    name: currentUser.name,
    email: currentUser.email,
    role: ROLE_MANAGER
})
                }
            );

            const managerData =
                await managerResponse.json();

            if (managerResponse.ok) {

                teamMembers.push({
                    name: managerData.member.name,
                    email: managerData.member.email,
                    role: managerData.member.role
                });

            }
        }

    } catch (error) {

        console.error(
            "Load Team Error:",
            error
        );

        teamMembers = [];
    }
}
// ===============================
// SAVE TEAM MEMBERS
// ===============================

function saveTeamData() {

    localStorage.setItem(
        "teamMembers",
        JSON.stringify(teamMembers)
    );
}


// ===============================
// DISPLAY TEAM MEMBERS
// ===============================

function displayTeamMembers() {

    const container =
        document.getElementById("teamMembersContainer");

    const roleBadge =
        document.getElementById("currentUserRole");

    const addMemberBox =
        document.getElementById("addMemberBox");

    const createProjectBtn =
        document.getElementById("createProjectBtn");

    const addTaskBtn =
        document.getElementById("addTaskBtn");

    const currentRole = getUserRole();

    if (currentRole === ROLE_VIEWER) {

        if (createProjectBtn) {
            createProjectBtn.style.display = "none";
        }

        if (addTaskBtn) {
            addTaskBtn.style.display = "none";
        }

    } else {

        if (createProjectBtn) {
            createProjectBtn.style.display = "inline-block";
        }

        if (addTaskBtn) {
            addTaskBtn.style.display = "inline-block";
        }
    }

    if (!container) return;

    if (roleBadge) {
        roleBadge.textContent =
            "Role: " + (currentRole || "No Access");
    }
if (addMemberBox) {
    addMemberBox.style.display = isManager() ? "block" : "none";
}
    if (teamMembers.length === 0) {
        container.innerHTML =
            "<p>No team members found.</p>";
        return;
    }

    container.innerHTML = teamMembers.map(
        (member, index) => {
            const isCurrentUser =
                getCurrentUser()?.email === member.email;
            const memberActionsHtml =
                currentRole === ROLE_MANAGER && !isCurrentUser
                    ? `
                        <div class="member-action-buttons" role="group">
                            <button onclick="changeMemberRole(${index})">
                                Change Role
                            </button>

                            <button
                                class="danger-btn"
                                onclick="removeTeamMember(${index})"
                            >
                                Remove
                            </button>
                        </div>
                    `
                    : "";

            return '<div class="team-member-card">' +
                '<div class="member-info">' +
                    '<div class="member-avatar">' +
                        member.name.charAt(0).toUpperCase() +
                    '</div>' +
                    '<div>' +
                        '<h3>' +
                            escapeHTML(member.name) +
                            (isCurrentUser ? " (You)" : "") +
                        '</h3>' +
                        '<p>' + escapeHTML(member.email) + '</p>' +
                    '</div>' +
                '</div>' +
                '<div class="member-actions">' +
                    '<span class="role-badge">' +
                        escapeHTML(member.role) +
                    '</span>' +
                    memberActionsHtml +
                '</div>' +
            '</div>';
        }
    ).join("");
}

// ===============================
// ADD TEAM MEMBER
// ===============================

async function addTeamMember() {

    if (!isManager()) {

        alert("Only Manager can add team members.");

        return;
    }

    const nameInput =
        document.getElementById("memberName");

    const emailInput =
        document.getElementById("memberEmail");

    const roleInput =
        document.getElementById("memberRole");

    const teamMessage =
        document.getElementById("teamMessage");

    const name =
        nameInput.value.trim();

    const email =
        emailInput.value.trim().toLowerCase();

    const role =
        roleInput.value;

    if (!name || !email) {

        teamMessage.textContent =
            "Please enter member name and email.";

        teamMessage.style.color = "red";

        return;
    }

    // Check duplicate member
    const alreadyMember =
        teamMembers.some(
            member => member.email === email
        );

    if (alreadyMember) {

        teamMessage.textContent =
            "❌ This user is already in the team.";

        teamMessage.style.color = "red";

        return;
    }

    try {

        const response = await fetch(
            "http://localhost:3000/api/team",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    email: email,
                    role: role
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            teamMessage.textContent =
                "❌ " + data.error;

            teamMessage.style.color = "red";

            return;
        }

        teamMembers.push({
            name: data.member.name,
            email: data.member.email,
            role: data.member.role
        });

        displayTeamMembers();

        nameInput.value = "";
        emailInput.value = "";
        roleInput.value = ROLE_CONTRIBUTOR;

        teamMessage.textContent =
            "✅ Team member added successfully.";

        teamMessage.style.color = "green";

    } catch (error) {

        console.error(
            "Add Team Member Error:",
            error
        );

        teamMessage.textContent =
            "❌ Server connection failed.";

        teamMessage.style.color = "red";
    }
}
saveTeamData();
        displayTeamMembers();
// ===============================
// REMOVE TEAM MEMBER
// ===============================

async function removeTeamMember(index) {

    if (!isManager()) {

        alert("Only Manager can remove members.");

        return;
    }

    const member =
        teamMembers[index];

    if (!member) return;

    const currentUser =
        getCurrentUser();

    // Manager cannot remove himself
    if (
        currentUser &&
        member.email === currentUser.email
    ) {

        alert("You cannot remove yourself from the team.");

        return;
    }

    const confirmRemove =
        confirm(
            `Remove ${member.name} from the team?`
        );

    if (!confirmRemove) return;

    try {

        const response = await fetch(
            "http://localhost:3000/api/team/" +
            encodeURIComponent(member.email),
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(
                data.error ||
                "Unable to remove team member."
            );

            return;
        }

        teamMembers.splice(index, 1);

        saveTeamData();
        displayTeamMembers();

    } catch (error) {

        console.error(
            "Remove Team Member Error:",
            error
        );

        alert("Server connection failed.");
    }
}

// ===============================
// CHANGE MEMBER ROLE
// ===============================
async function changeMemberRole(index) {

    if (!isManager()) {

        alert("Only Manager can change roles.");

        return;
    }

    const member =
        teamMembers[index];

    if (!member) return;

    const newRole =
        prompt(
            `Enter new role for ${member.name}:\n\nManager\nContributor\nViewer`,
            member.role
        );

    if (!newRole) return;

    const validRoles = [
        ROLE_MANAGER,
        ROLE_CONTRIBUTOR,
        ROLE_VIEWER
    ];

    if (!validRoles.includes(newRole)) {

        alert(
            "Invalid role. Please use Manager, Contributor or Viewer."
        );

        return;
    }

    try {

        const response = await fetch(
            "http://localhost:3000/api/team/" +
            encodeURIComponent(member.email),
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    role: newRole
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(
                data.error ||
                "Unable to change role."
            );

            return;
        }

        member.role = data.member.role;

        displayTeamMembers();

    } catch (error) {

        console.error(
            "Change Role Error:",
            error
        );

        alert("Server connection failed.");
    }
}

// ===============================
// TEAM BUTTON EVENT
// ===============================

const addMemberBtn =
    document.getElementById("addMemberBtn");

if (addMemberBtn) {

    addMemberBtn.addEventListener(
        "click",
        addTeamMember
    );
}
// ===============================
// LOAD SAVED DATA SAFELY
// ===============================

async function loadData() {

    const currentUser = getCurrentUser();

    if (!currentUser || !currentUser.email) {
        projects = [];
        tasks = [];
        return;
    }

    try {

        const response = await fetch(
            "http://localhost:3000/api/projects?teamId=TEAM001"
        );

        const data = await response.json();

        if (!response.ok) {
            console.error(data.error);
            projects = [];
        } else {
            projects = data.map(project => ({
                name: project.name,
                createdAt: project.createdAt,
                progress: project.progress
            }));
        }

    } catch (error) {

        console.error(
            "Load Projects Error:",
            error
        );

        projects = [];
    }

    // Tasks MongoDB se load honge
try {

    const taskResponse = await fetch(
        "http://localhost:3000/api/tasks?teamId=TEAM001"
    );

    const taskData = await taskResponse.json();

    if (!taskResponse.ok) {

        console.error(taskData.error);

        tasks = [];

    } else {

        tasks = taskData.map(task => ({
            name: task.name,
            project: task.projectName,
            priority: task.priority,
            dueDate: task.dueDate,
            status: task.status
        }));

    }

} catch (error) {

    console.error(
        "Load Tasks Error:",
        error
    );

    tasks = [];
}


    if (!Array.isArray(projects)) {
        projects = [];
    }

    if (!Array.isArray(tasks)) {
        tasks = [];
    }
}
// ===============================
// INPUT ELEMENTS
// ===============================

const taskNameInput =
    document.getElementById("taskName");

const taskPriorityInput =
    document.getElementById("taskPriority");

const taskDueDateInput =
    document.getElementById("taskDueDate");

const addTaskBtn =
    document.getElementById("addTaskBtn");

const projectNameInput =
    document.getElementById("projectName");

const createProjectBtn =
    document.getElementById("createProjectBtn");

const projectsContainer =
    document.getElementById("projectsContainer");

const message =
    document.getElementById("message");

const taskMessage =
    document.getElementById("taskMessage");


// ===============================
// SAVE USER-SPECIFIC DATA
// ===============================

function saveData() {

    try {

        const currentUser =
            JSON.parse(
                localStorage.getItem("currentUser")
            );

        if (!currentUser || !currentUser.email) {
            return;
        }

        const userKey =
            currentUser.email
                .replace(/[^a-zA-Z0-9]/g, "_");

        const projectKey =
            "projects_" + userKey;

        const taskKey =
            "tasks_" + userKey;

        localStorage.setItem(
            projectKey,
            JSON.stringify(projects)
        );

        localStorage.setItem(
            taskKey,
            JSON.stringify(tasks)
        );

    } catch (error) {

        console.error(
            "Error saving user data:",
            error
        );
    }
}

// ===============================
// CREATE PROJECT
// ===============================

async function createProject() {

    if (isViewer()) {
        alert("Viewers cannot create projects.");
        return;
    }

    if (!projectNameInput) {
        return;
    }

    const projectName = projectNameInput.value.trim();

    if (projectName === "") {
        if (message) {
            message.textContent = "Please enter a project name.";
        }
        return;
    }

    const currentUser = getCurrentUser();

    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    try {

        const response = await fetch("http://localhost:3000/api/projects", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: projectName,
                createdBy: currentUser.email,
                teamId: "TEAM001"
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || "Unable to create project.");
            return;
        }

        // Add returned project to current UI
        projects.push({
            name: data.project.name,
            createdAt: data.project.createdAt,
            progress: data.project.progress
        });

        displayProjects();
        updateTaskProjectDropdown();
        updateTaskProjectFilter();
        displayTasks();
        updateDashboard();

        if (message) {
            message.textContent =
                "Project created successfully.";
        }

        projectNameInput.value = "";

    } catch (error) {

        console.error("Project Error:", error);

        if (message) {
            message.textContent =
                "❌ Server connection failed.";
        }
    }
}
// ===============================
// DISPLAY PROJECTS
// ===============================

function displayProjects() {

    const container =
        document.getElementById(
            "projectsContainer"
        );

    if (!container) {
        return;
    }

    if (projects.length === 0) {

        container.innerHTML =
            "<p>No projects created yet.</p>";

        return;
    }

    container.innerHTML = "";

    projects.forEach(
        function(project, index) {

            const projectTasks =
                tasks.filter(
                    function(task) {

                        return (
                            task.project ===
                            project.name
                        );
                    }
                );

            const completedTasks =
                projectTasks.filter(
                    function(task) {

                        return (
                            task.status ===
                            "Completed"
                        );
                    }
                );

            let progress = 0;

            if (projectTasks.length > 0) {

                progress =
                    Math.round(
                        (
                            completedTasks.length /
                            projectTasks.length
                        ) * 100
                    );
            }

            project.progress =
                progress;


            const projectCard =
                document.createElement("div");

            projectCard.className =
                "project-card";


            const title =
                document.createElement("h3");

            title.textContent =
                project.name;


            const date =
                document.createElement("p");

            date.textContent =
                "Created: " +
                project.createdAt;


            const progressText =
                document.createElement("p");

            progressText.textContent =
                "Progress: " +
                progress +
                "%";


            const progressBar =
                document.createElement("div");

            progressBar.className =
                "progress-bar";

            const progressFill =
                document.createElement("div");

            progressFill.style.width =
                progress + "%";

            progressFill.style.height =
                "100%";

            progressBar.appendChild(
                progressFill
            );


            const editButton =
                document.createElement("button");

            editButton.textContent =
                "✏️ Edit Project";

            editButton.addEventListener(
                "click",
                function() {

                    editProject(index);
                }
            );


            const deleteButton =
                document.createElement("button");

            deleteButton.textContent =
                "🗑️ Delete Project";

            deleteButton.addEventListener(
                "click",
                function() {

                    deleteProject(index);
                }
            );


            projectCard.appendChild(title);
            projectCard.appendChild(date);
            projectCard.appendChild(progressText);
            projectCard.appendChild(progressBar);
            projectCard.appendChild(editButton);
            projectCard.appendChild(deleteButton);
            const viewButton =
    document.createElement("button");

viewButton.textContent =
    "👁️ View Tasks";

viewButton.addEventListener(
    "click",
    function() {

        const projectFilter =
            document.getElementById(
                "taskProjectFilter"
            );

        if (projectFilter) {

            projectFilter.value =
                project.name;

            displayTasks();
        }

        const tasksSection =
            document.getElementById(
                "tasksSection"
            );

        if (tasksSection) {

            tasksSection.scrollIntoView({
                behavior: "smooth"
            });
        }
    }
);

projectCard.appendChild(viewButton);

            container.appendChild(
                projectCard
            );
        }
    );

    saveData();
}


// ===============================
// UPDATE TASK PROJECT DROPDOWN
// ===============================

function updateTaskProjectDropdown() {

    const projectSelect =
        document.getElementById(
            "taskProjectInput"
        );

    if (!projectSelect) {
        return;
    }

    const currentValue =
        projectSelect.value;

    projectSelect.innerHTML =
        '<option value="General">General</option>';


    projects.forEach(
        function(project) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                project.name;

            option.textContent =
                project.name;

            projectSelect.appendChild(
                option
            );
        }
    );


    const exists =
        Array.from(
            projectSelect.options
        ).some(
            function(option) {

                return (
                    option.value ===
                    currentValue
                );
            }
        );

    if (exists) {

        projectSelect.value =
            currentValue;
    }
}


// ===============================
// UPDATE PROJECT FILTER
// ===============================

function updateTaskProjectFilter() {

    const projectFilter =
        document.getElementById(
            "taskProjectFilter"
        );

    if (!projectFilter) {
        return;
    }

    const currentValue =
        projectFilter.value;

    projectFilter.innerHTML =
        '<option value="all">All Projects</option>';


    projects.forEach(
        function(project) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                project.name;

            option.textContent =
                project.name;

            projectFilter.appendChild(
                option
            );
        }
    );


    const exists =
        Array.from(
            projectFilter.options
        ).some(
            function(option) {

                return (
                    option.value ===
                    currentValue
                );
            }
        );

    if (exists) {

        projectFilter.value =
            currentValue;
    }
}


// ===============================
// ADD TASK
// ===============================

async function addTask() {

    if (isViewer()) {
        alert("Viewers cannot add tasks.");
        return;
    }

    if (!taskNameInput) {
        return;
    }

    const taskName =
        taskNameInput.value.trim();

    if (taskName === "") {

        if (taskMessage) {
            taskMessage.textContent =
                "Please enter a task name.";
        }

        return;
    }

    const projectInput =
        document.getElementById("taskProjectInput");

    const currentUser = getCurrentUser();

    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    const projectName =
        projectInput
            ? projectInput.value
            : "General";

    const priority =
        taskPriorityInput
            ? taskPriorityInput.value
            : "Low";

    const dueDate =
        taskDueDateInput
            ? taskDueDateInput.value
            : "";

    try {

        const response = await fetch(
            "http://localhost:3000/api/tasks",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: taskName,
                    projectName: projectName,
                    priority: priority,
                    dueDate: dueDate,
                    createdBy: currentUser.email,
                    teamId: "TEAM001"
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(
                data.error ||
                "Unable to create task."
            );
            return;
        }

        // Add task to current UI
        tasks.push({
            name: data.task.name,
            project: data.task.projectName,
            priority: data.task.priority,
            dueDate: data.task.dueDate,
            status: data.task.status,
            teamId: data.task.teamId
        });

        displayTasks();
        displayProjects();
        updateDashboard();

        if (taskMessage) {
            taskMessage.textContent =
                "Task added successfully.";
        }

        taskNameInput.value = "";

        if (taskDueDateInput) {
            taskDueDateInput.value = "";
        }

    } catch (error) {

        console.error(
            "Task Error:",
            error
        );

        if (taskMessage) {
            taskMessage.textContent =
                "❌ Server connection failed.";
        }
    }
}

// ===============================
// DISPLAY TASKS
// ===============================

function displayTasks() {

    const tasksContainer =
        document.getElementById(
            "tasksContainer"
        );

    if (!tasksContainer) {
        return;
    }


    const searchInput =
        document.getElementById(
            "taskSearch"
        );

    const filterInput =
        document.getElementById(
            "taskFilter"
        );

    const projectFilterInput =
        document.getElementById(
            "taskProjectFilter"
        );


    const searchText =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const filterValue =
        filterInput
            ? filterInput.value
            : "all";


    const projectFilterValue =
        projectFilterInput
            ? projectFilterInput.value
            : "all";


    const filteredTasks =
        tasks.filter(
            function(task) {

                const name =
                    task.name || "";

                const priority =
                    task.priority || "Low";
                    
                const status =
                    task.status || "Pending";

                const project =
                    task.project || "General";
                    const dueDate =
    task.dueDate
        ? "📅 Due: " + task.dueDate
        : "📅 No due date";


                const matchesSearch =
                    name
                        .toLowerCase()
                        .includes(searchText);


                let matchesFilter = true;


                if (
                    filterValue ===
                    "pending"
                ) {

                    matchesFilter =
                        status ===
                        "Pending";
                }


                if (
                    filterValue ===
                    "completed"
                ) {

                    matchesFilter =
                        status ===
                        "Completed";
                }


                if (
                    filterValue ===
                    "high"
                ) {

                    matchesFilter =
                        priority
                            .toLowerCase() ===
                        "high";
                }


                if (
                    filterValue ===
                    "medium"
                ) {

                    matchesFilter =
                        priority
                            .toLowerCase() ===
                        "medium";
                }


                if (
                    filterValue ===
                    "low"
                ) {

                    matchesFilter =
                        priority
                            .toLowerCase() ===
                        "low";
                }


                const matchesProject =
                    projectFilterValue ===
                    "all" ||
                    project ===
                    projectFilterValue;


                return (
                    matchesSearch &&
                    matchesFilter &&
                    matchesProject
                );
            }
        );


    if (filteredTasks.length === 0) {

        tasksContainer.innerHTML =
            tasks.length === 0
                ? "<p>No tasks added yet.</p>"
                : "<p>No matching tasks found.</p>";

        return;
    }


    tasksContainer.innerHTML = "";


    filteredTasks.forEach(
        function(task) {

            const originalIndex =
                tasks.indexOf(task);


            const taskCard =
                document.createElement(
                    "div"
                );

            taskCard.className =
                "task-card";


            const title =
                document.createElement(
                    "h3"
                );

            title.textContent =
                task.name;


            const project =
                document.createElement(
                    "p"
                );

            project.textContent =
                "Project: " +
                (task.project ||
                    "General");


            const priority =
                document.createElement(
                    "span"
                );

            priority.className =
                "priority " +
                (
                    task.priority ||
                    "Low"
                ).toLowerCase();

            priority.textContent =
                task.priority ||
                "Low";


            const dueDate =
                document.createElement(
                    "p"
                );

            dueDate.textContent =
                "Due Date: " +
                (
                    task.dueDate ||
                    "Not set"
                );


            const status =
                document.createElement(
                    "p"
                );

            status.textContent =
                "Status: " +
                (
                    task.status ||
                    "Pending"
                );


            const completeButton =
                document.createElement(
                    "button"
                );

            completeButton.textContent =
                task.status ===
                "Completed"
                    ? "✅ Completed"
                    : "Complete";


            completeButton.addEventListener(
                "click",
                function() {

                    completeTask(
                        originalIndex
                    );
                }
            );


            const editButton =
                document.createElement(
                    "button"
                );

            editButton.textContent =
                "✏️ Edit";


            editButton.addEventListener(
                "click",
                function() {

                    editTask(
                        originalIndex
                    );
                }
            );


            const deleteButton =
                document.createElement(
                    "button"
                );

            deleteButton.textContent =
                "🗑️ Delete";


            deleteButton.addEventListener(
                "click",
                function() {

                    deleteTask(
                        originalIndex
                    );
                }
            );


            taskCard.appendChild(title);
            taskCard.appendChild(project);
            taskCard.appendChild(priority);
            taskCard.appendChild(dueDate);
            taskCard.appendChild(status);
            taskCard.appendChild(completeButton);
            taskCard.appendChild(editButton);
            taskCard.appendChild(deleteButton);


            tasksContainer.appendChild(
                taskCard
            );
        }
    );
}


// ===============================
// COMPLETE TASK
// ===============================

function completeTask(index) {

     if (isViewer()) {
        alert("Viewers cannot complete tasks.");
        return;
    }

    if (!tasks[index]) {
        return;
    }

    tasks[index].status =
        tasks[index].status ===
        "Completed"
            ? "Pending"
            : "Completed";

    saveData();

    displayTasks();
    displayProjects();
    updateDashboard();
}


// ===============================
// DELETE TASK
// ===============================

function deleteTask(index) {

     if (!isManager()) {
        alert("Only Manager can delete tasks.");
        return;
    }

    if (!tasks[index]) {
        return;
    }

    tasks.splice(index, 1);

    saveData();

    displayTasks();
    displayProjects();
    updateDashboard();
}


// ===============================
// EDIT TASK
// ===============================

function editTask(index) {

      if (isViewer()) {
        alert("Viewers cannot edit tasks.");
        return;
    }

    const task =
        tasks[index];

    if (!task) {
        return;
    }


    const newName =
        prompt(
            "Enter task name:",
            task.name
        );

    if (newName === null) {
        return;
    }


    const updatedName =
        newName.trim();


    if (updatedName === "") {

        alert(
            "Task name cannot be empty."
        );

        return;
    }


    const newPriority =
        prompt(
            "Enter priority (High / Medium / Low):",
            task.priority
        );

    if (newPriority === null) {
        return;
    }


    const updatedPriority =
        newPriority
            .trim()
            .toLowerCase();


    if (
        ![
            "high",
            "medium",
            "low"
        ].includes(
            updatedPriority
        )
    ) {

        alert(
            "Priority must be High, Medium or Low."
        );

        return;
    }


    const newDueDate =
        prompt(
            "Enter due date:",
            task.dueDate || ""
        );

    if (newDueDate === null) {
        return;
    }


    const newStatus =
        prompt(
            "Enter status (Pending / Completed):",
            task.status
        );

    if (newStatus === null) {
        return;
    }


    const updatedStatus =
        newStatus
            .trim()
            .toLowerCase();


    if (
        updatedStatus !==
            "pending" &&
        updatedStatus !==
            "completed"
    ) {

        alert(
            "Status must be Pending or Completed."
        );

        return;
    }


    task.name =
        updatedName;


    task.priority =
        updatedPriority
            .charAt(0)
            .toUpperCase() +
        updatedPriority.slice(1);


    task.dueDate =
        newDueDate.trim();


    task.status =
        updatedStatus
            .charAt(0)
            .toUpperCase() +
        updatedStatus.slice(1);


    saveData();

    displayTasks();
    displayProjects();
    updateDashboard();
}
// ===============================
// DELETE PROJECT
// ===============================

function deleteProject(index) {

     if (!isManager()) {
        alert("Only Manager can delete projects.");
        return;
    }

    if (!projects[index]) {
        return;
    }


    const confirmDelete =
        confirm(
            "Are you sure you want to delete this project?"
        );


    if (!confirmDelete) {
        return;
    }


    const deletedProject =
        projects[index].name;


    projects.splice(index, 1);


    tasks.forEach(
        function(task) {

            if (
                task.project ===
                deletedProject
            ) {

                task.project =
                    "General";
            }
        }
    );


    saveData();

    displayProjects();
    updateTaskProjectDropdown();
    updateTaskProjectFilter();
    displayTasks();
    updateDashboard();


    showSettingsMessage(
        "✅ Project deleted successfully."
    );
}


// ===============================
// EDIT PROJECT
// ===============================

function editProject(index) {

     if (!isManager()) {
        alert("Only Manager can edit projects.");
        return;
    }

    if (!projects[index]) {
        return;
    }


    const newName =
        prompt(
            "Enter new project name:",
            projects[index].name
        );


    if (newName === null) {
        return;
    }


    const updatedName =
        newName.trim();


    if (updatedName === "") {

        alert(
            "Project name cannot be empty."
        );

        return;
    }


    const oldName =
        projects[index].name;


    projects[index].name =
        updatedName;


    tasks.forEach(
        function(task) {

            if (
                task.project ===
                oldName
            ) {

                task.project =
                    updatedName;
            }
        }
    );


    saveData();

    displayProjects();
    updateTaskProjectDropdown();
    updateTaskProjectFilter();
    displayTasks();
    updateDashboard();


    showSettingsMessage(
        "✅ Project updated successfully."
    );
}


// ===============================
// DASHBOARD
// ===============================

function updateDashboard() {

    const totalProjects =
        document.getElementById(
            "totalProjects"
        );


    if (totalProjects) {

        totalProjects.textContent =
            projects.length;
    }


    const pendingTasks =
        tasks.filter(
            function(task) {

                return (
                    task.status ===
                    "Pending"
                );
            }
        ).length;


    const completedTasks =
        tasks.filter(
            function(task) {

                return (
                    task.status ===
                    "Completed"
                );
            }
        ).length;


    const pendingElement =
        document.getElementById(
            "pendingTasks"
        );


    if (pendingElement) {

        pendingElement.textContent =
            pendingTasks;
    }


    const completedElement =
        document.getElementById(
            "completedTasks"
        );


    if (completedElement) {

        completedElement.textContent =
            completedTasks;
    }


    let progress = 0;


    if (tasks.length > 0) {

        progress =
            Math.round(
                (
                    completedTasks /
                    tasks.length
                ) * 100
            );
    }


    const overallProgress =
        document.getElementById(
            "overallProgress"
        );


    if (overallProgress) {

        overallProgress.textContent =
        progress + "%";
    }


    const progressFill =
    document.getElementById(
        "progressFill"
    );

if (progressFill) {
    progressFill.style.width =
        progress + "%";
}


    // =========================
    // ANALYTICSprogressFill.style.width =
    // =========================

    const totalTasks =
        tasks.length;


    const lowPriority =
        tasks.filter(
            function(task) {

                return (
                    task.priority ===
                    "Low"
                );
            }
        ).length;


    const mediumPriority =
        tasks.filter(
            function(task) {

                return (
                    task.priority ===
                    "Medium"
                );
            }
        ).length;


    const highPriority =
        tasks.filter(
            function(task) {

                return (
                    task.priority ===
                    "High"
                );
            }
        ).length;


    setText(
        "analyticsTotalTasks",
        totalTasks
    );


    setText(
        "analyticsPendingTasks",
        pendingTasks
    );


    setText(
        "analyticsCompletedTasks",
        completedTasks
    );


    setText(
        "analyticsCompletionRate",
        progress + "%"
    );


    setText(
        "completionPercentage",
        progress + "%"
    );


    setText(
        "lowPriorityCount",
        lowPriority
    );


    setText(
        "mediumPriorityCount",
        mediumPriority
    );


    setText(
        "highPriorityCount",
        highPriority
    );


    const completionBar =
        document.getElementById(
            "completionBar"
        );


    if (completionBar) {

        completionBar.style.width =
            progress + "%";
    }
    const projectAnalytics =
    document.getElementById(
        "projectAnalytics"
    );

if (projectAnalytics) {

    projectAnalytics.innerHTML = "";

    const projectStats = {};

    tasks.forEach(function(task) {

        const projectName =
            task.project || "General";

        if (!projectStats[projectName]) {

            projectStats[projectName] = {
                total: 0,
                completed: 0
            };
        }

        projectStats[projectName].total++;

        if (task.status === "Completed") {
            projectStats[projectName].completed++;
        }
    });

    Object.keys(projectStats).forEach(
        function(projectName) {

            const stat =
                projectStats[projectName];

            const div =
                document.createElement("div");

            div.className =
                "priority-stat";

            div.innerHTML =
                "<span>📁 " +
                projectName +
                "</span>" +
                "<strong>" +
                stat.completed +
                "/" +
                stat.total +
                "</strong>";

            projectAnalytics.appendChild(div);
        }
    );
}
    // TASK STATUS COUNTS

const pendingStatus =
    tasks.filter(function(task) {
        return task.status === "Pending";
    }).length;

const inProgressStatus =
    tasks.filter(function(task) {
        return task.status === "In Progress";
    }).length;

const completedStatus =
    tasks.filter(function(task) {
        return task.status === "Completed";
    }).length;


setText(
    "pendingStatusCount",
    pendingStatus
);

setText(
    "inProgressStatusCount",
    inProgressStatus
);

setText(
    "completedStatusCount",
    completedStatus
);
}
// ===============================
// HELPER - SET TEXT
// ===============================

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;
    }
}


// ===============================
// SETTINGS MESSAGE
// ===============================

function showSettingsMessage(text) {

    const settingsMessage =
        document.getElementById(
            "settingsMessage"
        );

    if (!settingsMessage) {
        return;
    }

    settingsMessage.textContent =
        text;

    settingsMessage.style.color =
        "#16a34a";
}


// ===============================
// SEARCH
// ===============================

const taskSearch =
    document.getElementById(
        "taskSearch"
    );


if (taskSearch) {

    taskSearch.addEventListener(
        "input",
        displayTasks
    );
}


// ===============================
// PROJECT FILTER
// ===============================

const projectFilter =
    document.getElementById(
        "taskProjectFilter"
    );


if (projectFilter) {

    projectFilter.addEventListener(
        "change",
        displayTasks
    );
}


// ===============================
// TASK FILTER
// ===============================

const taskFilter =
    document.getElementById(
        "taskFilter"
    );


if (taskFilter) {

    taskFilter.addEventListener(
        "change",
        displayTasks
    );
}


// ===============================
// AI ASSISTANT
// ===============================

const askAiBtn =
    document.getElementById(
        "askAiBtn"
    );


const aiPrompt =
    document.getElementById(
        "aiPrompt"
    );


const aiResponse =
    document.getElementById(
        "aiResponse"
    );


const aiTasksContainer =
    document.getElementById(
        "aiTasksContainer"
    );


let latestAiSuggestion = "";


if (askAiBtn) {

    askAiBtn.addEventListener(
        "click",
        async function() {

            const prompt =
                aiPrompt
                    ? aiPrompt.value.trim()
                    : "";


            if (prompt === "") {

                if (aiResponse) {

                    aiResponse.innerHTML =
                        "<p>Please enter your question first.</p>";
                }

                return;
            }


            if (aiResponse) {

                aiResponse.innerHTML =
                    "<p>🤖 AI is thinking...</p>";
            }


            if (aiTasksContainer) {

                aiTasksContainer.innerHTML =
                    "";
            }


            try {

                const response =
                    await fetch(
                        "http://localhost:3000/api/ai",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    prompt:
                                        prompt
                                })
                        }
                    );


                const rawText =
                    await response.text();


                let data;


                try {

                    data =
                        JSON.parse(
                            rawText
                        );

                } catch (jsonError) {

                    throw new Error(
                        "Invalid response from AI server."
                    );
                }


                if (
                    !response.ok ||
                    data.error
                ) {

                    throw new Error(
                        data.error ||
                        "AI request failed."
                    );
                }


                latestAiSuggestion =
                    data.response || "";


                if (
                    typeof
                        latestAiSuggestion !==
                    "string"
                ) {

                    latestAiSuggestion =
                        JSON.stringify(
                            latestAiSuggestion
                        );
                }


                if (
                    !latestAiSuggestion.trim()
                ) {

                    if (aiResponse) {

                        aiResponse.innerHTML =
                            "<p>❌ No response from AI.</p>";
                    }

                    return;
                }


                if (aiResponse) {

                    aiResponse.innerHTML =
                        "<p>" +
                        escapeHTML(
                            latestAiSuggestion
                        ).replace(
                            /\n/g,
                            "<br>"
                        ) +
                        "</p>";
                }


                if (aiTasksContainer) {

                    const addButton =
                        document.createElement(
                            "button"
                        );

                    addButton.textContent =
                        "➕ Add AI Suggestion as Task";


                    addButton.addEventListener(
                        "click",
                        addAiTask
                    );


                    aiTasksContainer.appendChild(
                        addButton
                    );
                }


            } catch (error) {

                console.error(
                    "AI Error:",
                    error
                );


                if (aiResponse) {

                    aiResponse.innerHTML =
                        "<p>❌ " +
                        escapeHTML(
                            error.message
                        ) +
                        "</p>";
                }
            }
        }
    );
}


// ===============================
// ESCAPE HTML
// ===============================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;
}


// ===============================
// ADD AI SUGGESTION AS TASK
// ===============================

function addAiTask() {

    if (!latestAiSuggestion) {
        return;
    }


    const projectInput =
        document.getElementById(
            "taskProjectInput"
        );


    const task = {

        name:
            latestAiSuggestion,

        project:
            projectInput
                ? projectInput.value
                : "General",

        priority:
            "Medium",

        dueDate:
            "",

        status:
            "Pending"
    };


    tasks.push(task);

    saveData();

    displayTasks();
    displayProjects();
    updateDashboard();


    if (aiTasksContainer) {

        aiTasksContainer.innerHTML =
            "<p>✅ AI suggestion added to My Tasks!</p>";
    }
}


// ===============================
// DARK MODE
// ===============================

const darkModeToggle =
    document.getElementById(
        "darkModeToggle"
    );


function applySavedTheme() {

    const savedTheme =
        localStorage.getItem(
            "theme"
        );


    if (
        savedTheme ===
        "dark"
    ) {

        document.body.classList.add(
            "dark-mode"
        );


        if (darkModeToggle) {

            darkModeToggle.checked =
                true;
        }

    } else {

        document.body.classList.remove(
            "dark-mode"
        );


        if (darkModeToggle) {

            darkModeToggle.checked =
                false;
        }
    }
}


applySavedTheme();


if (darkModeToggle) {

    darkModeToggle.addEventListener(
        "change",
        function() {

            if (
                darkModeToggle.checked
            ) {

                document.body.classList.add(
                    "dark-mode"
                );

                localStorage.setItem(
                    "theme",
                    "dark"
                );

            } else {

                document.body.classList.remove(
                    "dark-mode"
                );

                localStorage.setItem(
                    "theme",
                    "light"
                );
            }
        }
    );
}
// ===============================
// CLEAR ALL DATA
// ===============================

const clearDataBtn =
    document.getElementById(
        "clearDataBtn"
    );


if (clearDataBtn) {

    clearDataBtn.addEventListener(
        "click",
        function() {

            const confirmClear =
                confirm(
                    "Are you sure you want to delete all projects and tasks?"
                );


            if (!confirmClear) {
                return;
            }


            projects = [];
            tasks = [];


            localStorage.removeItem(
                "projects"
            );

            localStorage.removeItem(
                "tasks"
            );


            displayProjects();

            updateTaskProjectDropdown();

            updateTaskProjectFilter();

            displayTasks();

            updateDashboard();


            showSettingsMessage(
                "✅ All projects and tasks deleted successfully."
            );
        }
    );
}


// ===============================
// INITIAL LOAD
// ===============================

displayProjects();

updateTaskProjectDropdown();

updateTaskProjectFilter();

displayTasks();

updateDashboard();

// ===============================
// BUTTON EVENTS - FIX
// ===============================

document.getElementById("createProjectBtn")
    ?.addEventListener("click", createProject);

document.getElementById("addTaskBtn")
    ?.addEventListener("click", addTask);


// ===============================
// SAVE DATA AFTER INITIAL CALCULATIONS
// ===============================

saveData();
// ===============================
// LOGIN & REGISTER PAGE TOGGLE
// ===============================

const loginPage = document.getElementById("loginPage");
const registerPage = document.getElementById("registerPage");

const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");

showRegister.addEventListener("click", function (event) {

    event.preventDefault();

    loginPage.querySelector(".login-card").style.display = "none";
    registerPage.style.display = "block";

});


showLogin.addEventListener("click", function (event) {
    event.preventDefault();

    registerPage.style.display = "none";
    loginPage.querySelector(".login-card").style.display = "block";

});
// ===============================
// CREATE ACCOUNT
// ===============================

const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const registerMessage =
        document.getElementById("registerMessage");

    // Check password match
    if (password !== confirmPassword) {

        registerMessage.textContent =
            "❌ Passwords do not match.";

        registerMessage.style.color = "red";

        return;
    }

    try {

        const response = await fetch("http://localhost:3000/api/register", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                name: name,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {

            registerMessage.textContent =
                "❌ " + data.error;

            registerMessage.style.color = "red";

            return;
        }

        registerMessage.textContent =
            "✅ Account created successfully!";

        registerMessage.style.color = "green";

        registerForm.reset();

        setTimeout(function () {

            registerPage.style.display = "none";
            loginPage.querySelector(".login-card").style.display = "block";

            registerMessage.textContent = "";

        }, 1500);

    } catch (error) {

        console.error("Registration Error:", error);

        registerMessage.textContent =
            "❌ Server connection failed.";

        registerMessage.style.color = "red";
    }
});
// ===============================
// USER LOGIN
// ===============================

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email =
        document.getElementById("loginEmail").value.trim().toLowerCase();

    const password =
        document.getElementById("loginPassword").value;

    const loginMessage =
        document.getElementById("loginMessage");

    try {

        const response = await fetch("http://localhost:3000/api/login", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok) {

            loginMessage.textContent =
                "❌ " + data.error;

            loginMessage.style.color = "red";

            return;
        }

        // Save logged-in user
        localStorage.setItem(
            "currentUser",
            JSON.stringify(data.user)
        );

        // Load this user's projects and tasks
        await loadData();
        await loadTeamData();

displayProjects();
updateTaskProjectDropdown();
updateTaskProjectFilter();
displayTasks();
updateDashboard();

        loginMessage.textContent =
            "✅ Login successful!";

        loginMessage.style.color = "green";

        // Clear login form
        loginForm.reset();

        // Hide login page
        setTimeout(function () {

            loginPage.style.display = "none";

        }, 800);

    } catch (error) {

        console.error("Login Error:", error);

        loginMessage.textContent =
            "❌ Server connection failed.";

        loginMessage.style.color = "red";
    }
});
// ===============================
// LOGOUT
// ===============================

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", function () {

    // Remove logged-in user
    localStorage.removeItem("currentUser");
projects = [];
tasks = [];

displayProjects();
updateTaskProjectDropdown();
updateTaskProjectFilter();
displayTasks();
updateDashboard();

    // Show login page
    loginPage.style.display = "flex";

    // Show login card
    loginPage.querySelector(".login-card").style.display = "block";

    // Hide register page
    registerPage.style.display = "none";

    // Clear login fields
    loginForm.reset();

    // Message clear
    loginMessage.textContent = "";

});
// ===============================
// LOGIN PROTECTION
// ===============================

const savedUser = localStorage.getItem("currentUser");

if (savedUser) {

    // User is already logged in
    loginPage.style.display = "none";

    loadData().then(() => {

        displayProjects();
        updateTaskProjectDropdown();
        updateTaskProjectFilter();
        displayTasks();
        updateDashboard();

        loadTeamData().then(() => {
            displayTeamMembers();
        });

    });

} else {

    // User is not logged in
    loginPage.style.display = "flex";

    registerPage.style.display = "none";

}
