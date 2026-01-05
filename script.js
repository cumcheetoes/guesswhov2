const GAME_DATA = {
    categories: {
        "Brands": ["Apple", "Nike", "Coca-Cola", "McDonald's", "Tesla", "Google", "Amazon", "Disney", "Samsung", "Starbucks", "Gucci", "Adidas", "Microsoft", "Netflix", "Toyota"],
        "Movies & TV": ["Breaking Bad", "Stranger Things", "Game of Thrones", "The Office", "Friends", "Inception", "The Avengers", "Titanic", "The Dark Knight", "Avatar", "Spider-Man", "Star Wars", "Harry Potter", "The Matrix", "Pathan", "Interstellar"],
        "Footballers": ["Messi", "Ronaldo", "Neymar", "Mbappe", "Haaland", "Salah", "De Bruyne", "Kane", "Lewandowski", "Vinicius Jr", "Bellingham", "Modric", "Benzema", "Ramos", "Neuer"],
        "Musicians": ["Taylor Swift", "Drake", "The Weeknd", "Eminem", "Beyoncé", "Justin Bieber", "Ariana Grande", "Kanye West", "Post Malone", "Ed Sheeran", "Bruno Mars", "Billie Eilish", "Rihanna", "Adele", "Coldplay"]
    }
};

// --- Avatar Colors ---
const AVATAR_COLORS = [
    'linear-gradient(135deg, #8B5CF6, #EC4899)', // Purple
    'linear-gradient(135deg, #3B82F6, #10B981)', // Blue-Green
    'linear-gradient(135deg, #EF4444, #F59E0B)', // Red-Orange
    'linear-gradient(135deg, #EC4899, #8B5CF6)', // Pink-Purple
    'linear-gradient(135deg, #10B981, #3B82F6)', // Green-Blue
    'linear-gradient(135deg, #F59E0B, #EF4444)', // Orange-Red
    'linear-gradient(135deg, #6366F1, #8B5CF6)', // Indigo
    'linear-gradient(135deg, #14B8A6, #06B6D4)'  // Teal
];

