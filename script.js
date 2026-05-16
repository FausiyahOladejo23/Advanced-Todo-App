// ============================================================
// HNG STAGE 1A — ADVANCED TODO CARD JavaScript
// ============================================================
// This file adds all the interactive features required by Stage 1A:
//  1. Expand / Collapse the task description
//  2. Dynamic time-remaining countdown
//  3. Overdue indicator
//  4. Status synchronization (dropdown ↔ status badge)
//  5. Priority indicator updates
//  6. Edit modal — open, save, cancel
// ============================================================


// ─────────────────────────────────────────────────────────────
// SECTION 1 — GRABBING ELEMENTS FROM THE HTML
// ─────────────────────────────────────────────────────────────
// "document.querySelector()" searches the entire HTML page and
// returns the FIRST element that matches the CSS selector or
// data-testid attribute we give it.
// We store each element in a variable so we can reuse it easily.

// --- Expand / Collapse ---
const expandBtn        = document.querySelector('[data-testid="test-todo-expand-toggle"]');
const collapsibleContent = document.querySelector('[data-testid="test-todo-collapsible-section"]');

// --- Time & Overdue ---
const timeRemainingEl  = document.querySelector('[data-testid="test-todo-time-remaining"]');
const dueDateEl        = document.querySelector('[data-testid="test-todo-due-date"]');
const overdueEl        = document.querySelector('[data-testid="test-todo-overdue-indicator"]');

// --- Status ---
const statusControl    = document.querySelector('[data-testid="test-todo-status-control"]');
const statusBadge      = document.querySelector('[data-testid="test-todo-status"]');

// --- Priority ---
const priorityBadge    = document.querySelector('[data-testid="test-todo-priority"]');
const priorityIndicator = document.querySelector('[data-testid="test-todo-priority-indicator"]');

// --- Edit Modal ---
const editBtn          = document.querySelector('[data-testid="test-todo-edit-button"]');
const cancelBtn        = document.querySelector('[data-testid="test-todo-cancel-button"]');
const saveBtn          = document.querySelector('[data-testid="test-todo-save-button"]');
const editModal        = document.querySelector('[data-testid="test-todo-edit-form"]');

// --- Edit Inputs (fields inside the modal) ---
const editTitleInput   = document.querySelector('[data-testid="test-todo-edit-title-input"]');
const editDescInput    = document.querySelector('[data-testid="test-todo-edit-description-input"]');
const editPrioritySelect = document.querySelector('[data-testid="test-todo-edit-priority-select"]');
const editDueDateInput = document.querySelector('[data-testid="test-todo-edit-due-date-input"]');

// --- Live display elements (what the visitor sees on the card) ---
const taskTitle        = document.querySelector('[data-testid="test-todo-title"]');
const taskDescription  = document.querySelector('[data-testid="test-todo-description"]');


// ─────────────────────────────────────────────────────────────
// SECTION 2 — EXPAND / COLLAPSE
// ─────────────────────────────────────────────────────────────
// The "collapsible-section" div is hidden by default (height: 0).
// When the user clicks "Show More", we:
//   • Add a CSS class ("open") that makes it visible.
//   • Change the button text to "Show Less".
// When they click again, we remove that class and revert the text.

// We use a boolean (true/false) variable to track the current state.
let isExpanded = false; // false = collapsed (starting state)

// "addEventListener" listens for a specific event (here: a mouse "click")
// and runs the function we provide when that event happens.
expandBtn.addEventListener('click', function () {

  // Flip the boolean — if it was false it becomes true, and vice versa.
  isExpanded = !isExpanded;

  if (isExpanded) {
    // classList.add() attaches a CSS class to the element.
    // Your CSS should have a rule like:  .open { max-height: 500px; }
    collapsibleContent.classList.add('open');
    expandBtn.textContent = 'Show Less';
    // aria-expanded helps screen-readers know the section is now open.
    expandBtn.setAttribute('aria-expanded', 'true');
  } else {
    // classList.remove() detaches the CSS class.
    collapsibleContent.classList.remove('open');
    expandBtn.textContent = 'Show More';
    expandBtn.setAttribute('aria-expanded', 'false');
  }
});


