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

// Ready-to-Play Curated Playlists Data (Including Sandalwood!)
const PRESET_PLAYLISTS = {
  bollywood: [
    { title: "Kesariya - Brahmastra", videoId: "BddP6PYo2gs", artist: "Arijit Singh", thumbnail: "https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg" },
    { title: "Apna Bana Le - Bhediya", videoId: "ElZfdU54Cp8", artist: "Arijit Singh", thumbnail: "https://i.ytimg.com/vi/ElZfdU54Cp8/hqdefault.jpg" },
    { title: "Chaleya - Jawan", videoId: "VAdGW7QDJiU", artist: "Arijit Singh, Shilpa Rao", thumbnail: "https://i.ytimg.com/vi/VAdGW7QDJiU/hqdefault.jpg" },
    { title: "Raataan Lambiyan - Shershaah", videoId: "gvyUuxdRdR4", artist: "Jubin Nautiyal", thumbnail: "https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg" }
  ],
  sandalwood: [
    { title: "Ra Ra Rakkamma - Vikrant Rona", videoId: "n_S1I1mE8I4", artist: "Nakash Aziz, Sunidhi Chauhan", thumbnail: "https://i.ytimg.com/vi/n_S1I1mE8I4/hqdefault.jpg" },
    { title: "Singara Siriye - Kantara", videoId: "z23Y01m8_jM", artist: "Vijay Prakash, Ananya Bhat", thumbnail: "https://i.ytimg.com/vi/z23Y01m8_jM/hqdefault.jpg" },
    { title: "Sulthana - KGF Chapter 2", videoId: "e9A1e2tV10E", artist: "Ravi Basrur", thumbnail: "https://i.ytimg.com/vi/e9A1e2tV10E/hqdefault.jpg" },
    { title: "Belageddu - Kirik Party", videoId: "ebXbLfL2i4Y", artist: "Vijay Prakash", thumbnail: "https://i.ytimg.com/vi/ebXbLfL2i4Y/hqdefault.jpg" }
  ],
  party: [
    { title: "Tauba Tauba - Bad Newz", videoId: "LK7-_dgAVOI", artist: "Karan Aujla", thumbnail: "https://i.ytimg.com/vi/LK7-_dgAVOI/hqdefault.jpg" },
    { title: "Kala Chashma - Baar Baar Dekho", videoId: "k4yXQkG2s1E", artist: "Badshah, Neha Kakkar", thumbnail: "https://i.ytimg.com/vi/k4yXQkG2s1E/hqdefault.jpg" },
    { title: "Ghalti Se Mistake - Jagga Jasoos", videoId: "0-7IHOXkiV8", artist: "Pritam, Arijit Singh", thumbnail: "https://i.ytimg.com/vi/0-7IHOXkiV8/hqdefault.jpg" },
    { title: "Abhi Toh Party Shuru Hui Hai", videoId: "89J3N2m335M", artist: "Badshah", thumbnail: "https://i.ytimg.com/vi/89J3N2m335M/hqdefault.jpg" }
  ],
  tollywood: [
    { title: "Naatu Naatu - RRR", videoId: "sAzlWScHTc4", artist: "Rahul Sipligunj, Kaala Bhairava", thumbnail: "https://i.ytimg.com/vi/sAzlWScHTc4/hqdefault.jpg" },
    { title: "Oo Antava - Pushpa", videoId: "1q_4L2xM0-s", artist: "Indravathi Chauhan", thumbnail: "https://i.ytimg.com/vi/1q_4L2xM0-s/hqdefault.jpg" },
    { title: "Ramuloo Ramulaa - Ala Vaikunthapurramuloo", videoId: "2P8p4c10H0k", artist: "Anurag Kulkarni", thumbnail: "https://i.ytimg.com/vi/2P8p4c10H0k/hqdefault.jpg" },
    { title: "Halamithi Habibo - Beast", videoId: "gZa3Y_4a37A", artist: "Anirudh Ravichander", thumbnail: "https://i.ytimg.com/vi/gZa3Y_4a37A/hqdefault.jpg" }
  ],
  hollywood: [
    { title: "Blinding Lights - The Weeknd", videoId: "4NRXx6U8ABQ", artist: "The Weeknd", thumbnail: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg" },
    { title: "Shape of You - Ed Sheeran", videoId: "JGwWNGJdvx8", artist: "Ed Sheeran", thumbnail: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg" },
    { title: "Levitating - Dua Lipa", videoId: "TUVcZfQe-Kw", artist: "Dua Lipa", thumbnail: "https://i.ytimg.com/vi/TUVcZfQe-Kw/hqdefault.jpg" },
    { title: "As It Was - Harry Styles", videoId: "H5v3kku4y6Q", artist: "Harry Styles", thumbnail: "https://i.ytimg.com/vi/H5v3kku4y6Q/hqdefault.jpg" }
  ]
};

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
    if (results && results.length > 0) {
      const videos = results.map(v => ({
        title: v.title || 'Unknown Track',
        videoId: v.id,
        thumbnail: v.thumbnail ? v.thumbnail.url : '',
        artist: v.channel ? v.channel.name : 'Artist'
      }));
      return res.json(videos);
    }
    throw new Error('No results from youtube-sr');
  } catch (error) {
    try {
      const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
      const response = await fetch(`https://inv.riverside.rocks/api/v1/search?q=${encodeURIComponent(query)}&type=video`);
      const data = await response.json();
      const fallbackVideos = data.slice(0, 5).map(v => ({
        title: v.title,
        videoId: v.videoId,
        thumbnail: v.videoThumbnails && v.videoThumbnails[0] ? v.videoThumbnails[0].url : '',
        artist: v.author || 'Artist'
      }));
      return res.json(fallbackVideos);
    } catch (fallbackError) {
      return res.status(500).json({ error: 'Search failed' });
    }
  }
});

