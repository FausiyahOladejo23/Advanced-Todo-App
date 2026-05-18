// ================================================================
//  HNG STAGE 1A — ADVANCED TODO CARD JavaScript
// ============================================================
// This file adds all the interactive features required by Stage 1A:
//  1. Expand / Collapse the task description
//  2. Dynamic time-remaining countdown
//  3. Overdue indicator
//  4. Status synchronization (dropdown ↔ status badge)
//  5. Priority indicator updates
//  6. Edit task — open, save, cancel
//  7. Create new task
// ============================================================

// ─────────────────────────────────────────────────────────────
// SECTION 1 — GRABBING ELEMENTS FROM THE HTML
// ─────────────────────────────────────────────────────────────
// "document.querySelector()" searches the entire HTML page and
// returns the FIRST element that matches the CSS selector or
// data-testid attribute we give it.
// We store each element in a variable so we can reuse it easily.

// ── The main card ──
const taskCard          = document.querySelector('[data-testid="test-todo-card"]');

// ── The two layers inside the card ──
// .card-view  = the normal task display
// .card-edit  = the inline edit form (hidden by default)
const cardView          = taskCard.querySelector('.card-view');
const cardEdit          = taskCard.querySelector('.card-edit');

// ── Card view elements (things we READ from and UPDATE) ──
const taskTitle         = taskCard.querySelector('[data-testid="test-todo-title"]');
const taskDescription   = taskCard.querySelector('[data-testid="test-todo-description"]');
const statusBadge       = taskCard.querySelector('[data-testid="test-todo-status"]');
const priorityBadge     = taskCard.querySelector('[data-testid="test-todo-priority"]');
const priorityIndicator = taskCard.querySelector('[data-testid="test-todo-priority-indicator"]');
const dueDateEl         = taskCard.querySelector('[data-testid="test-todo-due-date"]');
const timeRemainingEl   = taskCard.querySelector('[data-testid="test-todo-time-remaining"]');
const overdueEl         = taskCard.querySelector('[data-testid="test-todo-overdue-indicator"]');
const statusControl     = taskCard.querySelector('[data-testid="test-todo-status-control"]');
const completeToggle    = taskCard.querySelector('[data-testid="test-todo-complete-toggle"]');
const expandBtn         = taskCard.querySelector('[data-testid="test-todo-expand-toggle"]');
const collapsible       = taskCard.querySelector('[data-testid="test-todo-collapsible-section"]');
const editBtn           = taskCard.querySelector('[data-testid="test-todo-edit-button"]');
const deleteBtn         = taskCard.querySelector('[data-testid="test-todo-delete-button"]');

// ── Edit form inputs (inside .card-edit) ──
const editTitleInput    = taskCard.querySelector('[data-testid="test-todo-edit-title-input"]');
const editDescInput     = taskCard.querySelector('[data-testid="test-todo-edit-description-input"]');
const editPriorityInput = taskCard.querySelector('[data-testid="test-todo-edit-priority-select"]');
const editDueDateInput  = taskCard.querySelector('[data-testid="test-todo-edit-due-date-input"]');
const saveBtn           = taskCard.querySelector('[data-testid="test-todo-save-button"]');
const cancelBtn         = taskCard.querySelector('[data-testid="test-todo-cancel-button"]');

// ── New Task panel elements ──
const openNewTaskBtn    = document.getElementById('openNewTaskBtn');
const newTaskPanel      = document.getElementById('newTaskPanel');
const ntBackdrop        = document.getElementById('ntBackdrop');
const closeNewTaskBtn   = document.getElementById('closeNewTaskBtn');
const ntCancelBtn       = document.getElementById('ntCancelBtn');
const ntSaveBtn         = document.getElementById('ntSaveBtn');
const ntTitle           = document.getElementById('ntTitle');
const ntDesc            = document.getElementById('ntDesc');
const ntPriority        = document.getElementById('ntPriority');
const ntStatus          = document.getElementById('ntStatus');
const ntDueDate         = document.getElementById('ntDueDate');
const ntTags            = document.getElementById('ntTags');
const ntError           = document.getElementById('ntError');
const taskList          = document.getElementById('taskList');



