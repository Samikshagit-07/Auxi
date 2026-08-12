⚡ Auxi — Pass the Aux Digitally 🚗🎵
A real-time, democratic music queuing and audio synchronization platform designed for car road trips, house parties, and virtual jam sessions.

🌟 The Problem
During group road trips or house parties, connecting to the AUX cord or Bluetooth speaker often leads to constant phone passing, volume fights, or one person hijacking the entire playlist.

💡 The Solution
Auxi eliminates friction by creating a shared digital session. The driver/host creates a room, passengers scan a dynamic QR code from their phones, and everyone democratically queues, upvotes, skips, and reacts to songs in real time!

🔥 Key Features
📲 Frictionless QR Code Join: Instant pairing using a 4-letter room code or dynamic QR code (no account registration required).

👑 Dual Queuing (Driver & Passengers): Both driver host and passengers can search for tracks, add songs, and control playback.

🎬 1-Tap Ready Playlists: Pre-curated instant playlists for Bollywood, Sandalwood, Tollywood, Party Melodies, and Hollywood Pop.

🔄 Dynamic Vibe Switching: Switch entire playlist vibes on the fly with Replace Queue or Append Queue modes, or purge the queue with a single tap.

🔥 Democratic Upvoting & Fair-Play Scheduling: Songs with higher upvotes move up the queue, while a fair-scheduling algorithm ensures equal airtime across all participants.

🚫 Consensus Vote Skip: Automatically skips the active track when 50%+ of connected participants vote to skip.

🧠 Interactive Live Music Trivia: Auto-generated trivia questions pop up on passenger screens during track playback.

🎉 Synchronized Floating Reactions: Send live floating emojis (🔥 ❤️ 🎧 🎉 💩) that render simultaneously across all connected devices.

🎧 Long-Distance Audio Sync: Low-latency playback synchronization for remote listening sessions.

🛠️ Tech Stack
Frontend: HTML5, Modern CSS, Tailwind CSS, JavaScript (ES6+)

Backend: Node.js, Express.js

Real-Time Communication: WebSockets via Socket.io

APIs & Tools: YouTube IFrame Player API, Invidious REST Search Engine, qrcode

Deployment: Render PaaS

📁 Project Structure
auxi/

public/

index.html — Landing page (Mode Selection)

host.html — Driver / Host Dashboard

passenger.html — Passenger Interface

server.js — Express & Socket.io Backend Server

package.json — Dependencies & Scripts

README.md — Project Documentation

🚀 Local Development Setup
Prerequisites
Node.js (v16 or higher)

Git

Installation Steps
Clone the repository:
git clone https://github.com/Samikshagit-07/Auxi.git
cd Auxi

Install dependencies:
npm install

Start the development server:
node server.js

Open in Browser:

Host / Driver Dashboard: http://localhost:3000/host.html

Passenger Join Screen: http://localhost:3000/passenger.html

🌐 Live Deployment
The application is deployed live on Render:

🔗 Live Link: https://auxi.onrender.com

👥 Contributor
Samiksha R Singi — Lead Developer & Creator

📄 License
This project is open-source under the MIT License.