const storageKey = "productivity-app-tasks";

let tasks = loadTasks();
let closeEditorTimer;
let calendarMonthOffset = 0;
const maximumCalendarOffset = 12;

const addTaskButton = document.querySelector("#add-task-button");
const taskEditor = document.querySelector("#task-editor");
const closeTaskEditorButton = document.querySelector("#close-task-editor");
const filterToggle = document.querySelector("#filter-toggle");
const taskFilters = document.querySelector("#task-filters");
const calendarMonth = document.querySelector("#calendar-month");
const calendarGrid = document.querySelector("#calendar-grid");
const previousMonthButton = document.querySelector("#previous-month");
const nextMonthButton = document.querySelector("#next-month");
const taskForm = document.querySelector("#task-form");
const taskList = document.querySelector("#task-list");
const todayTaskList = document.querySelector("#today-task-list");
const upcomingTaskList = document.querySelector("#upcoming-task-list");
const completedTaskList = document.querySelector("#completed-task-list");
const taskSearch = document.querySelector("#task-search");
const taskStatusFilter = document.querySelector("#task-status-filter");
const taskPriorityFilter = document.querySelector("#task-priority-filter");
const taskCategoryFilter = document.querySelector("#task-category-filter");
const taskSort = document.querySelector("#task-sort");

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(savedTasks) ? savedTasks : [];
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function createTaskId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getFormTask() {
  const formData = new FormData(taskForm);
  return {
    title: formData.get("title").trim(),
    description: formData.get("description").trim(),
    dueDate: formData.get("dueDate"),
    dueTime: formData.get("dueTime") || "23:59",
    priority: formData.get("priority"),
    category: formData.get("category")
  };
}

function openTaskEditor(task = null, dateValue = "") {
  window.clearTimeout(closeEditorTimer);
  taskEditor.classList.remove("is-closing");
  taskEditor.hidden = false;
  document.body.classList.add("task-modal-open");
  document.querySelector("#task-editor-heading").textContent = task ? "Edit Task" : "Add Task";
  document.querySelector("#task-id").value = task?.id || "";
  document.querySelector("#task-title").value = task?.title || "";
  document.querySelector("#task-description").value = task?.description || "";
  document.querySelector("#task-due-date").value = task?.dueDate || dateValue;
  document.querySelector("#task-due-time").value = task?.dueTime || "23:59";
  document.querySelector("#task-priority").value = task?.priority || "";
  document.querySelector("#task-category").value = task?.category || "";
  document.querySelector("#task-title").focus();
}