// ════════════════════════════════════════════════════════════════
// 2.  INLINE EDIT  —  SWAP CARD VIEW  ↔  EDIT FORM
// ════════════════════════════════════════════════════════════════
//
// The card contains TWO divs stacked on top of each other:
//   .card-view  — visible by default
//   .card-edit  — hidden by default  (display: none in CSS)
//
// When EDIT is clicked:
//   • We hide .card-view  by adding the class "hidden"
//   • We show .card-edit  by adding the class "active"
//   • We pre-fill the form inputs with the card's current values
//
// When SAVE or CANCEL is clicked, we reverse this.

function showEditForm() {
  // ── Pre-fill the form with current card values ──────────────

  // Title: just copy the text
  editTitleInput.value = taskTitle.textContent.trim();

  // Description: just copy the text
  editDescInput.value = taskDescription.textContent.trim();

  // Priority: the badge says "High Priority" — we only want "High"
  // .split(' ')[0]  splits at the space and takes the first word
  var currentPriority = priorityBadge.textContent.split(' ')[0];
  editPriorityInput.value = currentPriority;

  // Due date: the card shows "May 20, 2026"
  // The date <input> needs the format "YYYY-MM-DD"
  // So we parse the text into a Date object, then format it
  var rawDateText = dueDateEl.textContent.replace(/[^\w\s,]/g, '').trim();
  var parsedDate  = new Date(rawDateText);
  if (!isNaN(parsedDate)) {
    // toISOString() gives "2026-05-20T00:00:00.000Z"
    // .split('T')[0] keeps only "2026-05-20"
    editDueDateInput.value = parsedDate.toISOString().split('T')[0];
  }

  // ── Swap the layers ──────────────────────────────────────────
  // "hidden" makes .card-view invisible
  // "active" makes .card-edit visible
  cardView.classList.add('hidden');
  cardEdit.classList.add('active');

  // Move keyboard focus to the title input for accessibility
  editTitleInput.focus();
}


function hideEditForm() {
  // Reverse the swap — go back to normal card view
  cardView.classList.remove('hidden');
  cardEdit.classList.remove('active');

  // Return focus to the edit button so keyboard users aren't lost
  editBtn.focus();
}


// ── Wire up the buttons ─────────────────────────────────────
editBtn.addEventListener('click', showEditForm);
cancelBtn.addEventListener('click', hideEditForm);


