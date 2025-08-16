import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import {WebSocketServer} from 'ws';
import http from 'http';

dotenv.config();

const app = express();
const port = 4000; // Use environment variable for port

// PostgreSQL client setup
const db = new pg.Client({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT, // Default PostgreSQL port
});

db.connect().catch(err => {
  console.error('Failed to connect to the database:', err);
  process.exit(1); // Exit the process if the database connection fails
});

// Create an HTTP server from the Express app
const server = http.createServer(app);

// Create WebSocket server using the HTTP server
const wss = new WebSocketServer({server});

// Store WebSocket connections for each location
const locationConnections = {};

// Handle WebSocket connections
wss.on('connection', ws => {
  console.log('New WebSocket connection established.');

  // When a message is received from the client
  ws.on('message', message => {
    try {
      const data = JSON.parse(message);

      // Handle location update
      if (data.type === 'locationUpdate') {
        const {location} = data;
        console.log('Location received:', location);

        // Map the WebSocket to the user's location
        if (!locationConnections[location]) {
          locationConnections[location] = [];
        }
        locationConnections[location].push(ws);

        // Query the database to get the user count for this location
        getUserCount(location)
          .then(count => {
            // Send back the user count to the client
            ws.send(JSON.stringify({type: 'userCount', count}));
          })
          .catch(error => {
            console.error('Error fetching user count:', error);
          });
      }

      // Handle sending messages
      if (data.type === 'sendMessage') {
        const {location, message, username} = data;
        console.log('Message Received:- ', message);
        // Send message to all users in the same location
        if (locationConnections[location]) {
          locationConnections[location].forEach(client => {
            client.send(
              JSON.stringify({
                type: 'receiveMessage',
                username,
                message,
                side: client === ws ? 'right' : 'left', // Sender on the right, Receiver on the left
              }),
            );
          });
        }
      }

      //handle SOS messages
      if (data.type === 'SOS') {
        console.log(`SOS from ${data.username}: ${data.fullAdress}`);

        // Broadcast SOS to all connected clients
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: 'SOS',
                username: data.username,
                location: data.location,
                message: data.message,
                lat:data.lat,
                lng:data.lng
              }),
            );
          }
        });
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle connection close
  ws.on('close', () => {
    console.log('WebSocket connection closed.');
    // Remove this WebSocket connection from locationConnections
    for (let location in locationConnections) {
      const index = locationConnections[location].indexOf(ws);
      if (index !== -1) {
        locationConnections[location].splice(index, 1);
      }
    }
  });

  // Handle WebSocket errors
  ws.onerror = error => {
    console.error('WebSocket error:', error.message);
  };
});

// Function to fetch user count from the database for a given location
async function getUserCount(location) {
  try {
    const result = await db.query(
      'SELECT COUNT(*) FROM locations WHERE curr_location = $1',
      [location],
    );
    console.log('User count:', result.rows[0].count);
    return parseInt(result.rows[0].count, 10); // Ensure the count is an integer
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Unable to fetch user count.');
  }
}

// Start the HTTP server and WebSocket server on the same port
server.listen(port, () => {
  console.log(`Express server running on port ${port}`);
});
