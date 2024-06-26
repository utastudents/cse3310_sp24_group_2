const wordGrid = document.querySelector(".wordGrid");
const wordBank = document.querySelector(".wordBank");
const chatForm = document.querySelector('.chatForm')
const chatInput = document.querySelector('.chatInput');
const gameChat = document.querySelector(".gameChat");
const chatList = document.querySelector(".messageList");
const leaderboard = document.querySelectorAll(".leaderboardList");
const exitGameButton = document.getElementById("gameScreen").querySelector(".exitButton");
const backToLobbyButton = document.querySelector(".backToLobby");
const gameTimer = document.querySelector(".gameTimerValue");

const gridDensityStat = document.getElementById("gridDensity");
const verticalUWordsStat = document.getElementById("verticalUPercentage");
const verticalDWordsStat = document.getElementById("verticalDPercentage");
const horizontalWordsStat = document.getElementById("horizontalPercentage");
const diagonalRWordsStat = document.getElementById("diagonalRPercentage");
const diagonalLWordsStat = document.getElementById("diagonalLPercentage");

let firstSelection = null;
let secondSelection = null;

let interval;
let hintGridItem;

// set up color map for selections
const colorMap = new Map();
colorMap.set("red", "#E51B1B");
colorMap.set("blue", "#106BFF");
colorMap.set("pink", "#E100A5");
colorMap.set("green", "#06A600");
// reset grid for new game
wordGrid.innerHTML = '';

// resize game chat
function resizeGameChat() {
    const topControlHeight = document.querySelector(".topControls").offsetHeight;
    console.log(topControlHeight);
    // const leaderboardHeight = document.querySelector(".gameLeaderboard").offsetHeight;
    const leaderboardHeight = 525.5;
    console.log(leaderboardHeight);
    let gameChatHeight = document.querySelector("html").offsetHeight - (topControlHeight + leaderboardHeight + 32 + 24);
    console.log(document.querySelector("html").offsetHeight);
    console.log(gameChatHeight);
    gameChat.style.maxHeight = gameChatHeight + "px";
}

// exiting game
exitGameButton.addEventListener('click', () => {
    // send status to server
    let message = {
        screen: "game",
        type: "leaveGame",
        uid: userSession.uid,
        gameId: userSession.gameId,
    };
    connection.send(JSON.stringify(message));

    // update user state
    userSession.gameId = null;
    resetGame();
    window.enterLobby();
})

// back to lobby on game end
backToLobbyButton.addEventListener('click', () => {
    window.enterLobby();
})

// Send chat on 'Enter'
chatInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

// Send chat on button submit
chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    sendMessage();
});

function sendMessage() {
    // Get message
    const chat = chatInput.value;

    let message = {
        screen: "game",
        type: "chatRoom",
        uid: userSession.uid,
        gameId: userSession.gameId,
        message: chat
    };
    connection.send(JSON.stringify(message));

    // Clear message field
    chatInput.value = '';
}

// Update chat box
function updateChatBox(username, color, message) {
    // Create new message element
    const messageItem = document.createElement('li');
    messageItem.className = 'message';
    const usernameSpan = document.createElement('span');
    usernameSpan.className = `${color}Message`;
    usernameSpan.textContent = `${username}: `;
    const messageText = document.createTextNode(message);
    messageItem.appendChild(usernameSpan);
    messageItem.appendChild(messageText);

    // Add message to chat list
    chatList.appendChild(messageItem);

    // Scroll the chat list to show the latest message
    chatList.scrollTop = chatList.scrollHeight;
}

function clearChatBox() {
    while (chatList.firstChild) {
        chatList.removeChild(chatList.firstChild);
    }
}

// Set up game (fill grid, fill word bank, reset leaderboard, reset chat, start timer)
function setUpGame(gameData) {
    grid = gameData.grid.grid;
    gridStats = gameData.grid;
    wordBankList = gameData.grid.wordBank;
    leaderboardList = gameData.leaderboard;
    fillGrid(grid);
    fillWordBank(wordBankList);
    updateLeaderboard(leaderboardList);
    setGameStats(gridStats.currentDens, gridStats.numVertU, gridStats.numVertD, gridStats.numHoriz, gridStats.numDiagR, gridStats.numDiagL);
    startTimer();
    resizeGameChat();
}

