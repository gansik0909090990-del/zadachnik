"use strict";

// Чистая функция: выбор видимых задач без изменения массива и хранилища.
function selectVisibleTasks(tasks, filter, searchText) {
  const query = searchText.trim().toLowerCase();
  return tasks.filter(task => {
    const matchesStatus = filter === "active" ? !task.done : filter === "done" ? task.done : true;
    return matchesStatus && task.text.toLowerCase().includes(query);
  });
}
