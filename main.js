import { RNG } from "./rand.js";

// --- DOM Element Selection ---
var questionInput = document.getElementById("question-input");
var dateSelector = document.getElementById("date-selector");
var memberInput = document.getElementById("member-input");
var addMemberBtn = document.getElementById("add-member-btn");
var memberList = document.getElementById("member-list");

// --- Global State ---
var numQustions = null;
var date = null;
var assignments = null;
var members = []; // Default to an empty array

// --- Cookie Helper Functions ---

/**
 * Sets a cookie with a given name, value, and expiration in days.
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value to store in the cookie.
 * @param {number} days - The number of days until the cookie expires.
 */
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    // Added SameSite=Lax for better security practices
    document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

/**
 * Retrieves a cookie's value by its name.
 * @param {string} name - The name of the cookie to retrieve.
 * @returns {string|null} The cookie's value, or null if not found.
 */
function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

// --- Member Management ---

/**
 * Loads the member list from the 'groupMembers' cookie.
 */
function loadMembersFromCookie() {
    const storedMembers = getCookie("groupMembers");
    if (storedMembers) {
        // Parse the JSON string from the cookie back into an array
        members = JSON.parse(storedMembers);
    }
}

/**
 * Saves the current member list to the 'groupMembers' cookie.
 * The cookie is set to expire in 7 days.
 */
function saveMembersToCookie() {
    // Convert the members array to a JSON string for storage
    setCookie("groupMembers", JSON.stringify(members), 7);
}

/**
 * Handles the logic of adding a new member to the list.
 */
function addMember() {
    const name = memberInput.value.trim();
    if (name && !members.includes(name)) {
        members.push(name);
        members.sort(); // Keep the list alphabetical
        saveMembersToCookie(); // Update the cookie
        memberInput.value = '';
        renderMembers();
        createAssignments();
    }
}


// --- Event Listeners ---

dateSelector.addEventListener(
    'change',
    function() {
        date = dateSelector.value;
        createAssignments();
    }
);

questionInput.addEventListener(
    'change',
    function() {
        numQustions = questionInput.value;
        createAssignments();
    }
);

addMemberBtn.addEventListener('click', addMember);

memberInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        // Prevent default action (like form submission) if applicable
        event.preventDefault();
        addMember();
    }
});

memberList.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-member-btn')) {
        const nameToRemove = e.target.dataset.name;
        members = members.filter(name => name !== nameToRemove);
        saveMembersToCookie(); // Update the cookie
        renderMembers();
        createAssignments();
    }
});

// --- Core Logic ---

/**
 * Renders the current list of members to the UI.
 */
function renderMembers() {
    memberList.innerHTML = ''; // Clear the current list
    members.forEach(name => {
        const li = document.createElement('li');
        li.textContent = name;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-member-btn';
        removeBtn.innerHTML = '&times;'; // Use HTML entity for 'x'
        removeBtn.dataset.name = name; // Add data-attribute to identify the member

        li.appendChild(removeBtn);
        memberList.appendChild(li);
    });
}

/**
 * Generates a list of assignments based on a seed date, number of questions, and member count.
 * This function is adapted from rand.js to support a dynamic number of members.
 * @param {string} date - The date string to use as a seed.
 * @param {number} questions - The number of questions to assign.
 * @param {number} memberCount - The number of members in the group.
 * @returns {Array<Array<number>>} The generated assignments.
 */
function generateList(date, questions, memberCount) {
    var num = parseInt(date.replaceAll("-", ""));
    var rng = new RNG(num);

    var assignments = [];
    while (assignments.length < questions) {
        assignments.push([-1, -1, -1]);
    }

    var choices = [];
    // Create a balanced pool of member indices to draw from
    while (choices.length < questions * 3) {
        for (let i = 0; i < memberCount; i++) {
            choices.push(i);
        }
    }

    for (let i = 0; i < assignments.length; i++) {
        for (let j = 0; j < 3; j++) {
            if (choices.length === 0) break;
            var ind = rng.range(choices.length);
            var val = choices[ind];
            choices.splice(ind, 1);

            assignments[i][j] = val;
        }
    }
    
    return assignments;
}