function startTimer() {
    gameTimer.textContent = "5:00";
    const endTime = Date.now() + 300 * 1000;
    updateTimer(endTime);
}

function updateTimer(endTime) {
    const remaining = endTime - Date.now();
    if (remaining > 0) {
        const seconds = Math.floor((remaining / 1000) % 60);
        const minutes = Math.floor((remaining / 1000) / 60);
        gameTimer.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        // update every half second
        setTimeout(() => updateTimer(endTime), 500);
    } else {
        gameTimer.textContent = "0:00";
    }
}

function clearGrid() {
    while (wordGrid.firstChild) {
        wordGrid.removeChild(wordGrid.firstChild);
    }
}

function fillGrid(grid) {
    for (let row = 0; row < 20; row++) {
        for (let col = 0; col < 20; col++) {
            const gridItem = document.createElement('div');
            gridItem.classList.add('gridItem');
            gridItem.dataset.x = col;
            gridItem.dataset.y = row;
            gridItem.id = `gridItem-${col}-${row}`;
            gridItem.innerHTML = grid[row][col].letter.toUpperCase();

            wordGrid.appendChild(gridItem);
        }
    }
}

function clearWordBank() {
    while (wordBank.firstChild) {
        wordBank.removeChild(wordBank.firstChild);
    }
}

function fillWordBank(wordBankList) {
    clearWordBank()
    for (const word in wordBankList) {
        const wordElement = document.createElement('p');
        wordElement.id = word;
        wordElement.textContent = word;
        wordBank.appendChild(wordElement);
    }
}

function setGameStats(gridDensity, verticalUWords, verticalDWords, horizontalWords, diagonalRWords, diagonalLWords) {
    gridDensityStat.innerHTML = "Grid Density: " + gridDensity.toString().substr(0, 4) + "%";
    verticalUWordsStat.innerHTML = "Vertical Up Words: " + verticalUWords.toString().substr(0, 4) + "%";
    verticalDWordsStat.innerHTML = "Vertical Down Words: " + verticalDWords.toString().substr(0, 4) + "%";
    horizontalWordsStat.innerHTML = "Horizontal Words: " + horizontalWords.toString().substr(0, 4) + "%";
    diagonalRWordsStat.innerHTML = "Diagonal Right Words: " + diagonalRWords.toString().substr(0, 4) + "%";
    diagonalLWordsStat.innerHTML = "Diagonal Left Words: " + diagonalLWords.toString().substr(0, 4) + "%";
}

wordGrid.addEventListener('click', function (event) {
    if (event.target.classList.contains('gridItem')) {
        if (!firstSelection) {
            firstSelection = event.target;
            sendLetterSelection(firstSelection.dataset.x, firstSelection.dataset.y);
            //event.target.classList.add('selected'); // Visually mark the item
        } else if (!secondSelection && event.target !== firstSelection) {
            secondSelection = event.target;
            sendWordSelection(firstSelection, secondSelection);
            resetSelections();
        }
    }

    if (hintGridItem != null) {
        stopBlinking();
    }
});

function resetSelections() {
    firstSelection = null;
    secondSelection = null;
}

function sendLetterSelection(xCoordinate, yCoordinate) {
    let message = {
        screen: "game",
        type: "letterSelection",
        uid: userSession.uid,
        gameId: userSession.gameId,
        letterCoordinate: [xCoordinate, yCoordinate]
    };
    connection.send(JSON.stringify(message));
}

function sendWordSelection(firstLetter, secondLetter) {
    let message = {
        screen: "game",
        type: "validateWord",
        uid: userSession.uid,
        gameId: userSession.gameId,
        firstCoordinate: [firstLetter.dataset.x, firstLetter.dataset.y],
        secondCoordinate: [secondLetter.dataset.x, secondLetter.dataset.y]
    };
    connection.send(JSON.stringify(message));
}