function closeTaskEditor() {
  if (taskEditor.hidden || taskEditor.classList.contains("is-closing")) return;
  document.body.classList.remove("task-modal-open");
  taskEditor.classList.add("is-closing");

  closeEditorTimer = window.setTimeout(() => {
    taskEditor.hidden = true;
    taskEditor.classList.remove("is-closing");
    taskForm.reset();
    document.querySelector("#task-id").value = "";
    document.querySelector("#task-editor-heading").textContent = "Add or Edit Task";
  }, 220);
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "No due date";
  }

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatTime(timeValue) {
  const normalizedTime = timeValue || "23:59";
  const [hours, minutes] = normalizedTime.split(":").map(Number);
  const time = new Date();
  time.setHours(hours, minutes, 0, 0);
  return time.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function getTodayKey() {
  const today = new Date();
  return getDateKey(today.getFullYear(), today.getMonth(), today.getDate());
}

function isToday(dateValue) {
  return dateValue === getTodayKey();
}

function createTaskCard(task) {
  const item = document.createElement("li");
  item.className = `task-card${task.completed ? " task-card--completed" : ""}`;
  item.dataset.taskId = task.id;

  const toggleButton = document.createElement("button");
  toggleButton.className = "task-card__toggle";
  toggleButton.type = "button";
  toggleButton.dataset.action = "toggle";
  toggleButton.setAttribute("aria-label", task.completed ? "Mark task incomplete" : "Mark task complete");
  toggleButton.textContent = task.completed ? "☑" : "☐";

  const content = document.createElement("div");
  const title = document.createElement("h4");
  title.className = "task-card__title";
  title.textContent = task.title;
  content.append(title);

  if (task.description) {
    const description = document.createElement("p");
    description.className = "task-card__description";
    description.textContent = task.description;
    content.append(description);
  }

  const meta = document.createElement("p");
  meta.className = "task-card__meta";
  const dueDate = document.createElement("span");
  dueDate.className = "task-card__due-date";
  dueDate.textContent = formatDate(task.dueDate);
  const dueTime = document.createElement("span");
  dueTime.className = "task-card__due-time";
  dueTime.textContent = formatTime(task.dueTime);
  const priority = document.createElement("span");
  priority.className = `task-card__badge task-card__priority--${task.priority}`;
  priority.textContent = `${task.priority} priority`;
  const category = document.createElement("span");
  category.className = "task-card__badge task-card__category";
  category.textContent = `${getCategoryEmoji(task.category)} ${task.category}`;
  meta.append(dueDate, dueTime, priority, category);
  content.append(meta);

  const actions = document.createElement("div");
  actions.className = "task-card__actions";
  actions.innerHTML = "<button type=\"button\" data-action=\"edit\">Edit</button><button type=\"button\" data-action=\"delete\">Delete</button>";

  item.append(toggleButton, content, actions);
  return item;
}

function getCategoryEmoji(category) {
  const categoryEmojis = {
    school: "📚",
    personal: "🏠",
    work: "💼"
  };
  return categoryEmojis[category] || "📌";
}

function getDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function createCalendarTask(task) {
  const item = document.createElement("li");
  item.className = `calendar__task calendar__task--${task.priority}${task.completed ? " calendar__task--completed" : ""}`;
  item.dataset.taskId = task.id;
  item.setAttribute("role", "button");
  item.tabIndex = 0;
  item.setAttribute("aria-label", `Edit task ${task.title}`);
  item.title = `${task.title} - ${task.priority} priority`;

  const category = document.createElement("span");
  category.className = "calendar__task-category";
  category.textContent = `${getCategoryEmoji(task.category)} `;
  category.setAttribute("aria-hidden", "true");

  const time = document.createElement("span");
  time.className = "calendar__task-time";
  time.textContent = formatTime(task.dueTime);
  time.setAttribute("aria-hidden", "true");

  const title = document.createElement("span");
  title.textContent = task.title;
  item.append(time, category, title);
  return item;
}

function renderCalendar() {
  const today = new Date();
  const currentDate = new Date(today.getFullYear(), today.getMonth() + calendarMonthOffset, 1);
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  const monthLabel = currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  calendarMonth.textContent = monthLabel;
  previousMonthButton.disabled = calendarMonthOffset <= -maximumCalendarOffset;
  nextMonthButton.disabled = calendarMonthOffset >= maximumCalendarOffset;
  calendarGrid.replaceChildren();

  ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].forEach((weekday) => {
    const heading = document.createElement("div");
    heading.className = "calendar__weekday";
    heading.setAttribute("role", "columnheader");
    heading.textContent = weekday;
    calendarGrid.append(heading);
  });

  for (let index = 0; index < 42; index += 1) {
    const dayOffset = index - firstDay + 1;
    const isOutsideMonth = dayOffset < 1 || dayOffset > daysInMonth;
    const dayNumber = isOutsideMonth
      ? (dayOffset < 1 ? daysInPreviousMonth + dayOffset : dayOffset - daysInMonth)
      : dayOffset;
    const dateKey = isOutsideMonth ? "" : getDateKey(year, month, dayNumber);
    const day = document.createElement("div");
    day.className = `calendar__day${isOutsideMonth ? " calendar__day--outside" : ""}${isToday(dateKey) ? " calendar__day--today" : ""}`;
    day.setAttribute("role", "gridcell");
    day.dataset.date = dateKey;
    day.tabIndex = isOutsideMonth ? -1 : 0;
    day.setAttribute("aria-label", isOutsideMonth ? `Outside month: ${dayNumber}` : dateKey);

    const number = document.createElement("span");
    number.className = "calendar__day-number";
    number.textContent = dayNumber;
    day.append(number);

    if (!isOutsideMonth) {
      const taskList = document.createElement("ul");
      taskList.className = "calendar__task-list";
      tasks
        .filter((task) => task.dueDate === dateKey)
        .sort((firstTask, secondTask) => (firstTask.dueTime || "23:59").localeCompare(secondTask.dueTime || "23:59"))
        .forEach((task) => taskList.append(createCalendarTask(task)));
      day.append(taskList);
    }

    day.addEventListener("click", (event) => {
      const calendarTask = event.target.closest(".calendar__task");
      if (calendarTask) {
        const task = tasks.find((item) => item.id === calendarTask.dataset.taskId);
        if (task) openTaskEditor(task);
        return;
      }
      if (!dateKey) return;
      openTaskEditor(null, dateKey);
    });
    day.addEventListener("keydown", (event) => {
      const calendarTask = event.target.closest(".calendar__task");
      if (calendarTask && (event.key === "Enter" || event.key === " ")) {
        const task = tasks.find((item) => item.id === calendarTask.dataset.taskId);
        if (task) {
          event.preventDefault();
          openTaskEditor(task);
        }
        return;
      }
      if (!dateKey || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      openTaskEditor(null, dateKey);
    });
    calendarGrid.append(day);
  }
}

function getVisibleTasks() {
  const searchValue = taskSearch.value.trim().toLowerCase();
  const statusValue = taskStatusFilter.value;
  const priorityValue = taskPriorityFilter.value;
  const categoryValue = taskCategoryFilter.value;
  const sortValue = taskSort.value;

  const visibleTasks = tasks.filter((task) => {
    const matchesSearch = !searchValue || `${task.title} ${task.description}`.toLowerCase().includes(searchValue);
    const matchesStatus = statusValue === "all" || (statusValue === "completed" ? task.completed : !task.completed);
    const matchesPriority = priorityValue === "all" || task.priority === priorityValue;
    const matchesCategory = categoryValue === "all" || task.category === categoryValue;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return visibleTasks.sort((firstTask, secondTask) => {
    if (sortValue === "title") return firstTask.title.localeCompare(secondTask.title);
    if (sortValue === "priority") return firstTask.priority.localeCompare(secondTask.priority);
    if (sortValue === "created-at") return secondTask.createdAt.localeCompare(firstTask.createdAt);
    const dateComparison = (firstTask.dueDate || "9999-12-31").localeCompare(secondTask.dueDate || "9999-12-31");
    return dateComparison || (firstTask.dueTime || "23:59").localeCompare(secondTask.dueTime || "23:59");
  });
}

function renderTaskList(list, taskItems) {
  list.replaceChildren(...taskItems.map(createTaskCard));
}

function render() {
  const visibleTasks = getVisibleTasks();
  renderTaskList(taskList, visibleTasks);
  renderTaskList(todayTaskList, visibleTasks.filter((task) => isToday(task.dueDate)));
  renderTaskList(upcomingTaskList, visibleTasks.filter((task) => task.dueDate && task.dueDate > getTodayKey() && !task.completed));
  renderTaskList(completedTaskList, visibleTasks.filter((task) => task.completed));
  renderCalendar();

  const completedCount = tasks.filter((task) => task.completed).length;
  document.querySelector("#total-task-count").textContent = tasks.length;
  document.querySelector("#completed-task-count").textContent = completedCount;
  document.querySelector("#incomplete-task-count").textContent = tasks.length - completedCount;
  document.querySelector("#due-today-task-count").textContent = tasks.filter((task) => isToday(task.dueDate)).length;
}

function handleTaskAction(event) {
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const taskCard = actionButton.closest("[data-task-id]");
  const task = tasks.find((item) => item.id === taskCard.dataset.taskId);
  if (!task) return;

  if (actionButton.dataset.action === "toggle") task.completed = !task.completed;
  if (actionButton.dataset.action === "delete") tasks = tasks.filter((item) => item.id !== task.id);
  if (actionButton.dataset.action === "edit") openTaskEditor(task);

  if (actionButton.dataset.action !== "edit") {
    saveTasks();
    render();
  }
}

addTaskButton.addEventListener("click", () => openTaskEditor());
closeTaskEditorButton.addEventListener("click", closeTaskEditor);
previousMonthButton.addEventListener("click", () => {
  if (calendarMonthOffset > -maximumCalendarOffset) {
    calendarMonthOffset -= 1;
    renderCalendar();
  }
});
nextMonthButton.addEventListener("click", () => {
  if (calendarMonthOffset < maximumCalendarOffset) {
    calendarMonthOffset += 1;
    renderCalendar();
  }
});
filterToggle.addEventListener("click", () => {
  const isOpen = taskFilters.hidden;
  taskFilters.hidden = !isOpen;
  filterToggle.setAttribute("aria-expanded", String(isOpen));
});
taskEditor.addEventListener("click", (event) => {
  if (event.target === taskEditor) closeTaskEditor();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !taskEditor.hidden) closeTaskEditor();
});
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formTask = getFormTask();
  const taskId = document.querySelector("#task-id").value;
  const existingTask = tasks.find((task) => task.id === taskId);

  if (existingTask) {
    Object.assign(existingTask, formTask);
  } else {
    tasks.push({ id: createTaskId(), ...formTask, completed: false, createdAt: new Date().toISOString() });
  }

  saveTasks();
  render();
  closeTaskEditor();
});

[taskList, todayTaskList, upcomingTaskList, completedTaskList].forEach((list) => {
  list.addEventListener("click", handleTaskAction);
});

[taskSearch, taskStatusFilter, taskPriorityFilter, taskCategoryFilter, taskSort].forEach((control) => {
  control.addEventListener("input", render);
  control.addEventListener("change", render);
});

taskEditor.hidden = true;
render();