// ── SAVE: validate, apply changes, hide form ────────────────
saveBtn.addEventListener('click', function () {

  var newTitle    = editTitleInput.value.trim();
  var newDesc     = editDescInput.value.trim();
  var newPriority = editPriorityInput.value;
  var newDueDate  = editDueDateInput.value;   // "YYYY-MM-DD" or ""

  // Validation — title cannot be empty
  if (!newTitle) {
    editTitleInput.style.outline = '2px solid #ef4444';
    editTitleInput.focus();
    return;   // stop — do not save
  }
  editTitleInput.style.outline = '';   // clear any error styling

  // Apply title
  taskTitle.textContent = newTitle;

  // Apply description
  if (newDesc) {
    taskDescription.textContent = newDesc;
  }

  // Apply priority (updates badge label, colour class, and indicator emoji)
  applyPriority(newPriority);

  // Apply due date
  if (newDueDate) {
    // Convert "2026-05-20" back into "May 20, 2026"
    // We add T12:00:00 (noon) to avoid timezone bugs
    var friendly = new Date(newDueDate + 'T12:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    dueDateEl.innerHTML = '<i class="fa-regular fa-calendar"></i> ' + friendly;
    updateTimeRemaining();
  }

  // Hide the form and show the updated card
  hideEditForm();
});



// ════════════════════════════════════════════════════════════════
// 3.  EXPAND / COLLAPSE
// ════════════════════════════════════════════════════════════════
// The collapsible section uses max-height: 0 when hidden.
// Adding class "open" transitions it to max-height: 300px.

var isExpanded = false;

expandBtn.addEventListener('click', function () {
  isExpanded = !isExpanded;   // flip true/false

  if (isExpanded) {
    collapsible.classList.add('open');
    expandBtn.textContent = 'Show Less';
    expandBtn.setAttribute('aria-expanded', 'true');
  } else {
    collapsible.classList.remove('open');
    expandBtn.textContent = 'Show More';
    expandBtn.setAttribute('aria-expanded', 'false');
  }
});



// ════════════════════════════════════════════════════════════════
// 4.  TIME REMAINING + OVERDUE INDICATOR
// ════════════════════════════════════════════════════════════════

function updateTimeRemaining() {

  // Read and clean the due date text from the card
  var rawText  = dueDateEl.textContent.replace(/[^\w\s,]/g, '').trim();
  var dueDate  = new Date(rawText);

  if (isNaN(dueDate)) return;   // exit if date can't be parsed

  var now      = new Date();
  var diffMs   = dueDate - now;
  // Math.ceil rounds 1.2 days UP to 2 so we never show "0 days" prematurely
  var diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    var late = Math.abs(diffDays);
    timeRemainingEl.innerHTML = '<i class="fa-regular fa-clock"></i> Overdue';
    timeRemainingEl.style.color = '#ef4444';
    overdueEl.textContent      = '⚠️ Overdue by ' + late + ' day' + (late !== 1 ? 's' : '');
    overdueEl.style.color      = '#ef4444';

  } else if (diffDays === 0) {
    timeRemainingEl.innerHTML  = '<i class="fa-regular fa-clock"></i> Due Today!';
    timeRemainingEl.style.color = '#f97316';
    overdueEl.textContent      = '⏰ Due Today';
    overdueEl.style.color      = '#f97316';

  } else if (diffDays === 1) {
    timeRemainingEl.innerHTML  = '<i class="fa-regular fa-clock"></i> 1 Day Remaining';
    timeRemainingEl.style.color = '#eab308';
    overdueEl.textContent      = '⚡ Almost Due';
    overdueEl.style.color      = '#eab308';

  } else {
    timeRemainingEl.innerHTML  = '<i class="fa-regular fa-clock"></i> ' + diffDays + ' Days Remaining';
    timeRemainingEl.style.color = '';
    overdueEl.textContent      = '✅ On Schedule';
    overdueEl.style.color      = '#22c55e';
  }
}

updateTimeRemaining();
setInterval(updateTimeRemaining, 60000);



// ════════════════════════════════════════════════════════════════
// 5.  STATUS DROPDOWN  ↔  STATUS BADGE SYNC
// ════════════════════════════════════════════════════════════════

statusControl.addEventListener('change', function () {
  var chosen = this.value;
  statusBadge.textContent = chosen;

  statusBadge.classList.remove('in-progress', 'completed', 'review', 'pending');

  var classMap = {
    'In Progress':  'in-progress',
    'Completed':    'completed',
    'Under Review': 'review',
    'Pending':      'pending'
  };

  if (classMap[chosen]) {
    statusBadge.classList.add(classMap[chosen]);
  }
});



// ════════════════════════════════════════════════════════════════
// 6.  PRIORITY HELPER
// ════════════════════════════════════════════════════════════════
// Reused by both the Edit save and the New Task creation.

function applyPriority(level) {
  priorityBadge.classList.remove('high-priority', 'medium-priority', 'low-priority');

  var map = {
    'High':   { label: 'High Priority',   cls: 'high-priority',   icon: '🔥 Critical Task' },
    'Medium': { label: 'Medium Priority', cls: 'medium-priority', icon: '⚡ Important Task' },
    'Low':    { label: 'Low Priority',    cls: 'low-priority',    icon: '✅ Routine Task'   }
  };

  var data = map[level] || map['High'];
  priorityBadge.textContent = data.label;
  priorityBadge.classList.add(data.cls);
  priorityIndicator.textContent = data.icon;
}