// --- App State & Navigation ---
const app = {
    currentScreen: 'screen-home',
    theme: 'dark',

    init: () => {
        app.setupEventListeners();
        app.populateCategories();

        // Create Toast Container
        const toaster = document.createElement('div');
        toaster.id = 'toast-container';
        document.body.appendChild(toaster);

        // Check for room code in URL
        const params = new URLSearchParams(window.location.search);
        const input = document.getElementById('clue-input');
        if (input) {
            input.addEventListener('input', () => onlineGame.broadcastTyping(true));
            input.addEventListener('blur', () => onlineGame.broadcastTyping(false));
            // Optional: Debounce "stop typing" if needed, but blur/submit handles most cases.
        }

        const roomCode = params.get('room');
        if (roomCode) {
            document.getElementById('join-room-code').value = roomCode;
            app.navTo('screen-online-menu');

            // Smart Join: Hide Host options
            document.getElementById('menu-host-card').style.display = 'none';
            document.getElementById('menu-divider').style.display = 'none';
        } else {
            app.navTo('screen-home');
        }
    },

    setupEventListeners: () => {
        // Theme Toggle Removed
    },

    navTo: (screenId) => {
        const target = document.getElementById(screenId);

        // Hide all screens EXCEPT the target
        document.querySelectorAll('.screen').forEach(el => {
            if (el === target) return;

            el.classList.remove('active');
            el.classList.add('hidden');
            setTimeout(() => {
                if (el !== target && !el.classList.contains('active')) {
                    el.style.display = 'none';
                }
            }, 400);
        });

        // Show target screen
        if (target) {
            target.style.display = 'flex';
            // Small delay to allow display change to register before transition
            requestAnimationFrame(() => {
                target.classList.remove('hidden');
                target.classList.add('active');
            });
            app.currentScreen = screenId;
        }
    },

    populateCategories: () => {
        // Local Game (Select Dropdown)
        const localSelect = document.getElementById('local-category-select');
        if (localSelect) {
            const options = Object.keys(GAME_DATA.categories).map(cat => `<option value="${cat}">${cat}</option>`).join('');
            localSelect.innerHTML = options;
        }

        // Online Game (Cards Grid)
        const onlineGrid = document.getElementById('online-category-grid');
        if (onlineGrid) {
            const icons = {
                "Brands": "🏷️",
                "Movies & TV": "🎬",
                "Footballers": "⚽",
                "Musicians": "🎵"
            };

            // Sort keys to maintain order if needed, or just use Object.keys
            const categories = Object.keys(GAME_DATA.categories);

            onlineGrid.innerHTML = categories.map(cat => `
                <div class="category-card ${cat === 'Brands' ? 'selected' : ''}" onclick="app.selectOnlineCategory('${cat}', this)">
                    <div class="cat-icon">${icons[cat] || '📁'}</div>
                    <div class="cat-name">${cat}</div>
                </div>
            `).join('');

            // Ensure hidden input has default
            const hiddenInput = document.getElementById('online-category-select');
            if (hiddenInput) hiddenInput.value = 'Brands';
        }
    },

    selectOnlineCategory: (cat, cardElement) => {
        // Update hidden value for game start logic
        document.getElementById('online-category-select').value = cat;

        // Visual feedback
        document.querySelectorAll('.category-card').forEach(el => el.classList.remove('selected'));
        cardElement.classList.add('selected');
    },

    showToast: (msg, type = 'success') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = '✓';
        if (type === 'error') icon = '!';

        toast.innerHTML = `<span class="toast-icon">${icon}</span> ${msg}`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    copyCode: () => {
        const code = document.getElementById('lobby-room-code').innerText;
        navigator.clipboard.writeText(code).then(() => app.showToast('Code Copied!'));
    },

    // Fisher-Yates Shuffle
    shuffleArray: (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};

// --- Local Game Logic ---
const localGame = {
    players: [],
    currentPlayerIndex: 0,
    currentWord: '',
    imposterIndex: -1,

    addPlayerInput: () => {
        const list = document.getElementById('local-player-list');
        const count = list.children.length + 1;
        const div = document.createElement('div');
        div.className = 'player-input-row';
        div.innerHTML = `<input type="text" placeholder="Player ${count} Name" class="player-name-input" value="Player ${count}">`;
        list.appendChild(div);
    },

    startGame: () => {
        const inputs = document.querySelectorAll('#local-player-list input');
        localGame.players = Array.from(inputs).map(input => input.value.trim()).filter(name => name !== "");

        if (localGame.players.length < 3) {
            alert("Need at least 3 players!");
            return;
        }

        const category = document.getElementById('local-category-select').value;
        const words = GAME_DATA.categories[category];

        // Crypto Random for Word
        const wordBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(wordBuffer);
        localGame.currentWord = words[wordBuffer[0] % words.length];

        // Crypto Random for Imposter
        const imposterBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(imposterBuffer);
        localGame.imposterIndex = imposterBuffer[0] % localGame.players.length;

        localGame.currentPlayerIndex = 0;

        app.navTo('screen-pass-reveal');
        localGame.updateRevealScreen();
    },

    updateRevealScreen: () => {
        if (localGame.currentPlayerIndex >= localGame.players.length) {
            app.navTo('screen-local-game');
            localGame.setupRevealButton();
            return;
        }

        const name = localGame.players[localGame.currentPlayerIndex];

        // Determine next player name safely
        let nextName = "everyone";
        if (localGame.currentPlayerIndex + 1 < localGame.players.length) {
            nextName = localGame.players[localGame.currentPlayerIndex + 1];
        }

        // Standardized logic for everyone
        headerText = `${name}`;

        if (localGame.currentPlayerIndex + 1 < localGame.players.length) {
            instructionText = `Pass device to ${nextName}`;
        } else {
            instructionText = "Pass the device to the Host";
        }

        document.getElementById('pp-player-name').innerText = headerText;
        document.getElementById('pp-next-player-name').innerHTML = `<span class="gradient-text">${instructionText}</span>`;

        // Reset card state STRICTLY
        const card = document.getElementById('pp-card');
        card.classList.remove('revealed');

        // Clear content initially so no peeking during transition
        const roleContent = document.getElementById('pp-role-content');
        roleContent.innerHTML = "";

        // Update content after flip-back is largely done
        setTimeout(() => {
            const isImposter = localGame.currentPlayerIndex === localGame.imposterIndex;
            if (isImposter) {
                roleContent.innerHTML = `<h2 style="color: #ef4444; margin-bottom: 20px;">YOU ARE THE IMPOSTER</h2><p style="font-size: 1.2rem;">Blend in.</p>`;
            } else {
                roleContent.innerHTML = `<h2>The Word is:</h2><h1 class="highlight" style="font-size: 3rem; margin: 20px 0;">${localGame.currentWord}</h1>`;
            }
        }, 300);
    },

    revealRole: () => {
        const card = document.getElementById('pp-card');
        if (!card.classList.contains('revealed')) {
            card.classList.add('revealed');
            // Update header to show the current player's name
            const name = localGame.players[localGame.currentPlayerIndex];
            document.getElementById('pp-player-name').innerText = name;

            // Show next pass instruction
            let nextText = "Prepare to start";
            if (localGame.currentPlayerIndex + 1 < localGame.players.length) {
                const nextPlayer = localGame.players[localGame.currentPlayerIndex + 1];
                nextText = `Pass device to ${nextPlayer}`;
            }
            document.getElementById('pp-next-player-name').innerHTML = `<span class="gradient-text">${nextText}</span>`;
        }
    },

    hideRole: (e) => {
        e.stopPropagation();
        const card = document.getElementById('pp-card');
        card.classList.remove('revealed');

        // Wait for flip to finish before changing player
        setTimeout(() => {
            localGame.currentPlayerIndex++;
            localGame.updateRevealScreen();
        }, 600);
    },

    setupRevealButton: () => {
        const card = document.getElementById('reveal-card');
        const resultDiv = document.getElementById('local-end-result');
        const imposterName = localGame.players[localGame.imposterIndex];

        card.classList.remove('revealed');
        card.onclick = () => {
            card.classList.toggle('revealed');
            if (card.classList.contains('revealed')) {
                // Trigger Confetti
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        };

        resultDiv.innerHTML = `
            <h3>The Imposter was:</h3>
            <h1 class="highlight" style="font-size: 2.5rem; margin: 10px 0; color: var(--danger);">${imposterName}</h1>
            <p style="color: var(--text-muted)">The word was: <b>${localGame.currentWord}</b></p>
        `;
    }
};

// --- Online Game Logic ---
const onlineGame = {
    peer: null,
    conn: null,
    connections: [],
    isHost: false,
    myId: null,
    hostId: null,
    players: [],

    // Game State
    myRole: null,
    clues: [],
    votes: {},
    totalVotes: 0,
    currentWord: '',
    imposterId: null,
    readyCount: 0,
    turnIndex: 0,
    roundNumber: 1,
    decisionVotes: { AGAIN: 0, VOTE: 0 },
    decisionChoices: {}, // { playerId: 'AGAIN' }
    decisionCount: 0,

    // --- HOST FUNCTIONS ---
    initHost: (isRetry = false) => {
        const name = document.getElementById('online-player-name').value.trim();
        if (!name) return alert("Please enter your name!");

        if (typeof Peer === 'undefined') {
            return alert("Network library (PeerJS) failed to load. Please check your internet connection and reload.");
        }

        // Cleanup existing peer if any
        if (onlineGame.peer) {
            onlineGame.peer.destroy();
            onlineGame.peer = null;
        }

        app.navTo('screen-online-lobby');
        onlineGame.isHost = true;
        onlineGame.isHost = true;
        onlineGame.players = [];
        onlineGame.connections = [];
        onlineGame.connections = [];

        // Safer 5-letter code generation
        let code = "";
        while (code.length < 5) {
            code = Math.random().toString(36).substring(2, 7).toUpperCase();
            if (code.length < 5) code = ""; // Retry if too short
        }

        try {
            if (!isRetry) onlineGame.retryCount = 0; // Only reset on fresh start
            onlineGame.peer = new Peer(code, {
                debug: 1,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' },
                        { urls: 'stun:stun2.l.google.com:19302' },
                        { urls: 'stun:stun3.l.google.com:19302' },
                        { urls: 'stun:stun4.l.google.com:19302' }
                    ]
                }
            });
        } catch (e) {
            console.error("Peer init failed:", e);
            alert("Failed to initialize game network. Please reload.");
            return;
        }

        // Initial UI State
        document.getElementById('lobby-room-code').innerText = "Connecting...";

        // Clear any old timeout from previous attempts
        if (onlineGame.connTimeout) clearTimeout(onlineGame.connTimeout);

        onlineGame.connTimeout = setTimeout(() => {
            if (onlineGame.peer && !onlineGame.peer.id) {
                onlineGame.peer.destroy();
                onlineGame.peer = null;
                alert("Connection timed out (Check Firewall/Internet).");
                app.navTo('screen-online-menu');
            }
        }, 15000); // 15s timeout

        onlineGame.peer.on('open', (id) => {
            if (onlineGame.connTimeout) clearTimeout(onlineGame.connTimeout);
            onlineGame.myId = id;
            document.getElementById('lobby-room-code').innerText = id;
            document.getElementById('host-controls').classList.remove('hidden');
            document.getElementById('client-waiting-msg').classList.add('hidden');

            // Assign color 0 to host
            onlineGame.players.push({
                id: id,
                name: name,
                isHost: true,
                color: AVATAR_COLORS[0]
            });
            onlineGame.updateLobbyUI();
        });

        onlineGame.peer.on('error', (err) => {
            console.error("Peer Error:", err);
            if (onlineGame.connTimeout) clearTimeout(onlineGame.connTimeout); // Clear timeout on error

            if (err.type === 'unavailable-id') {
                console.log("Collision detected, retrying...");
                onlineGame.initHost();
            } else if (err.type === 'network' || err.type === 'peer-unavailable') {
                // Auto-Retry logic
                onlineGame.retryCount = (onlineGame.retryCount || 0) + 1;
                if (onlineGame.retryCount <= 3) {
                    console.log(`Network error. Retrying (${onlineGame.retryCount}/3)...`);
                    document.getElementById('lobby-room-code').innerText = `Retrying (${onlineGame.retryCount})...`;
                    setTimeout(() => onlineGame.initHost(true), 2000);
                } else {
                    alert("Connection Failed: Unable to reach game server after multiple attempts.");
                    app.navTo('screen-online-menu');
                }
            } else {
                alert("Connection Error (" + err.type + "). Please try again.");
                app.navTo('screen-online-menu');
            }
        });

        onlineGame.peer.on('connection', (conn) => {
            onlineGame.connections.push(conn);

            conn.on('data', (data) => {
                onlineGame.handleHostData(data, conn);
            });

            conn.on('close', () => {
                onlineGame.connections = onlineGame.connections.filter(c => c.peer !== conn.peer);
                onlineGame.players = onlineGame.players.filter(p => p.id !== conn.peer);
                onlineGame.broadcast({ type: 'LOBBY_UPDATE', players: onlineGame.players });
                onlineGame.updateLobbyUI();
            });
        });
    },

    copyLink: () => {
        const code = onlineGame.myId;
        const url = `${window.location.href.split('?')[0]}?room=${code}`;
        navigator.clipboard.writeText(url).then(() => app.showToast('Link Copied! Share with friends.'));
    },

    handleHostData: (data, conn) => {
        console.log("Host received data:", data);
        if (data.type === 'JOIN') {
            const playerId = data.id || conn.peer;
            console.log("Player joining:", data.name, playerId);

            // Check if already in
            if (onlineGame.players.find(p => p.id === playerId)) return;

            // Assign unique color
            const colorIndex = onlineGame.players.length % AVATAR_COLORS.length;
            onlineGame.players.push({
                id: playerId,
                name: data.name,
                isHost: false,
                color: AVATAR_COLORS[colorIndex]
            });
            onlineGame.broadcast({ type: 'LOBBY_UPDATE', players: onlineGame.players });
        } else if (data.type === 'PLAYER_READY') {
            onlineGame.readyCount++;
            if (onlineGame.readyCount >= onlineGame.players.length) {
                onlineGame.broadcast({ type: 'START_CLUES' }); // Optional, mostly just triggers turn 0
                onlineGame.startCluePhase();
            }
        } else if (data.type === 'SUBMIT_CLUE') {
            onlineGame.clues.push({ name: data.name, text: data.text });
            onlineGame.broadcast({ type: 'CLUE_POSTED', clues: onlineGame.clues });

            onlineGame.turnIndex++;
            onlineGame.nextTurn();
        } else if (data.type === 'SUBMIT_VOTE') {
            const targetId = data.targetId;
            onlineGame.votes[targetId] = (onlineGame.votes[targetId] || 0) + 1;
            onlineGame.totalVotes++;

            if (onlineGame.totalVotes >= onlineGame.players.length) {
                onlineGame.calcResults();
            }
        } else if (data.type === 'SUBMIT_DECISION') {
            onlineGame.handleDecisionVote(conn.peer, data.choice);
        } else if (data.type === 'TYPING_STATUS') {
            onlineGame.broadcast(data); // Re-broadcast to all
            onlineGame.handleTypingStatus(data);
        }
    },

    broadcast: (payload) => {
        if (payload.type === 'LOBBY_UPDATE') onlineGame.updateLobbyUI();
        if (payload.type === 'CLUE_POSTED') onlineGame.updateClueBoard(payload.clues);
        if (payload.type === 'TURN_UPDATE') onlineGame.handleTurnUpdate(payload);
        if (payload.type === 'START_DECISION') onlineGame.showDecisionScreen();
        if (payload.type === 'DECISION_UPDATE') onlineGame.handleDecisionUpdate(payload.choices);
        if (payload.type === 'START_VOTING') onlineGame.showVotingScreen(onlineGame.players); // Local host logic
        if (payload.type === 'TYPING_STATUS') onlineGame.handleTypingStatus(payload);
        if (payload.type === 'NEW_ROUND_START') onlineGame.handleNewRound(payload.round);

        onlineGame.connections.forEach(conn => conn.send(payload));
    },

    updateLobbyUI: () => {
        const list = document.getElementById('lobby-player-list');
        list.innerHTML = onlineGame.players.map(p => `
            <div class="player-card ${p.isHost ? 'host' : ''}">
                <div class="avatar" style="background: ${p.color || 'var(--primary)'}">${p.name[0].toUpperCase()}</div>
                <div class="name">${p.name} ${p.isHost ? '(Host)' : ''}</div>
            </div>
        `).join('');
    },

    startOnlineGame: () => {
        if (onlineGame.players.length < 3) {
            alert("Need at least 3 players!");
            return;
        }

        const category = document.getElementById('online-category-select').value;
        const words = GAME_DATA.categories[category];
        onlineGame.currentWord = words[Math.floor(Math.random() * words.length)];
        const imposterIndex = Math.floor(Math.random() * onlineGame.players.length);
        onlineGame.imposterId = onlineGame.players[imposterIndex].id;

        // Reset game state
        onlineGame.clues = [];
        onlineGame.votes = {};
        onlineGame.totalVotes = 0;
        onlineGame.readyCount = 0;
        onlineGame.decisionVotes = { AGAIN: 0, VOTE: 0 };
        onlineGame.decisionChoices = {};
        onlineGame.decisionCount = 0;
        onlineGame.decisionCount = 0;
        onlineGame.turnIndex = 0;
        onlineGame.roundNumber = 1;

        // Shuffle players for turn order
        onlineGame.turnOrder = app.shuffleArray([...onlineGame.players]);

        onlineGame.players.forEach((p, index) => {
            const isImposter = index === imposterIndex;
            const payload = {
                type: 'GAME_START',
                word: isImposter ? null : onlineGame.currentWord,
                imposter: isImposter
            };

            if (p.isHost) {
                onlineGame.handleGameStart(payload);
            } else {
                const conn = onlineGame.connections.find(c => c.peer === p.id);
                if (conn) conn.send(payload);
            }
        });
    },

    nextRound: () => {
        // Same as startOnlineGame but keeps connections
        onlineGame.startOnlineGame();
    },

    startVoting: () => {
        onlineGame.votes = {};
        onlineGame.totalVotes = 0;
        onlineGame.broadcast({ type: 'START_VOTING', players: onlineGame.players });
        onlineGame.showVotingScreen(onlineGame.players);

        // Host Authoritative Timer (70s)
        setTimeout(() => {
            // Check if phase is still voting (rudimentary check: did we move on?)
            // Ideally we check a state flag, but checking totalVotes is a proxy here.
            // If everyone voted, we would have moved. 
            // If NOT everyone voted, force end.

            if (app.currentScreen === 'screen-online-voting' && onlineGame.isHost) {
                if (onlineGame.totalVotes === 0) {
                    // No votes -> Continue Round
                    app.showToast("Time's up! No votes cast. Continuing...");
                    onlineGame.continueRound();
                } else {
                    // Force results with current votes
                    onlineGame.calcResults();
                }
            }
        }, 70000);
    },

    startDecisionPhase: () => {
        onlineGame.decisionVotes = { AGAIN: 0, VOTE: 0 };
        onlineGame.decisionChoices = {};
        onlineGame.decisionCount = 0;
        onlineGame.broadcast({ type: 'START_DECISION' });
        onlineGame.showDecisionScreen();
    },

    handleDecisionVote: (id, choice) => {
        onlineGame.decisionVotes[choice] = (onlineGame.decisionVotes[choice] || 0) + 1;
        onlineGame.decisionChoices[id] = choice;
        onlineGame.decisionCount++;

        // Broadcast progress
        onlineGame.broadcast({ type: 'DECISION_UPDATE', choices: onlineGame.decisionChoices });
        onlineGame.handleDecisionUpdate(onlineGame.decisionChoices);

        if (onlineGame.decisionCount >= onlineGame.players.length) {
            // Decision made
            if (onlineGame.decisionVotes['AGAIN'] > onlineGame.decisionVotes['VOTE']) {
                // Formatting: Wait a sec then go
                setTimeout(() => onlineGame.continueRound(), 1500);
            } else {
                setTimeout(() => onlineGame.startVoting(), 1500);
            }
        }
    },

    continueRound: () => {
        onlineGame.roundNumber++;
        // Reset needed vars for next round of clues
        onlineGame.turnIndex = 0;
        onlineGame.clues = []; // Clear clues completely

        // Broadcast new round info
        onlineGame.broadcast({
            type: 'NEW_ROUND_START',
            round: onlineGame.roundNumber
        });
        onlineGame.broadcast({ type: 'CLUE_POSTED', clues: onlineGame.clues }); // Sync empty board
        onlineGame.nextTurn();
    },

    // --- CLIENT FUNCTIONS ---
    joinGame: () => {
        const name = document.getElementById('online-player-name').value.trim();
        const code = document.getElementById('join-room-code').value.trim().toUpperCase();

        if (!name) return alert("Please enter your name!");
        if (!code) return alert("Please enter a room code!");
        if (code.length !== 5) return alert("Invalid Room Code! It must be 5 characters.");

        app.navTo('screen-online-lobby');
        onlineGame.isHost = false;

        // Reset UI for client joining
        document.getElementById('host-controls').classList.add('hidden');
        document.getElementById('client-waiting-msg').classList.remove('hidden');
        document.getElementById('client-waiting-msg').innerText = "Connecting to room...";

        onlineGame.players = [];

        // Initialize Peer with proper ICE server configuration for better cross-network connectivity
        onlineGame.peer = new Peer({
            debug: 1,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' }
                ]
            }
        });

        onlineGame.peer.on('open', (id) => {
            onlineGame.myId = id;
            onlineGame.conn = onlineGame.peer.connect(code);

            // Connection Timeout Logic - increased to 10 seconds for better cross-network compatibility
            const connTimeout = setTimeout(() => {
                if (!onlineGame.conn || !onlineGame.conn.open) {
                    alert("Room not found or host is offline.");
                    app.navTo('screen-online-menu');
                    if (onlineGame.peer) onlineGame.peer.destroy();
                }
            }, 10000);

            // Handle errors on the PEER object (connection failure)
            // Handle errors on the PEER object (connection failure)
            onlineGame.peer.on('error', (err) => {
                clearTimeout(connTimeout);
                console.error(err);
                if (err.type === 'peer-unavailable') {
                    app.showToast("Lobby not found! Check the room code.", 'error');
                } else {
                    app.showToast("Connection Error: " + err.type, 'error');
                }
                app.navTo('screen-online-menu');
                if (onlineGame.peer) onlineGame.peer.destroy();
            });

            onlineGame.conn.on('open', () => {
                clearTimeout(connTimeout);
                console.log("Connected to host. Sending JOIN...");
                document.getElementById('client-waiting-msg').innerText = "Waiting for host to start...";
                document.getElementById('lobby-room-code').innerText = code;
                onlineGame.conn.send({ type: 'JOIN', name: name, id: onlineGame.myId });
            });

            onlineGame.conn.on('data', (data) => {
                onlineGame.handleClientData(data);
            });

            onlineGame.conn.on('error', (err) => {
                clearTimeout(connTimeout);
                alert("Connection Error. Check code and try again.");
                app.navTo('screen-online-menu');
            });
        });
    },

    handleClientData: (data) => {
        switch (data.type) {
            case 'LOBBY_UPDATE':
                onlineGame.players = data.players;
                onlineGame.updateLobbyUI();
                break;
            case 'NEW_ROUND_START':
                onlineGame.handleNewRound(data.round);
                break;
            case 'GAME_START':
                onlineGame.handleGameStart(data);
                break;
            case 'START_CLUES':
                // Do nothing, wait for TURN_UPDATE
                break;
            case 'TURN_UPDATE':
                onlineGame.handleTurnUpdate(data);
                break;
            case 'CLUE_POSTED':
                onlineGame.updateClueBoard(data.clues);
                break;
            case 'TYPING_STATUS':
                onlineGame.handleTypingStatus(data);
                break;
            case 'START_VOTING':
                onlineGame.showVotingScreen(data.players);
                break;
            case 'START_DECISION':
                onlineGame.showDecisionScreen();
                break;
            case 'DECISION_UPDATE':
                onlineGame.handleDecisionUpdate(data.choices);
                break;
            case 'SHOW_RESULT':
                onlineGame.showResultScreen(data);
                break;
        }
    },

    // --- SHARED UI LOGIC ---
    handleGameStart: (data) => {
        app.navTo('screen-online-reveal');
        document.getElementById('btn-ready').classList.remove('hidden');
        document.getElementById('btn-ready').disabled = false;
        document.getElementById('local-waiting-msg').classList.add('hidden');

        const content = document.getElementById('online-role-content');
        content.innerHTML = ""; // Clear peeking

        // Fix: Reset Card State & Clear Board for new game
        document.getElementById('online-role-card').classList.remove('revealed');
        document.getElementById('clue-list').innerHTML = "";
        document.getElementById('round-indicator').innerText = "Round 1 ";
        onlineGame.roundNumber = 1;

        setTimeout(() => {
            if (data.imposter) {
                content.innerHTML = `<h2 style="color: var(--danger); margin-bottom: 20px;">YOU ARE THE IMPOSTER</h2><p>Blend in.</p>`;
            } else {
                content.innerHTML = `<h2>The Word is:</h2><h1 class="highlight" style="font-size: 2.5rem;">${data.word}</h1>`;
            }
        }, 300);
    },

    revealRole: () => {
        document.getElementById('online-role-card').classList.add('revealed');
    },

    playerReady: (e) => {
        e.stopPropagation();
        document.getElementById('btn-ready').classList.add('hidden');
        document.getElementById('local-waiting-msg').classList.remove('hidden');

        if (onlineGame.isHost) {
            onlineGame.readyCount++;
            if (onlineGame.readyCount >= onlineGame.players.length) {
                onlineGame.startCluePhase();
            }
        } else {
            onlineGame.conn.send({ type: 'PLAYER_READY' });
        }
    },

    startCluePhase: () => {
        // Host function to init Phase
        onlineGame.turnIndex = 0;
        onlineGame.clues = [];
        onlineGame.nextTurn();
    },

    nextTurn: () => {
        if (onlineGame.turnIndex >= onlineGame.turnOrder.length) {
            // All turns done. Broadcast finished state and wait for Host to click Continue.
            const payload = { type: 'TURN_UPDATE', finished: true };
            onlineGame.broadcast(payload);
            onlineGame.handleTurnUpdate(payload);
            return;
        }

        const currentPlayer = onlineGame.turnOrder[onlineGame.turnIndex];
        const payload = {
            type: 'TURN_UPDATE',
            playerId: currentPlayer.id,
            playerName: currentPlayer.name,
            finished: false
        };

        onlineGame.broadcast(payload);
        onlineGame.handleTurnUpdate(payload); // Host UI update
    },

    handleTurnUpdate: (data) => {
        app.navTo('screen-online-board');

        const inputDiv = document.getElementById('online-turn-input');
        const statusMsg = document.getElementById('board-status-msg');
        const hostControls = document.getElementById('host-board-controls');

        inputDiv.classList.add('hidden');
        hostControls.classList.add('hidden');

        if (data.finished) {
            statusMsg.innerText = "All clues submitted. Waiting for Host...";
            if (onlineGame.isHost) {
                hostControls.classList.remove('hidden');
            }
        } else {
            if (data.playerId === onlineGame.myId) {
                statusMsg.innerText = "It's your turn!";
                inputDiv.classList.remove('hidden');
                inputDiv.style.display = 'flex'; // Ensure flex for row layout

                // Update my avatar
                const me = onlineGame.players.find(p => p.id === onlineGame.myId);
                const myAvatar = document.getElementById('my-turn-avatar');
                if (me) {
                    myAvatar.innerText = me.name[0].toUpperCase();
                    myAvatar.style.background = me.color || 'var(--primary)';
                }

                document.getElementById('clue-input').value = "";
                document.getElementById('clue-input').focus();
            } else {
                statusMsg.innerText = `Waiting for ${data.playerName} to type...`;
            }
        }
    },

    updateClueBoard: (clues) => {
        const list = document.getElementById('clue-list');
        list.innerHTML = clues.map(c => {
            const player = onlineGame.players.find(p => p.name === c.name); // Match by name (imperfect but works here)
            const color = player ? player.color : 'var(--primary)';
            return `
        <div class="clue-card">
                <div class="clue-avatar" style="background: ${color}">${c.name[0].toUpperCase()}</div>
                <div class="clue-content">
                    <div class="clue-author">${c.name}</div>
                    <div class="clue-text">${c.text}</div>
                </div>
            </div>
    `}).join('');
    },

    handleTypingStatus: (data) => {
        const indicator = document.getElementById('typing-indicator');
        if (data.isTyping && data.playerId !== onlineGame.myId) {
            indicator.innerText = `${data.playerName} is typing...`;
            indicator.classList.remove('hidden');
        } else {
            indicator.classList.add('hidden');
        }
    },

    broadcastTyping: (isTyping) => {
        const myName = onlineGame.players.find(p => p.id === onlineGame.myId)?.name || "Unknown";
        const payload = {
            type: 'TYPING_STATUS',
            isTyping: isTyping,
            playerId: onlineGame.myId,
            playerName: myName
        };

        if (onlineGame.isHost) {
            onlineGame.handleTypingStatus(payload); // Show locally (optional, usually self doesn't see indicator)
            onlineGame.broadcast(payload);
        } else {
            onlineGame.conn.send(payload);
        }
    },

    submitClue: () => {
        onlineGame.broadcastTyping(false); // Stop typing on submit
        const text = document.getElementById('clue-input').value.trim();
        if (!text) return;

        // Hide input immediately to prevent double submit
        document.getElementById('online-turn-input').classList.add('hidden');

        const myName = onlineGame.players.find(p => p.id === onlineGame.myId)?.name || "Me";
        const payload = { type: 'SUBMIT_CLUE', name: myName, text: text };

        if (onlineGame.isHost) {
            onlineGame.clues.push({ name: myName, text: text });
            onlineGame.broadcast({ type: 'CLUE_POSTED', clues: onlineGame.clues });
            onlineGame.turnIndex++;
            onlineGame.nextTurn();
        } else {
            onlineGame.conn.send(payload);
        }
    },

    showVotingScreen: (players) => {
        app.navTo('screen-online-voting');
        const grid = document.getElementById('vote-grid');
        const timerEl = document.getElementById('voting-timer');
        timerEl.innerText = "70s";
        timerEl.style.color = "var(--warning)";

        // Client-side visual timer
        let timeLeft = 70;
        const interval = setInterval(() => {
            if (app.currentScreen !== 'screen-online-voting') {
                clearInterval(interval);
                return;
            }
            timeLeft--;
            timerEl.innerText = `${timeLeft} s`;
            if (timeLeft <= 10) timerEl.style.color = "var(--danger)";
            if (timeLeft <= 0) clearInterval(interval);
        }, 1000);


        grid.innerHTML = players.map(p => {
            const isMe = p.id === onlineGame.myId;
            return `
    <button class="vote-btn" onclick="onlineGame.submitVote('${p.id}', this)" ${isMe ? 'disabled' : ''}>
                <div class="avatar" style="background: ${p.color || 'var(--primary)'}">${p.name[0].toUpperCase()}</div>
                <div class="name">${p.name} ${isMe ? '(You)' : ''}</div>
            </button>
    `;
        }).join('');
    },

    submitVote: (targetId, btn) => {
        document.querySelectorAll('.vote-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        document.querySelectorAll('.vote-btn').forEach(b => b.disabled = true);

        const payload = { type: 'SUBMIT_VOTE', targetId: targetId };
        if (onlineGame.isHost) {
            onlineGame.votes[targetId] = (onlineGame.votes[targetId] || 0) + 1;
            onlineGame.totalVotes++;
            if (onlineGame.totalVotes >= onlineGame.players.length) {
                onlineGame.calcResults();
            }
        } else {
            onlineGame.conn.send(payload);
        }
    },

    startDecisionPhase: () => {
        onlineGame.decisionChoices = {}; // Initialize decision choices
        onlineGame.broadcast({ type: 'START_DECISION' });
        onlineGame.showDecisionScreen();
    },

    showDecisionScreen: () => {
        app.navTo('screen-round-decision');
        document.getElementById('decision-status').innerText = "Waiting for players...";
        document.getElementById('voters-again').innerHTML = "";
        document.getElementById('voters-vote').innerHTML = "";

        // Reset cards state
        const cards = document.querySelectorAll('#screen-round-decision .mode-card');
        cards.forEach(c => {
            c.style.opacity = '1';
            c.style.pointerEvents = 'auto';
            c.style.borderColor = 'var(--glass-border)';
        });
    },

    handleDecisionUpdate: (choicesMap) => {
        // Render avatars
        const againContainer = document.getElementById('voters-again');
        const voteContainer = document.getElementById('voters-vote');

        // Clear first to rebuild (simple)
        againContainer.innerHTML = "";
        voteContainer.innerHTML = "";

        Object.entries(choicesMap).forEach(([id, choice]) => {
            const player = onlineGame.players.find(p => p.id === id);
            if (!player) return;

            const avatar = document.createElement('div');
            avatar.className = 'mini-avatar';
            avatar.innerText = player.name[0].toUpperCase();
            avatar.style.background = player.color || 'var(--primary)'; // Unique color
            avatar.title = player.name; // Tooltip

            if (choice === 'AGAIN') againContainer.appendChild(avatar);
            else if (choice === 'VOTE') voteContainer.appendChild(avatar);
        });

        const currentCount = Object.keys(choicesMap).length;
        const total = onlineGame.players.length;

        if (currentCount >= total) {
            document.getElementById('decision-status').innerText = "Decision Reached! Proceeding...";
        } else {
            document.getElementById('decision-status').innerText = `Waiting for players... (${currentCount}/${total})`;
        }
    },

    handleNewRound: (roundNum) => {
        onlineGame.roundNumber = roundNum;
        onlineGame.clues = [];
        document.getElementById('round-indicator').innerText = `Round ${roundNum} `;
        document.getElementById('clue-list').innerHTML = "";
        app.showToast(`Starting Round ${roundNum} `);
    },

    submitDecision: (choice) => {
        // Visual feedback
        const cards = document.querySelectorAll('#screen-round-decision .mode-card');
        cards.forEach(c => {
            c.style.pointerEvents = 'none';
            // Simple check: check if the 'onclick' attribute string contains the choice
            const onClickAttr = c.getAttribute('onclick');
            if (onClickAttr && !onClickAttr.includes(choice)) {
                c.style.opacity = '0.5';
            } else {
                c.style.borderColor = 'var(--primary)';
            }
        });
        document.getElementById('decision-status').innerText = "Waiting for others...";

        const payload = { type: 'SUBMIT_DECISION', choice: choice };
        if (onlineGame.isHost) {
            onlineGame.handleDecisionVote(onlineGame.myId, choice);
        } else {
            onlineGame.conn.send(payload);
        }
    },

    showResultScreen: (data) => {
        app.navTo('screen-online-result');

        // CONFETTI!
        // Burst 1
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#8b5cf6', '#ec4899', '#ffffff'] });
        // Burst 2 (delayed)
        setTimeout(() => confetti({ particleCount: 100, spread: 100, origin: { y: 0.7 }, colors: ['#06b6d4', '#10b981'] }), 400);

        const header = document.getElementById('result-header');
        const msg = document.getElementById('result-msg');
        const avatarContainer = document.getElementById('result-avatar-container');
        const wordEl = document.getElementById('result-word');

        // Render Avatar
        const initial = data.imposterName ? data.imposterName[0].toUpperCase() : '?';
        const color = data.imposterColor || 'var(--primary)';

        avatarContainer.innerHTML = `
    <div class="result-avatar" style="background: ${color}">
        ${initial}
            </div>
    `;

        // Update Text
        if (data.imposterFound) {
            header.innerHTML = `<span style="color: var(--success)">Crew Wins!</span>`;
            msg.innerHTML = `You discovered the Imposter: <span class="highlight-name">${data.imposterName}</span>`;
        } else {
            header.innerHTML = `<span style="color: var(--danger)">Imposter Wins!</span>`;
            msg.innerHTML = `The Imposter stayed hidden! It was: <span class="highlight-name">${data.imposterName}</span>`;
        }

        wordEl.innerText = data.word; // clean text

        // Host Controls
        const playAgainBtn = document.getElementById('btn-play-again');
        if (onlineGame.isHost) {
            playAgainBtn.classList.remove('hidden');
        } else {
            playAgainBtn.classList.add('hidden');
        }
    },

    calcResults: () => {
        // Find most voted
        let maxVotes = 0;
        let votedId = null;
        for (const [id, count] of Object.entries(onlineGame.votes)) {
            if (count > maxVotes) {
                maxVotes = count;
                votedId = id;
            }
        }

        const imposterFound = (votedId === onlineGame.imposterId);
        const imposter = onlineGame.players.find(p => p.id === onlineGame.imposterId);
        const imposterName = imposter?.name || "Unknown";
        const imposterColor = imposter?.color || "var(--primary)";

        const resultData = {
            imposterFound: imposterFound,
            imposterName: imposterName,
            imposterColor: imposterColor,
            word: onlineGame.currentWord
        };

        onlineGame.broadcast({ type: 'SHOW_RESULT', ...resultData });
        onlineGame.showResultScreen(resultData);
    }
};

window.addEventListener('DOMContentLoaded', app.init);