function updateLetterSelection(xCoordinate, yCoordinate, selections) {
    const gridItem = document.getElementById(`gridItem-${xCoordinate}-${yCoordinate}`);

    // Initialize box-shadow value to accumulate multiple shadows
    let boxShadowValue = '';
    const borderThickness = 2; // Set consistent border thickness

    // Iterate through selections and create a colored border for each
    selections.forEach((selection, index) => {
        const insetAmount = (index + 1) * borderThickness; // Calculate inset to grow inward
        boxShadowValue += `inset 0 0 0 ${insetAmount}px ${colorMap.get(selection.color)},`;
    });

    // Remove the trailing comma and apply the box-shadow to simulate inner borders
    boxShadowValue = boxShadowValue.slice(0, -1);
    gridItem.style.boxShadow = boxShadowValue;
}

function highlightWordOnGrid(firstLetter, secondLetter, playerColor) {
    let color = colorMap.get(playerColor);

    const startX = firstLetter.coordinate[0];
    const startY = firstLetter.coordinate[1];
    const endX = secondLetter.coordinate[0];
    const endY = secondLetter.coordinate[1];

    const stepX = startX === endX ? 0 : (endX > startX ? 1 : -1);
    const stepY = startY === endY ? 0 : (endY > startY ? 1 : -1);

    let x = startX;
    let y = startY;

    while (x !== endX + stepX || y !== endY + stepY) {
        const gridId = `gridItem-${x}-${y}`;
        const gridItem = document.getElementById(gridId);
        gridItem.style.backgroundColor = `${color}`;
        if (gridItem == hintGridItem) {
            stopBlinking();
        }
        x += stepX;
        y += stepY;
    }
}

function updateWordBank(updatedWordBank) {
    updatedWordBank = JSON.parse(updatedWordBank);
    Object.keys(updatedWordBank).forEach(word => {
        const wordElement = document.getElementById(word);
        if (updatedWordBank[word]) {
            wordElement.classList.add('strikeThrough');
        }
    });
}

function updateLeaderboard(updatedLeaderboard) {
    leaderboard.forEach(leaderboardList => {
        const leaderboardEntry = leaderboardList.querySelectorAll(".player");
        let numPlayers = updatedLeaderboard.length
        for (let i = 0; i < numPlayers; i++) {
            let playerObject = updatedLeaderboard[i];
            leaderboardEntry[i].id = `${playerObject.color}Player`;
            leaderboardEntry[i].querySelector(".username").textContent = playerObject.userName;
            leaderboardEntry[i].querySelector(".wordsFound").textContent = playerObject.currentScore;
        }
        for (let i = numPlayers; i < 4; i++) {
            leaderboardEntry[i].removeAttribute("id");
            leaderboardEntry[i].querySelector(".username").textContent = "";
            leaderboardEntry[i].querySelector(".wordsFound").textContent = "";
        }
    })
}

function giveHint(hint) {
    if (interval && hintGridItem) {
        stopBlinking();
    }

    const x = hint.coordinate[0];
    const y = hint.coordinate[1];

    const gridId = `gridItem-${x}-${y}`;
    hintGridItem = document.getElementById(gridId);

    let isHighlighted = false;


    // Function to toggle the highlight
    const toggleHighlight = () => {
        if (isHighlighted) {
            hintGridItem.classList.remove('hintHighlight');
        } else {
            hintGridItem.classList.add('hintHighlight');
        }
        isHighlighted = !isHighlighted;
    };

    // Start blinking every 250ms
    interval = setInterval(toggleHighlight, 250);
}

// Function to stop the blinking
function stopBlinking() {
    clearInterval(interval);
    hintGridItem.classList.remove('hintHighlight');  // Ensure the highlight is removed when stopping
    hintGridItem = null;
}

function resetGame() {
    clearGrid()
    clearWordBank();
    clearChatBox();
}

function endGame() {
    gamePage.classList.add("hidden");
    endGamePage.classList.remove("hidden");
    userSession.gameId = null;
    resetGame();
}

window.setUpGame = setUpGame;
window.updateLetterSelection = updateLetterSelection;
window.highlightWordOnGrid = highlightWordOnGrid;
window.updateWordBank = updateWordBank;
window.updateLeaderboard = updateLeaderboard;
window.updateChatBox = updateChatBox;
window.endGame = endGame;
window.resetGame = resetGame;
window.giveHint = giveHint;