// ════════════════════════════════════════════════════════════════
// 7.  CHECKBOX COMPLETE TOGGLE
// ════════════════════════════════════════════════════════════════

completeToggle.addEventListener('change', function () {
  if (this.checked) {
    taskTitle.style.textDecoration = 'line-through';
    taskTitle.style.opacity        = '0.5';
    statusBadge.textContent        = 'Completed';
    statusBadge.classList.remove('in-progress', 'review', 'pending');
    statusBadge.classList.add('completed');
    statusControl.value = 'Completed';
  } else {
    taskTitle.style.textDecoration = '';
    taskTitle.style.opacity        = '';
    statusBadge.textContent        = 'In Progress';
    statusBadge.classList.remove('completed', 'review', 'pending');
    statusBadge.classList.add('in-progress');
    statusControl.value = 'In Progress';
  }
});



// ════════════════════════════════════════════════════════════════
// 8.  DELETE BUTTON
// ════════════════════════════════════════════════════════════════

deleteBtn.addEventListener('click', function () {
  if (window.confirm('Delete this task? This cannot be undone.')) {
    taskCard.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    taskCard.style.opacity    = '0';
    taskCard.style.transform  = 'scale(0.95)';
    setTimeout(function () { taskCard.remove(); }, 400);
  }
});



// ════════════════════════════════════════════════════════════════
// 9.  NEW TASK PANEL
// ════════════════════════════════════════════════════════════════
//
// The panel slides in from the right using a CSS transform.
// Adding class "open" to the panel and backdrop makes them visible.
//
// When "Add Task" is clicked:
//   • We read the form values
//   • Build a new <article> HTML string
//   • Insert it at the TOP of the task list
//   • Close the panel and reset the form

// ── Open ────────────────────────────────────────────────────
function openNewTaskPanel() {
  newTaskPanel.classList.add('open');
  ntBackdrop.classList.add('open');
  ntError.style.display = 'none';   // hide any previous error
  document.body.style.overflow = 'hidden';  // prevent background scroll
  ntTitle.focus();
}

// ── Close ───────────────────────────────────────────────────
function closeNewTaskPanel() {
  newTaskPanel.classList.remove('open');
  ntBackdrop.classList.remove('open');
  document.body.style.overflow = '';   // restore background scroll
  resetNewTaskForm();
}

// ── Reset form fields ───────────────────────────────────────
function resetNewTaskForm() {
  ntTitle.value     = '';
  ntDesc.value      = '';
  ntPriority.value  = 'Medium';
  ntStatus.value    = 'Pending';
  ntDueDate.value   = '';
  ntTags.value      = '';
  ntError.style.display = 'none';
  ntTitle.style.outline = '';
}

// ── Wire open/close buttons ─────────────────────────────────
openNewTaskBtn.addEventListener('click', openNewTaskPanel);
closeNewTaskBtn.addEventListener('click', closeNewTaskPanel);
ntCancelBtn.addEventListener('click', closeNewTaskPanel);
ntBackdrop.addEventListener('click', closeNewTaskPanel);

// Close with Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && newTaskPanel.classList.contains('open')) {
    closeNewTaskPanel();
  }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && ntSaveBtn.classList.contains('open')){
      closeNewTaskPanel();
    }
  })


