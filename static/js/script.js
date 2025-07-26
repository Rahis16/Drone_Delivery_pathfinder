let currentMode = '.'; // default to open
let grid = [];

function createGrid() {
    const rows = parseInt(document.getElementById('rows').value);
    const cols = parseInt(document.getElementById('cols').value);
    const container = document.getElementById('grid-container');

    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${cols}, 110px)`;
    grid = [];

    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            const div = document.createElement('div');
            div.classList.add('cell', 'open');
            div.dataset.row = r;
            div.dataset.col = c;
            div.style.height = '110px';
            div.style.width = '110px';

            div.onclick = () => {
                toggleCell(div);
            };

            container.appendChild(div);
            row.push('.');
        }
        grid.push(row);
    }

    updateGridStructureView();
}

createGrid();

function toggleCell(cell) {
    const row = cell.dataset.row;
    const col = cell.dataset.col;

    const states = ['.', 'X', 'S', 'G'];
    const classes = ['open', 'block', 'start', 'goal'];

    let currentState = grid[row][col];
    let nextIndex = (states.indexOf(currentState) + 1) % states.length;
    let nextState = states[nextIndex];

    // Reset all other S or G if needed
    if (nextState === 'S') resetOther('S');
    if (nextState === 'G') resetOther('G');

    grid[row][col] = nextState;
    cell.className = `cell ${classes[nextIndex]}`;
    cell.textContent = nextState === '.' ? '' : nextState;

    // Add images
    if (nextState === 'S') {
        cell.innerHTML = "<img src='/static/images/drone.gif' width='110'>";
    } else if (nextState === 'G') {
        cell.innerHTML = "<img src='/static/images/flag.gif' width='110'>";
    }
    else if (nextState === 'X') {
        cell.innerHTML = "<img src='/static/images/house.png' width='110'>";
    }


    updateGridStructureView();
}

// resetinng others on multiple clicks turn by turn 
function resetOther(type) {
    const container = document.getElementById('grid-container').children;
    for (let i = 0; i < container.length; i++) {
        const cell = container[i];
        const r = cell.dataset.row;
        const c = cell.dataset.col;
        if (grid[r][c] === type) {
            grid[r][c] = '.';
            cell.className = 'cell open';
            cell.textContent = '';
        }
    }
    // ✅ Update after clearing old S or G
    updateGridStructureView();
}

function submitGrid() {
    const algorithm = document.getElementById('algorithm').value;

    // Send data to backend via AJAX
    $.ajax({
        url: '/solve/',  // This URL should match your Django path
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')  // Include CSRF token
        },
        data: {
            algorithm: algorithm,
            grid: JSON.stringify(grid)
        },
        success: function (response) {
            console.log("Path:", response.path);
            resetGridColors();
            highlightPath(response.path); // animate on grid
            if (response.tree) {
                renderSearchTree(response.tree); // 🔥 show the tree
            }
        },
        error: function () {
            alert("Error sending data to backend.");
        }
    });
}


function highlightPath(path) {
    // 1. Highlight the path first (light blue cells)
    path.forEach((coord, index) => {
        const row = coord[0];
        const col = coord[1];
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);

        if (cell && !cell.classList.contains('start') && !cell.classList.contains('goal')) {
            setTimeout(() => {
                cell.style.backgroundColor = '#ceffc2ff'; // light blue
            }, 200 * index);
        }
    });

    // 2. Start animated countdown
    setTimeout(() => {
        showCountdown(path);
    }, path.length * 200 + 500); // wait until highlighting is done
}


function showCountdown(path) {
    const countdownScreen = document.getElementById('countdown-screen');
    const countText = document.getElementById('count-text');

    countdownScreen.style.display = 'flex';

    let count = 3;

    const interval = setInterval(() => {
        if (count > 0) {
            countText.textContent = count;
            countText.classList.remove('count-text');
            void countText.offsetWidth; // restart animation
            countText.classList.add('count-text');
            count--;
        } else if (count === 0) {
            countText.textContent = 'GO!';
            countText.classList.remove('count-text');
            void countText.offsetWidth;
            countText.classList.add('count-text');
            count--;
        } else {
            clearInterval(interval);
            countdownScreen.style.display = 'none';
            moveDrone(path);
        }
    }, 1000); // 1 second per count
}

function moveDrone(path) {
    const drone = document.getElementById('drone-fly');

    // Start at the first cell
    const first = path[0];
    const firstCell = document.querySelector(`.cell[data-row="${first[0]}"][data-col="${first[1]}"]`);

    if (!firstCell) return;

    // Show and position drone
    const rect = firstCell.getBoundingClientRect();
    drone.style.display = 'block';
    drone.style.position = 'absolute';
    drone.style.left = rect.left + 'px';
    drone.style.top = rect.top + 'px';

    let step = 1;

    const interval = setInterval(() => {
        if (step >= path.length) {
            clearInterval(interval);
            // alert("Delivery Complete ✅");
            // 🔥 Launch confetti
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
            setTimeout(() => {
                clearAfterDelivery();
            }, 20000);
            return;
        }

        const [row, col] = path[step];
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            const rect = cell.getBoundingClientRect();
            drone.style.left = rect.left + 'px';
            drone.style.top = rect.top + 'px';
        }

        step++;
    }, 1400); // Adjust to match transition speed
}

// Resets all grid items and set to "." white 
function resetGrid() {
    window.location.reload();
    console.log("Grid has been reset ✅");
}

// Cleaning the path after delivery 
function clearAfterDelivery() {
    const cells = document.querySelectorAll('.cell');

    cells.forEach(cell => {
        if (
            !cell.classList.contains('start') &&
            !cell.classList.contains('goal') &&
            !cell.classList.contains('block')
        ) {
            cell.className = 'cell open';
            cell.innerHTML = '';
            cell.style.backgroundColor = 'white';
        }
    });
}

// for theoritical explaination 
function updateGridStructureView() {
    const formatted = grid.map(row =>
        '[' + row.map(cell => `'${cell}'`).join(', ') + ']'
    ).join(',\n');

    const finalString = '[\n' + formatted + '\n]';
    document.getElementById('grid-structure').textContent = finalString;
}

// for resetting the grid colors 
function resetGridColors() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        if (
            !cell.classList.contains('start') &&
            !cell.classList.contains('goal') &&
            !cell.classList.contains('block')
        ) {
            cell.style.backgroundColor = 'white';
        }
    });
}


function renderSearchTree(treeData) {
    new Treant({
        chart: {
            container: "#tree-container",
            connectors: {
                type: "step"
            },
            node: {
                HTMLclass: "nodeExample1"
            }
        },
        nodeStructure: treeData
    });
}

// CSRF Token helper (Django needs this)
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