io.on('connection', (socket) => {
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

  socket.on('add-preset-playlist', ({ roomId, playlistKey }) => {
    if (rooms[roomId] && PRESET_PLAYLISTS[playlistKey]) {
      const addedBy = socket.userName || 'Guest';
      const tracks = PRESET_PLAYLISTS[playlistKey];

      tracks.forEach((song, index) => {
        rooms[roomId].queue.push({
          id: (Date.now() + index).toString(),
          title: song.title,
          videoId: song.videoId,
          thumbnail: song.thumbnail,
          artist: song.artist,
          addedBy: `${addedBy} (${playlistKey.toUpperCase()})`,
          votes: 1
        });
      });

      rooms[roomId].queue = reorderFairPlayQueue(rooms[roomId].queue);
      io.to(roomId).emit('queue-updated', rooms[roomId]);
    }
  });

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

  socket.on('submit-trivia-answer', ({ roomId, selectedIndex }) => {
    if (rooms[roomId] && rooms[roomId].currentTrivia) {
      const isCorrect = selectedIndex === rooms[roomId].currentTrivia.correctIndex;
      socket.emit('trivia-result', { 
        isCorrect, 
        correctAnswer: rooms[roomId].currentTrivia.options[rooms[roomId].currentTrivia.correctIndex]
      });
    }
  });

  socket.on('vote-skip', ({ roomId }) => {
    if (rooms[roomId] && rooms[roomId].currentSong) {
      rooms[roomId].skips.add(socket.id);
      const skipCount = rooms[roomId].skips.size;
      const totalMembers = (rooms[roomId].members.length || 0) + 1;
      
      io.to(roomId).emit('skip-updated', { skipCount, totalMembers });

      if (skipCount >= Math.ceil(totalMembers / 2)) {
        rooms[roomId].skips.clear();
        rooms[roomId].currentSong = rooms[roomId].queue.shift();
        rooms[roomId].currentTrivia = generateTrivia(rooms[roomId].currentSong);
        io.to(roomId).emit('play-next', rooms[roomId]);
      }
    }
  });

  socket.on('send-reaction', ({ roomId, emoji }) => {
    if (rooms[roomId]) {
      io.to(roomId).emit('new-reaction', { emoji, sender: socket.userName });
    }
  });

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
  console.log(`⚡ Auxi running with Sandalwood & Presets on http://localhost:${PORT}`);
});