// ─────────────────────────────────────────────────────────────
// SECTION 3 — DYNAMIC TIME REMAINING & OVERDUE INDICATOR
// ─────────────────────────────────────────────────────────────
// We read the due date text from the card, calculate how many
// days are left until that date, and display it in real time.
// If the date has already passed, we mark the task as overdue.

function updateTimeRemaining() {

  // Step 1: Get the due date text from the card.
  // dueDateEl.textContent looks like "📅 May 20, 2026".
  // We strip out the calendar icon character and whitespace.
  const rawText = dueDateEl.textContent.replace(/[^\w\s,]/g, '').trim();
  //  ↑ This regular expression removes any character that is NOT
  //    a letter, digit, space, or comma — so the icon disappears.

  // Step 2: Parse the cleaned text into a proper JavaScript Date object.
  const dueDate = new Date(rawText);

  // Step 3: Get today's date/time. Date.now() returns milliseconds
  // since Jan 1, 1970 — a universal way computers measure time.
  const now = new Date();

  // Step 4: Calculate the difference in milliseconds.
  const diffMs = dueDate - now; // positive = future, negative = past

  // Step 5: Convert milliseconds → days.
  // 1000 ms in a second × 60 s in a minute × 60 min in an hour × 24 hrs
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  // Math.ceil() rounds UP, so 1.2 days becomes 2 days remaining.

  // Step 6: Update the UI based on the result.
  if (diffMs < 0) {
    // The date is in the PAST → overdue!
    const overdueDays = Math.abs(diffDays); // Math.abs() makes negative → positive
    timeRemainingEl.innerHTML = '<i class="fa-regular fa-clock"></i> Overdue';
    timeRemainingEl.style.color = '#ef4444'; // red

    overdueEl.textContent = `⚠️ Overdue by ${overdueDays} day${overdueDays !== 0 ? 's' : ''}`;
    overdueEl.style.color = '#ef4444';

  } else if (diffDays === 0) {
    timeRemainingEl.innerHTML = '<i class="fa-regular fa-clock"></i> Due Today!';
    timeRemainingEl.style.color = '#f97316'; // orange

    overdueEl.textContent = '⏰ Due Today';
    overdueEl.style.color = '#f97316';

  } else if (diffDays === 1) {
    timeRemainingEl.innerHTML = '<i class="fa-regular fa-clock"></i> 1 Day Remaining';
    timeRemainingEl.style.color = '#eab308'; // yellow

    overdueEl.textContent = 'On Schedule';
    overdueEl.style.color = '#22c55e';

  } else {
    timeRemainingEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${diffDays} Days Remaining`;
    timeRemainingEl.style.color = ''; // reset to default CSS color

    overdueEl.textContent = 'On Schedule';
    overdueEl.style.color = '#22c55e'; // green
  }
}

// Run the function once immediately when the page loads.
updateTimeRemaining();

// Then run it again every 60 seconds (60,000 milliseconds) so it
// stays accurate without needing a page refresh.
// setInterval(functionToRun, milliseconds) is a built-in timer.
setInterval(updateTimeRemaining, 60000);


// ─────────────────────────────────────────────────────────────
// SECTION 4 — STATUS SYNCHRONIZATION
// ─────────────────────────────────────────────────────────────
// When the user picks a new status from the <select> dropdown,
// we update the status badge text AND its CSS class so the colour
// changes automatically to match.

statusControl.addEventListener('change', function () {

  // "this.value" is whatever option the user just selected.
  const newStatus = this.value;

  // Update the visible badge text.
  statusBadge.textContent = newStatus;

  // Remove all possible status classes first, then add the right one.
  // This prevents multiple colour classes stacking on the same element.
  statusBadge.classList.remove('completed', 'review', 'pending', 'in-progress');

  // Map each status value to a CSS class.
  const classMap = {
    'Completed':    'completed',
    'Under Review': 'review',
    'Pending':      'pending',
    'In Progress':  'in-progress',
  };

  // Look up the correct class and add it.
  const cssClass = classMap[newStatus];
  if (cssClass) {
    statusBadge.classList.add(cssClass);
  }

  // Also keep the <select> itself in sync (it already reflects the choice,
  // but this makes it explicit for any future logic).
  statusControl.value = newStatus;
});


// ─────────────────────────────────────────────────────────────
// SECTION 5 — PRIORITY INDICATOR HELPER
// ─────────────────────────────────────────────────────────────
// When the priority changes (via the edit form), we update both:
//  • The priority badge  (e.g. "High Priority")
//  • The priority indicator emoji  (e.g. "🔥 Critical Task")

function applyPriority(level) {
  // Remove old priority classes.
  priorityBadge.classList.remove('high-priority', 'medium-priority', 'low-priority');

  // Each priority maps to a badge label, a CSS class, and an emoji indicator.
  const priorityMap = {
    'High': {
      label:     'High Priority',
      cssClass:  'high-priority',
      indicator: '🔥 Critical Task',
    },
    'Medium': {
      label:     'Medium Priority',
      cssClass:  'medium-priority',
      indicator: '⚡ Important Task',
    },
    'Low': {
      label:     'Low Priority',
      cssClass:  'low-priority',
      indicator: '✅ Routine Task',
    },
  };

  // Look up the data for the chosen level (default to High if not found).
  const data = priorityMap[level] || priorityMap['High'];

  priorityBadge.textContent = data.label;
  priorityBadge.classList.add(data.cssClass);
  priorityIndicator.textContent = data.indicator;
}


// ─────────────────────────────────────────────────────────────
// SECTION 6 — EDIT MODAL
// ─────────────────────────────────────────────────────────────
// The edit modal is a pop-up form that lets the user change the
// task's title, description, priority, and due date.
//
// Flow:
//   [Edit button clicked] → modal appears, inputs pre-filled
//   [Save clicked]        → card updates, modal closes
//   [Cancel clicked]      → modal closes, nothing changes

// --- 6a. OPEN THE MODAL ---
editBtn.addEventListener('click', function () {

  // Pre-fill the input fields with the card's CURRENT values
  // so the user can see what they're editing.
  editTitleInput.value       = taskTitle.textContent.trim();
  editDescInput.value        = taskDescription.textContent.trim();

  // Pre-fill the due date input.
  // <input type="date"> requires the format "YYYY-MM-DD".
  // The card shows "May 20, 2026", so we convert it.
  const rawDate = dueDateEl.textContent.replace(/[^\w\s,]/g, '').trim();
  const parsedDate = new Date(rawDate);

  if (!isNaN(parsedDate)) { // isNaN checks if the date is valid
    // toISOString() gives "2026-05-20T00:00:00.000Z"
    // .split('T')[0] keeps only "2026-05-20"
    editDueDateInput.value = parsedDate.toISOString().split('T')[0];
  }

  // Pre-fill the priority select.
  // priorityBadge.textContent is like "High Priority" — we take the first word.
  const currentPriority = priorityBadge.textContent.split(' ')[0]; // "High"
  editPrioritySelect.value = currentPriority;

  // Show the modal.
  editModal.classList.add('active');
  // Move keyboard focus into the title field for accessibility.
  editTitleInput.focus();
});


// --- 6b. SAVE CHANGES ---
saveBtn.addEventListener('click', function () {

  // Read the new values from the input fields.
  const newTitle    = editTitleInput.value.trim();
  const newDesc     = editDescInput.value.trim();
  const newPriority = editPrioritySelect.value;
  const newDueDate  = editDueDateInput.value; // "YYYY-MM-DD"

  // Basic validation — don't save if the title is empty.
  if (!newTitle) {
    alert('Please enter a task title.');
    editTitleInput.focus();
    return; // "return" exits the function early, stopping the save.
  }

  // Update the task title on the card.
  taskTitle.textContent = newTitle;

  // Update the task description on the card.
  taskDescription.textContent = newDesc;

  // Update priority badge and indicator.
  applyPriority(newPriority);

  // Update the due date display on the card.
  if (newDueDate) {
    // Convert "2026-05-20" → a readable date like "May 20, 2026".
    // new Date('2026-05-20') creates a Date object.
    // toLocaleDateString() formats it nicely. We specify 'en-US' for
    // consistent output regardless of the user's system locale.
    const formatted = new Date(newDueDate + 'T12:00:00') // noon avoids timezone shifts
      .toLocaleDateString('en-US', {
        year:  'numeric',
        month: 'long',
        day:   'numeric',
      });

    // Replace the text but keep the calendar icon.
    dueDateEl.innerHTML = `<i class="fa-regular fa-calendar"></i> ${formatted}`;

    // Recalculate time remaining with the new date.
    updateTimeRemaining();
  }

  // Close the modal.
  closeModal();
});


// --- 6c. CANCEL / CLOSE MODAL ---
cancelBtn.addEventListener('click', closeModal);

function closeModal() {
  editModal.classList.remove('active');
  // Return focus to the edit button — good keyboard-navigation practice.
  editBtn.focus();
}

// Close modal if user clicks the dark overlay (outside the modal box).
editModal.addEventListener('click', function (event) {
  // "event.target" is the exact element the user clicked.
  // If it equals the modal backdrop itself (not a child inside it),
  // we close it.
  if (event.target === editModal) {
    closeModal();
  }
});

// Close modal with the Escape key — standard accessibility expectation.
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && editModal.classList.contains('active')) {
    closeModal();
  }
});


// ─────────────────────────────────────────────────────────────
// SECTION 7 — CHECKBOX COMPLETE TOGGLE
// ─────────────────────────────────────────────────────────────
// When the checkbox is ticked, we visually strike through the title
// and change the status to "Completed". Unticking reverses this.

const completeToggle = document.querySelector('[data-testid="test-todo-complete-toggle"]');

completeToggle.addEventListener('change', function () {

  if (this.checked) {
    // Cross the title out.
    taskTitle.style.textDecoration = 'line-through';
    taskTitle.style.opacity = '0.6';

    // Sync the status badge and dropdown.
    statusBadge.textContent = 'Completed';
    statusBadge.classList.remove('in-progress', 'review', 'pending');
    statusBadge.classList.add('completed');
    statusControl.value = 'Completed';

  } else {
    // Restore normal appearance.
    taskTitle.style.textDecoration = '';
    taskTitle.style.opacity = '';

    // Revert status to In Progress.
    statusBadge.textContent = 'In Progress';
    statusBadge.classList.remove('completed');
    statusBadge.classList.add('in-progress');
    statusControl.value = 'In Progress';
  }
});


// ─────────────────────────────────────────────────────────────
// SECTION 8 — DELETE BUTTON
// ─────────────────────────────────────────────────────────────
// Asks for confirmation, then hides the card with a fade-out animation.

const deleteBtn = document.querySelector('[data-testid="test-todo-delete-button"]');
const taskCard  = document.querySelector('[data-testid="test-todo-card"]');

deleteBtn.addEventListener('click', function () {

  // confirm() shows a browser dialog with OK / Cancel.
  // It returns true if the user clicks OK.
  const confirmed = confirm('Are you sure you want to delete this task?');

  if (confirmed) {
    // Fade out smoothly using a CSS transition.
    taskCard.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    taskCard.style.opacity    = '0';
    taskCard.style.transform  = 'scale(0.95)';

    // After the animation finishes (400 ms), remove the card from the DOM.
    // setTimeout(callback, delay) runs the callback after `delay` milliseconds.
    setTimeout(function () {
      taskCard.remove(); // Permanently removes the element from the page.
    }, 400);
  }
});