function createAssignments() {
    if (numQustions == null || date == null || members.length === 0) {
        document.getElementById('result-table').innerHTML = ''; // Clear table if inputs are invalid
        return;
    }

    assignments = generateList(date, numQustions, members.length);

    var pairs = [];

    for (let i = 0; i < assignments.length * 3; i++) {
        for (let j = i + 1; j < assignments.length * 3; j++) {
            pairs.push([i, j]);
        }
    }

    var done = false;

    var bestLoss = assignmentsLoss(assignments);

    outer:
    while (!done) {
        for (let i = 0; i < pairs.length; i++) {
            var firstVal = assignments[Math.floor(pairs[i][0] / 3)][pairs[i][0] % 3];
            var secondVal = assignments[Math.floor(pairs[i][1] / 3)][pairs[i][1] % 3];

            assignments[Math.floor(pairs[i][0] / 3)][pairs[i][0] % 3] = secondVal;
            assignments[Math.floor(pairs[i][1] / 3)][pairs[i][1] % 3] = firstVal;

            var loss = assignmentsLoss(assignments);

            if (loss < bestLoss) {
                bestLoss = loss;
                continue outer;
            }

            assignments[Math.floor(pairs[i][0] / 3)][pairs[i][0] % 3] = firstVal;
            assignments[Math.floor(pairs[i][1] / 3)][pairs[i][1] % 3] = secondVal;
        }

        done = true;
    }

    generateTable(assignments);
}

function assignmentsLoss(assign) {
    var loss = 0;

    for (let i = 0; i < assign.length; i++) {
        if (assign[i][0] == assign[i][1]) {
            loss += 1000;
        }
        if (assign[i][1] == assign[i][2]) {
            loss += 1000;
        }
        if (assign[i][0] == assign[i][2]) {
            loss += 1000;
        }
    }

    return loss;
}

/**
 * Generates and displays the HTML table from the assignment data.
 * The table is now dynamically sized based on the number of members.
 * @param {Array<Array<number>>} inputData - The assignment data.
 */
function generateTable(inputData) {
    // Dynamically create the occurrences object based on member count
    const occurrences = {};
    for (let i = 0; i < members.length; i++) {
        occurrences[i] = [];
    }

    inputData.forEach((subArray, index) => {
        const listNumber = index + 1; // Use 1-based indexing for question numbers
        subArray.forEach(number => {
            if (occurrences.hasOwnProperty(number)) {
                occurrences[number].push(listNumber);
            }
        });
    });

    // Dynamically calculate the number of rows needed
    let maxRowCount = 0;
    if (members.length > 0) {
        maxRowCount = Math.ceil(assignments.length * 3 / members.length);
    }


    const table = document.getElementById('result-table');
    table.innerHTML = '';

    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    
    // Create table headers from the members array
    members.forEach(name => {
        const th = document.createElement('th');
        th.textContent = name;
        headerRow.appendChild(th);
    });

    const tbody = table.createTBody();
    for (let rowIndex = 0; rowIndex < maxRowCount; rowIndex++) {
        const bodyRow = tbody.insertRow();
        // Create columns based on the number of members
        for (let colIndex = 0; colIndex < members.length; colIndex++) {
            const cell = bodyRow.insertCell();
            const indicesForThisNumber = occurrences[colIndex];
            
            if (indicesForThisNumber && indicesForThisNumber[rowIndex] !== undefined) {
                cell.textContent = indicesForThisNumber[rowIndex];
            } else {
                cell.innerHTML = '&nbsp;'; // Leave cell blank if no more assignments
            }
        }
    }
}

// --- Initial Page Load ---
// Load members from cookie first, then render them to the page.
loadMembersFromCookie();
renderMembers();