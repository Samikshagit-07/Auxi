const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const YouTube = require('youtube-sr').default;
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function generateTrivia(song) {
  if (!song) return null;
  const artist = song.artist || 'this artist';
  const questions = [
    {
      question: `Which hit track made ${artist} globally famous?`,
      options: [song.title, 'Shape of You', 'Blinding Lights', 'Bad Guy'],
      correctIndex: 0
    },
    {
      question: `What primary music style/genre is ${artist} most known for?`,
      options: ['Indie / Pop', 'Classical Opera', 'Heavy Metal', 'Country Jazz'],
      correctIndex: 0
    },
    {
      question: `Which country is ${artist} originally associated with?`,
      options: ['India / Global', 'United Kingdom', 'United States', 'Canada'],
      correctIndex: 0
    }
  ];
  return questions[Math.floor(Math.random() * questions.length)];
}

function reorderFairPlayQueue(queue) {
  if (queue.length <= 1) return queue;
  const userBuckets = {};
  queue.forEach(song => {
    if (!userBuckets[song.addedBy]) userBuckets[song.addedBy] = [];
    userBuckets[song.addedBy].push(song);
  });

  const reordered = [];
  let added = true;
  while (added) {
    added = false;
    for (const user in userBuckets) {
      if (userBuckets[user].length > 0) {
        reordered.push(userBuckets[user].shift());
        added = true;
      }
    }
  }
  return reordered;
}

app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);
  try {
    const results = await YouTube.search(query, { limit: 5, type: 'video' });
    const videos = results.map(v => ({
      title: v.title,
      videoId: v.id,
      thumbnail: v.thumbnail ? v.thumbnail.url : '',
      artist: v.channel ? v.channel.name : 'Artist'
    }));
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

io.on('connection', (socket) => {
  // Host Creates Room
  socket.on('create-room', async ({ mode, hostName }) => {
    const roomId = generateRoomCode();
    const joinUrl = `http://localhost:3000/passenger.html?room=${roomId}`;
    const qrCodeData = await QRCode.toDataURL(joinUrl);

    const driverName = hostName && hostName.trim() ? hostName.trim() : 'Driver (Host)';

    rooms[roomId] = { 
      queue: [], 
      currentSong: null, 
      currentTrivia: null,
      members: [],
      mode: mode || 'Road Trip',
      skips: new Set(),
      hostSocketId: socket.id
    };
    
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userName = driverName;

    socket.emit('room-created', { roomId, mode: rooms[roomId].mode, qrCodeData, hostName: driverName });
  });

  // Passenger Joins Room
  socket.on('join-room', ({ roomId, userName }) => {
    const code = roomId ? roomId.toUpperCase() : '';
    if (rooms[code]) {
      const name = userName ? userName.trim() : 'Passenger ' + Math.floor(Math.random() * 100);
      rooms[code].members.push({ id: socket.id, name });
      socket.join(code);
      socket.roomId = code;
      socket.userName = name;

      socket.emit('room-joined', { roomId: code, roomData: rooms[code] });
      io.to(code).emit('members-updated', { members: rooms[code].members });
    } else {
      socket.emit('error-msg', 'Invalid Room Code!');
    }
  });

  // Add Song (Works for both Driver Host & Passengers!)
  socket.on('add-song', ({ roomId, song }) => {
    if (rooms[roomId]) {
      const addedBy = socket.userName || 'Guest';
      const newSong = {
        id: Date.now().toString(),
        title: song.title,
        videoId: song.videoId,
        thumbnail: song.thumbnail,
        artist: song.artist || 'Artist',
        addedBy: addedBy,
        votes: 1
      };
      
      rooms[roomId].queue.push(newSong);
      rooms[roomId].queue = reorderFairPlayQueue(rooms[roomId].queue);
      io.to(roomId).emit('queue-updated', rooms[roomId]);
    }
  });

  // Upvote
  socket.on('upvote-song', ({ roomId, songId }) => {
    if (rooms[roomId]) {
      const song = rooms[roomId].queue.find(s => s.id === songId);
      if (song) {
        song.votes += 1;
        rooms[roomId].queue.sort((a, b) => b.votes - a.votes);
        io.to(roomId).emit('queue-updated', rooms[roomId]);
      }
    }
  });

  // Submit Trivia
  socket.on('submit-trivia-answer', ({ roomId, selectedIndex }) => {
    if (rooms[roomId] && rooms[roomId].currentTrivia) {
      const isCorrect = selectedIndex === rooms[roomId].currentTrivia.correctIndex;
      socket.emit('trivia-result', { 
        isCorrect, 
        correctAnswer: rooms[roomId].currentTrivia.options[rooms[roomId].currentTrivia.correctIndex]
      });
    }
  });

  // Democratic Skip Vote
  socket.on('vote-skip', ({ roomId }) => {
    if (rooms[roomId] && rooms[roomId].currentSong) {
      rooms[roomId].skips.add(socket.id);
      const skipCount = rooms[roomId].skips.size;
      const totalMembers = (rooms[roomId].members.length || 0) + 1; // Members + Host
      
      io.to(roomId).emit('skip-updated', { skipCount, totalMembers });

      if (skipCount >= Math.ceil(totalMembers / 2)) {
        rooms[roomId].skips.clear();
        rooms[roomId].currentSong = rooms[roomId].queue.shift();
        rooms[roomId].currentTrivia = generateTrivia(rooms[roomId].currentSong);
        io.to(roomId).emit('play-next', rooms[roomId]);
      }
    }
  });

  // Reactions
  socket.on('send-reaction', ({ roomId, emoji }) => {
    if (rooms[roomId]) {
      io.to(roomId).emit('new-reaction', { emoji, sender: socket.userName });
    }
  });

  // Next Track
  socket.on('song-ended', ({ roomId }) => {
    if (rooms[roomId]) {
      rooms[roomId].skips.clear();
      if (rooms[roomId].queue.length > 0) {
        rooms[roomId].currentSong = rooms[roomId].queue.shift();
        rooms[roomId].currentTrivia = generateTrivia(rooms[roomId].currentSong);
      } else {
        rooms[roomId].currentSong = null;
        rooms[roomId].currentTrivia = null;
      }
      io.to(roomId).emit('play-next', rooms[roomId]);
    }
  });

  socket.on('disconnect', () => {
    const code = socket.roomId;
    if (code && rooms[code]) {
      rooms[code].members = rooms[code].members.filter(m => m.id !== socket.id);
      io.to(code).emit('members-updated', { members: rooms[code].members });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`⚡ Auxi running on http://localhost:${PORT}`);
});