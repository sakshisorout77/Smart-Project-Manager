let projects = JSON.parse(localStorage.getItem("projects")) || [];
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
// ===============================
// INPUT ELEMENTS
// ===============================

const taskNameInput = document.getElementById("taskName");
const taskPriorityInput = document.getElementById("taskPriority");
const taskDueDateInput = document.getElementById("taskDueDate");
const addTaskBtn = document.getElementById("addTaskBtn");

const projectNameInput = document.getElementById("projectName");
const createProjectBtn = document.getElementById("createProjectBtn");

const projectsContainer = document.getElementById("projectsContainer");

const message = document.getElementById("message");
const taskMessage = document.getElementById("taskMessage");


// ===============================
// BUTTON EVENTS
// ===============================

if (addTaskBtn) {
    addTaskBtn.addEventListener("click", addTask);
}

if (createProjectBtn) {
    createProjectBtn.addEventListener("click", createProject);
}

// ===============================
// SAVE DATA
// ===============================

function saveData() {

    localStorage.setItem(
        "projects",
        JSON.stringify(projects)
    );

    localStorage.setItem(
        "tasks",
        JSON.stringify(tasks)
    );
}
// ===============================
// CREATE PROJECT
// ===============================

function createProject() {

    if (!projectNameInput) {
        return;
    }

    const projectName =
        projectNameInput.value.trim();

    if (projectName === "") {

        if (message) {
            message.textContent =
                "Please enter a project name.";
        }

        return;
    }

    const project = {

        name: projectName,

        createdAt:
            new Date().toLocaleDateString(),

        progress: 0
    };

    projects.push(project);

    saveData();

    displayProjects();
    updateTaskProjectDropdown();
    updateTaskProjectFilter();
    updateDashboard();

    if (message) {
        message.textContent =
            "Project created successfully.";
    }

    projectNameInput.value = "";
}
// ===============================
// DISPLAY PROJECTS
// ===============================

function displayProjects() {

    const container =
        document.getElementById("projectsContainer");

    if (!container) {
        return;
    }

    if (projects.length === 0) {

        container.innerHTML =
            "<p>No projects created yet.</p>";

        return;
    }

    container.innerHTML = "";

    projects.forEach(function(project, index) {

        // Calculate project progress
        const projectTasks =
            tasks.filter(function(task) {
                return task.project === project.name;
            });

        const completedProjectTasks =
            projectTasks.filter(function(task) {
                return task.status === "Completed";
            });

        let projectProgress = 0;

        if (projectTasks.length > 0) {

            projectProgress =
                Math.round(
                    (completedProjectTasks.length /
                        projectTasks.length) * 100
                );
        }

        project.progress = projectProgress;

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
            "Created: " + project.createdAt;

        const progress =
            document.createElement("p");

        progress.textContent =
            "Progress: " +
            projectProgress +
            "%";

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
        projectCard.appendChild(progress);
        projectCard.appendChild(editButton);
        projectCard.appendChild(deleteButton);

        container.appendChild(projectCard);
    });

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

    projects.forEach(function(project) {

        const option =
            document.createElement("option");

        option.value =
            project.name;

        option.textContent =
            project.name;

        projectSelect.appendChild(option);
    });

    if (
        currentValue &&
        Array.from(projectSelect.options)
            .some(function(option) {
                return option.value === currentValue;
            })
    ) {
        projectSelect.value =
            currentValue;
    }
}
// ===============================
// UPDATE TASK PROJECT FILTER
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

    projects.forEach(function(project) {

        const option =
            document.createElement("option");

        option.value =
            project.name;

        option.textContent =
            project.name;

        projectFilter.appendChild(option);
    });

    if (
        currentValue &&
        Array.from(projectFilter.options)
            .some(function(option) {
                return option.value === currentValue;
            })
    ) {
        projectFilter.value =
            currentValue;
    }
}
// ===============================
// ADD TASK
// ===============================

