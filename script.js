document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById('start-btn');
  const playBtn = document.getElementById('play-btn');
  const restartBtn = document.getElementById('restart-btn');

  const startScreen = document.getElementById('start-screen');
  const gameScreen = document.getElementById('game-screen');

  const player1Select = document.getElementById('player1');
  const player2Select = document.getElementById('player2');
  const resultDiv = document.getElementById('result');

  const roundNumber = document.getElementById('round-number');
  const score1Span = document.getElementById('score1');
  const score2Span = document.getElementById('score2');

  let round = 1;
  let score1 = 0;
  let score2 = 0;
  let objects = [];
  let usingFallback = false;

  const fallbackObjects = ["rock", "paper", "scissors", "fire", "water", "gun", "devil"];
  const fallbackResults = {
    rock: ["scissors", "fire", "devil"],
    paper: ["rock", "water", "gun"],
    scissors: ["paper", "devil", "fire"],
    fire: ["paper", "gun", "devil"],
    water: ["fire", "rock", "scissors"],
    gun: ["rock", "scissors", "paper"],
    devil: ["gun", "paper", "water"]
  };

  // Start game
  startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    loadObjects();
  });

  // Restart game
  restartBtn.addEventListener('click', () => {
    round = 1;
    score1 = 0;
    score2 = 0;
    updateUI();
    resultDiv.innerText = "";
    restartBtn.classList.add('hidden');
    playBtn.disabled = true;
    player1Select.selectedIndex = 0;
    player2Select.selectedIndex = 0;
  });

  // Load objects
  async function loadObjects() {
    try {
      const res = await fetch('https://rps101.pythonanywhere.com/api/v1/objects/all');
      const data = await res.json();
      if (data.objects && Array.isArray(data.objects)) {
        objects = data.objects;
        usingFallback = false;
        console.log('Objects loaded from API:', objects);
      } else {
        throw new Error('Invalid data structure');
      }
    } catch (err) {
      console.warn("API failed. Using fallback.");
      objects = fallbackObjects;
      usingFallback = true;
      resultDiv.innerText = "⚠️ API not available. Fallback mode activated.";
    }

    // Ensure that objects are loaded before calling populateSelect
    if (objects.length > 0) {
      populateSelect(player1Select);
      populateSelect(player2Select);
    } else {
      resultDiv.innerText = "⚠️ No objects to choose from.";
    }
  }

  // Populate the dropdown menu with objects
  function populateSelect(select) {
    if (!objects || objects.length === 0) {
      console.error("No objects to populate.");
      return;
    }

    select.innerHTML = '<option value="">Select</option>';
    objects.forEach(obj => {
      const option = document.createElement('option');
      option.value = obj;
      option.textContent = obj;
      select.appendChild(option);
    });
    console.log(`Dropdown populated for ${select.id}:`, select.innerHTML);
  }

  // Check if the play button should be enabled
  function checkIfPlayButtonShouldBeEnabled() {
    playBtn.disabled = !(player1Select.value && player2Select.value);
    console.log('Play button enabled:', !playBtn.disabled);
  }

  // Listen for changes in object selection
  player1Select.addEventListener('change', () => {
    checkIfPlayButtonShouldBeEnabled();
    console.log('Player 1 selected:', player1Select.value);
  });
  
  player2Select.addEventListener('change', () => {
    checkIfPlayButtonShouldBeEnabled();
    console.log('Player 2 selected:', player2Select.value);
  });

  // Play one round
  playBtn.addEventListener('click', async () => {
    const obj1 = player1Select.value;
    const obj2 = player2Select.value;

    if (usingFallback) {
      let message = `${obj1} vs ${obj2}\n`;
      let winner = null;

      if (obj1 === obj2) {
        message += "It's a Tie!";
      } else if (fallbackResults[obj1]?.includes(obj2)) {
        message += `${obj1} beats ${obj2}\nPlayer 1 wins!`;
        score1++;
        winner = obj1;
      } else if (fallbackResults[obj2]?.includes(obj1)) {
        message += `${obj2} beats ${obj1}\nPlayer 2 wins!`;
        score2++;
        winner = obj2;
      } else {
        message += "Result unknown in fallback.";
      }

      resultDiv.innerText = message;
    } else {
      try {
        const res = await fetch(`https://rps101.pythonanywhere.com/api/v1/match?object_one=${obj1}&object_two=${obj2}`);
        const data = await res.json();
        resultDiv.innerText = data.message;

        if (data.winner === obj1) score1++;
        else if (data.winner === obj2) score2++;
      } catch {
        resultDiv.innerText = `⚠️ Could not determine winner. Try again.`;
        return;
      }
    }

    round++;
    updateUI();

    if (round > 3) {
      playBtn.disabled = true;
      showFinalResult();
    }
  });

  // Update UI (scores and round)
  function updateUI() {
    roundNumber.innerText = round <= 3 ? round : 3;
    score1Span.innerText = score1;
    score2Span.innerText = score2;
  }

  // Show final result
  function showFinalResult() {
    if (score1 > score2) {
      resultDiv.innerText += `\n🏆 Player 1 Wins the Game!`;
    } else if (score2 > score1) {
      resultDiv.innerText += `\n🏆 Player 2 Wins the Game!`;
    } else {
      resultDiv.innerText += `\n🤝 It's a Tie!`;
    }
    restartBtn.classList.remove('hidden');
  }
});