// ── ADD TASK ────────────────────────────────────────────────
ntSaveBtn.addEventListener('click', function () {

  var title    = ntTitle.value.trim();
  var desc     = ntDesc.value.trim();
  var priority = ntPriority.value;        // "High" / "Medium" / "Low"
  var status   = ntStatus.value;          // "In Progress" etc.
  var dueDate  = ntDueDate.value;         // "YYYY-MM-DD" or ""
  var tagsRaw  = ntTags.value.trim();     // "Frontend, CSS" etc.

  // ── Validation ─────────────────────────────────────────
  if (!title) {
    ntTitle.style.outline = '2px solid #ef4444';
    ntError.style.display = 'block';
    ntTitle.focus();
    return;
  }
  ntTitle.style.outline = '';
  ntError.style.display = 'none';

  // ── Build priority data ─────────────────────────────────
  var priorityMap = {
    'High':   { label: 'High Priority',   cls: 'high-priority',   icon: '🔥 Critical Task' },
    'Medium': { label: 'Medium Priority', cls: 'medium-priority', icon: '⚡ Important Task' },
    'Low':    { label: 'Low Priority',    cls: 'low-priority',    icon: '✅ Routine Task'   }
  };
  var pData = priorityMap[priority] || priorityMap['Medium'];

  // ── Build status data ───────────────────────────────────
  var statusMap = {
    'In Progress':  'in-progress',
    'Completed':    'completed',
    'Under Review': 'review',
    'Pending':      'pending'
  };
  var statusClass = statusMap[status] || 'pending';

  // ── Format due date for display ─────────────────────────
  // If a date was entered, convert "2026-06-01" → "June 1, 2026"
  var dueDateDisplay = '';
  if (dueDate) {
    dueDateDisplay = new Date(dueDate + 'T12:00:00').toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // ── Build tags HTML ─────────────────────────────────────
  // If the user typed "Frontend, CSS" we split at commas,
  // trim each piece, and wrap it in a <span>
  var tagsHTML = '';
  if (tagsRaw) {
    tagsRaw.split(',').forEach(function (tag) {
      var clean = tag.trim();
      if (clean) {
        tagsHTML += '<span>' + clean + '</span>';
      }
    });
  }

  // ── Build the new card HTML string ─────────────────────
  // We use template literals (backtick strings) to write HTML
  // with variables embedded using ${...}
  var newCardHTML = `
    <article class="task-card new-card">
      <div class="task-top">
        <div class="task-left">
          <label class="checkbox-wrapper">
            <input type="checkbox"/>
            <span class="custom-checkbox"></span>
          </label>
          <div>
            <h2>${escapeHTML(title)}</h2>
            <p class="task-status ${statusClass}">${status}</p>
          </div>
        </div>
        <div class="task-actions">
          <button class="icon-btn delete" aria-label="Delete task">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>

      ${desc ? `<p class="task-description">${escapeHTML(desc)}</p>` : ''}

      <div class="task-details">
        <span class="priority ${pData.cls}">${pData.label}</span>
        <span class="priority-indicator">${pData.icon}</span>
        ${dueDateDisplay
          ? `<span class="due-date"><i class="fa-regular fa-calendar"></i> ${dueDateDisplay}</span>`
          : ''
        }
      </div>

      ${tagsHTML ? `<div class="tags">${tagsHTML}</div>` : ''}
    </article>
  `;

  // ── Inject the card into the task list ─────────────────
  // insertAdjacentHTML('afterbegin', ...) puts it at the VERY TOP
  // of the task list, above all existing cards.
  taskList.insertAdjacentHTML('afterbegin', newCardHTML);

  // ── Wire the delete button on the new card ──────────────
  // The new card is now the FIRST child of taskList.
  var newCard = taskList.firstElementChild;

  // Animate it sliding in from the top
  newCard.style.opacity   = '0';
  newCard.style.transform = 'translateY(-16px)';
  setTimeout(function () {
    newCard.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    newCard.style.opacity    = '1';
    newCard.style.transform  = 'translateY(0)';
  }, 10);

  // Wire its delete button
  var newDeleteBtn = newCard.querySelector('.delete');
  if (newDeleteBtn) {
    newDeleteBtn.addEventListener('click', function () {
      if (window.confirm('Delete this task?')) {
        newCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        newCard.style.opacity    = '0';
        newCard.style.transform  = 'scale(0.95)';
        setTimeout(function () { newCard.remove(); }, 300);
      }
    });
  }

  // ── Close the panel ─────────────────────────────────────
  closeNewTaskPanel();
});


// ── escapeHTML helper ───────────────────────────────────────
// NEVER insert raw user text into innerHTML without escaping it.
// This prevents malicious code from running if someone types
// <script> tags into your form inputs.
function escapeHTML(str) {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}