function addTask() {

    if (!taskNameInput) {
        return;
    }

    const taskName =
        taskNameInput.value.trim();

    const taskPriority =
        taskPriorityInput
            ? taskPriorityInput.value
            : "Low";

    const taskDueDate =
        taskDueDateInput
            ? taskDueDateInput.value
            : "";

    const projectInput =
        document.getElementById(
            "taskProjectInput"
        );

    if (taskName === "") {

        if (taskMessage) {
            taskMessage.textContent =
                "Please enter a task name.";
        }

        return;
    }

    const task = {

        name: taskName,

        project:
            projectInput
                ? projectInput.value
                : "General",

        priority: taskPriority,

        dueDate: taskDueDate,

        status: "Pending"
    };

    tasks.push(task);

    saveData();

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
}
// ===============================
// DISPLAY TASKS
// SEARCH + FILTER
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
        tasks.filter(function(task) {

            const taskName =
                task.name || "";

            const taskPriority =
                task.priority || "";

            const taskStatus =
                task.status || "Pending";

            const matchesSearch =
                taskName
                    .toLowerCase()
                    .includes(searchText);

            let matchesFilter = true;

            if (filterValue === "pending") {

                matchesFilter =
                    taskStatus === "Pending";
            }

            if (filterValue === "completed") {

                matchesFilter =
                    taskStatus === "Completed";
            }

            if (filterValue === "high") {

                matchesFilter =
                    taskPriority
                        .toLowerCase() === "high";
            }

            if (filterValue === "medium") {

                matchesFilter =
                    taskPriority
                        .toLowerCase() === "medium";
            }

            if (filterValue === "low") {

                matchesFilter =
                    taskPriority
                        .toLowerCase() === "low";
            }

            const matchesProject =
                projectFilterValue === "all" ||
                task.project === projectFilterValue;

            return (
                matchesSearch &&
                matchesFilter &&
                matchesProject
            );
        });

    if (filteredTasks.length === 0) {

        tasksContainer.innerHTML =
            tasks.length === 0
                ? "<p>No tasks added yet.</p>"
                : "<p>No matching tasks found.</p>";

        return;
    }

    tasksContainer.innerHTML = "";

    filteredTasks.forEach(function(task) {

        const originalIndex =
            tasks.indexOf(task);

        const taskCard =
            document.createElement("div");

        taskCard.className =
            "task-card";

        const title =
            document.createElement("h3");

        title.textContent =
            task.name;

        const project =
            document.createElement("p");

        project.textContent =
            "Project: " +
            (task.project || "General");

        const priority =
            document.createElement("span");

        priority.className =
            "priority " +
            (task.priority || "")
                .toLowerCase();

        priority.textContent =
            task.priority || "Low";

        const dueDate =
            document.createElement("p");

        dueDate.textContent =
            "Due Date: " +
            (task.dueDate || "Not set");

        const status =
            document.createElement("p");

        status.textContent =
            "Status: " +
            (task.status || "Pending");

        const completeButton =
            document.createElement("button");

        completeButton.textContent =
            task.status === "Completed"
                ? "✅ Completed"
                : "Complete";

        completeButton.addEventListener(
            "click",
            function() {
                completeTask(originalIndex);
            }
        );

        const editButton =
            document.createElement("button");

        editButton.textContent =
            "✏️ Edit";

        editButton.addEventListener(
            "click",
            function() {
                editTask(originalIndex);
            }
        );

        const deleteButton =
            document.createElement("button");

        deleteButton.textContent =
            "🗑️ Delete";

        deleteButton.addEventListener(
            "click",
            function() {
                deleteTask(originalIndex);
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

        tasksContainer.appendChild(taskCard);
    });
}
// ===============================
// COMPLETE TASK
// ===============================

function completeTask(index) {

    if (!tasks[index]) {
        return;
    }

    tasks[index].status =
        "Completed";

    saveData();

    displayTasks();
    displayProjects();
    updateDashboard();
}


// ===============================
// DELETE TASK
// ===============================

function deleteTask(index) {

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
        updatedPriority !== "high" &&
        updatedPriority !== "medium" &&
        updatedPriority !== "low"
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
        updatedStatus !== "pending" &&
        updatedStatus !== "completed"
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

    // Move tasks of deleted project to General
    tasks.forEach(function(task) {

        if (task.project === deletedProject) {
            task.project = "General";
        }
    });

    saveData();

    displayProjects();
    updateTaskProjectDropdown();
    updateTaskProjectFilter();
    displayTasks();
    updateDashboard();

    const settingsMessage =
        document.getElementById(
            "settingsMessage"
        );

    if (settingsMessage) {

        settingsMessage.textContent =
            "✅ Project deleted successfully.";

        settingsMessage.style.color =
            "#16a34a";
    }
}


// ===============================
// EDIT PROJECT
// ===============================

function editProject(index) {

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

    // Update related tasks
    tasks.forEach(function(task) {

        if (task.project === oldName) {

            task.project =
                updatedName;
        }
    });

    saveData();

    displayProjects();
    updateTaskProjectDropdown();
    updateTaskProjectFilter();
    displayTasks();
    updateDashboard();

    const settingsMessage =
        document.getElementById(
            "settingsMessage"
        );

    if (settingsMessage) {

        settingsMessage.textContent =
            "✅ Project updated successfully.";

        settingsMessage.style.color =
            "#16a34a";
    }
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
        tasks.filter(function(task) {

            return task.status === "Pending";

        }).length;

    const completedTasks =
        tasks.filter(function(task) {

            return task.status === "Completed";

        }).length;

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
                (completedTasks /
                    tasks.length) * 100
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
    // ANALYTICS
    // =========================

    const totalTasks =
        tasks.length;

    const lowPriority =
        tasks.filter(function(task) {

            return task.priority === "Low";

        }).length;

    const mediumPriority =
        tasks.filter(function(task) {

            return task.priority === "Medium";

        }).length;

    const highPriority =
        tasks.filter(function(task) {

            return task.priority === "High";

        }).length;


    const analyticsTotal =
        document.getElementById(
            "analyticsTotalTasks"
        );

    if (analyticsTotal) {
        analyticsTotal.textContent =
            totalTasks;
    }


    const analyticsPending =
        document.getElementById(
            "analyticsPendingTasks"
        );

    if (analyticsPending) {
        analyticsPending.textContent =
            pendingTasks;
    }


    const analyticsCompleted =
        document.getElementById(
            "analyticsCompletedTasks"
        );

    if (analyticsCompleted) {
        analyticsCompleted.textContent =
            completedTasks;
    }


    const analyticsRate =
        document.getElementById(
            "analyticsCompletionRate"
        );

    if (analyticsRate) {
        analyticsRate.textContent =
            progress + "%";
    }


    const completionPercentage =
        document.getElementById(
            "completionPercentage"
        );

    if (completionPercentage) {
        completionPercentage.textContent =
            progress + "%";
    }


    const completionBar =
        document.getElementById(
            "completionBar"
        );

    if (completionBar) {
        completionBar.style.width =
            progress + "%";
    }


    const lowCount =
        document.getElementById(
            "lowPriorityCount"
        );

    if (lowCount) {
        lowCount.textContent =
            lowPriority;
    }


    const mediumCount =
        document.getElementById(
            "mediumPriorityCount"
        );

    if (mediumCount) {
        mediumCount.textContent =
            mediumPriority;
    }


    const highCount =
        document.getElementById(
            "highPriorityCount"
        );

    if (highCount) {
        highCount.textContent =
            highPriority;
    }
}
// ===============================
// SEARCH
// ===============================

const taskSearch =
    document.getElementById(
        "taskSearch"
    );

const projectFilterInput =
    document.getElementById(
        "taskProjectFilter"
    );

if (taskSearch) {

    taskSearch.addEventListener(
        "input",
        displayTasks
    );
}

if (projectFilterInput) {

    projectFilterInput.addEventListener(
        "change",
        displayTasks
    );
}


// ===============================
// FILTER
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

                aiTasksContainer.innerHTML = "";
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

                            body: JSON.stringify({
                                prompt: prompt
                            })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok || data.error) {

                    if (aiResponse) {

                        aiResponse.innerHTML =
                            "<p>❌ " +
                            (
                                data.error ||
                                "AI request failed."
                            ) +
                            "</p>";
                    }

                    return;
                }

                latestAiSuggestion =
                    data.response || "";

                if (!latestAiSuggestion) {

                    if (aiResponse) {

                        aiResponse.innerHTML =
                            "<p>No response from AI.</p>";
                    }

                    return;
                }

                if (aiResponse) {

                    aiResponse.innerHTML =
                        "<p>" +
                        latestAiSuggestion
                            .replace(/\n/g, "<br>") +
                        "</p>";
                }

                if (aiTasksContainer) {

                    const addButton =
                        document.createElement("button");

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
                        "<p>❌ Unable to connect to AI server.</p>";
                }
            }
        }
    );
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

        name: latestAiSuggestion,

        project:
            projectInput
                ? projectInput.value
                : "General",

        priority: "Medium",

        dueDate: "",

        status: "Pending"
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

const savedTheme =
    localStorage.getItem("theme");

if (savedTheme === "dark") {

    document.body.classList.add(
        "dark-mode"
    );

    if (darkModeToggle) {
        darkModeToggle.checked = true;
    }
}

if (darkModeToggle) {

    darkModeToggle.addEventListener(
        "change",
        function() {

            if (darkModeToggle.checked) {

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

            const settingsMessage =
                document.getElementById(
                    "settingsMessage"
                );

            if (settingsMessage) {

                settingsMessage.textContent =
                    "✅ All projects and tasks deleted successfully.";

                settingsMessage.style.color =
                    "#16a34a";
            }
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