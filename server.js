import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import twilio from 'twilio';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

const accountSid='';
const authToken='';

const client = twilio(accountSid, authToken);

dotenv.config();

app.use(express.json());

app.use(bodyParser.json());

const db = new pg.Client({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DATABASE,
  password: process.env.PASSWORD,
  port: process.env.PORT,
});

db.connect();

//Registration
app.get('/username', async (req, res) => {
  const {username, adhar_no} = req.query;
  console.log(username, adhar_no);

  try {
    const result = await db.query(
      'SELECT u_name, adhar_no FROM users WHERE u_name = $1 OR adhar_no = $2',
      [username, adhar_no],
    );

    if (result.rows.length > 0) {
      const existingFields = result.rows.map(row => ({
        username: row.u_name === username,
        adhar_no: row.adhar_no === adhar_no,
      }));

      return res.status(200).json({
        success: true,
        message: 'User or Aadhaar number already exists',
        existingFields,
      });
    }

    return res
      .status(200)
      .json({success: false, message: 'No conflicts found'});
  } catch (error) {
    console.error('Database query error:', error);
    return res
      .status(500)
      .json({success: false, message: 'Internal server error'});
  }
});

app.post('/data', async (req, res) => {
  try {
    console.log('Received data:', req.body);

    const {name, Adhar, Dob, Password, FullName, GuardianNo} = req.body;

    // Insert user into database
    const result = await db.query(
      'INSERT INTO users (u_name, adhar_no, dob, u_pass, full_name, g_no) VALUES ($1, $2, $3, $4, $5, $6) returning full_name, g_no',
      [name, Adhar, Dob, Password, FullName, GuardianNo],
    );

    return res.status(201).json({
      success: true,
      message: 'Data received successfully!',
      full_Name: result.rows[0].full_name,
      g_no: result.rows[0].g_no,
    });
  } catch (error) {
    console.error('Error querying the database:', error);

    if (error.code === '23505') {
      // Example: Handle unique constraint violations
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry. User or adhar_no already exists.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

//Login
app.post('/login', async (req, res) => {
  const {name, Password} = req.body;

  try {
    // Query to check if the username and password match
    const result = await db.query(
      'SELECT * FROM users WHERE u_name = $1 AND u_pass = $2',
      [name, Password],
    );

    if (result.rows.length > 0) {
      const username = result.rows[0].u_name;
      const u_id = result.rows[0].u_id;
      const full_Name = result.rows[0].full_name;
      const g_no = result.rows[0].g_no;
      console.log(username);
      console.log(u_id);
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        username: username,
        u_id: u_id,
        full_Name: full_Name,
        g_no: g_no,
      });
    } else {
      return res
        .status(401)
        .json({success: false, message: 'Invalid username or password'});
    }
  } catch (error) {
    console.error('Error during login:', error);
    return res
      .status(500)
      .json({success: false, message: 'Internal server error'});
  }
});

//Profile
app.get('/posts', async (req, res) => {
  const {username} = req.query;
  console.log('Fetching posts for user:', username);

  if (!username) {
    return res
      .status(400)
      .json({success: false, message: 'Username is required'});
  }

  try {
    const result = await db.query(
      'SELECT post FROM posts WHERE user_name = $1 order by p_id desc',
      [username],
    );
    if (result.rows.length === 0) {
      return res.status(200).json({success: true, posts: []});
    }

    return res.status(200).json({success: true, posts: result.rows});
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res
      .status(500)
      .json({success: false, message: 'Error fetching posts'});
  }
});

//Homescreen
app.post('/post', async (req, res) => {
  const {user_name, u_id, post} = req.body;
  try {
    await db.query(
      'insert into posts(post,user_id,user_name) values($1,$2,$3)',
      [post, u_id, user_name],
    );
    return res.status(201).json({
      success: true,
      message: 'Post submitted successfully!',
    });
  } catch (error) {
    console.error('Error during Posting:', error);
    return res
      .status(500)
      .json({success: false, message: 'Internal server error'});
  }
});

app.get('/homePosts', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM posts order by p_id desc');

    return res.status(200).json({success: true, posts: result.rows});
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res
      .status(500)
      .json({success: false, message: 'Error fetching posts'});
  }
});

// Report submission endpoint
app.post('/report', async (req, res) => {
  const {user_name, u_id, report, report_type} = req.body;
  try {
    const result = await db.query(
      'INSERT INTO reports(report, user_id, user_name, report_type) VALUES($1, $2, $3, $4) RETURNING r_id, status;',
      [report, u_id, user_name, report_type],
    );

    const insertedId = result.rows[0].r_id;
    const status = result.rows[0].status;

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully!',
      r_id: insertedId,
      status: status,
      report_type: result.rows[0].report_type,
    });
  } catch (error) {
    console.error('Error during Reporting:', error);
    return res
      .status(500)
      .json({success: false, message: 'Internal server error'});
  }
});

// Fetch reports based on username
app.get('/reports', async (req, res) => {
  const {username} = req.query;
  try {
    const result = await db.query(
      'SELECT * FROM reports WHERE user_name = $1 ORDER BY r_id DESC',
      [username],
    );

    return res.status(200).json({success: true, reports: result.rows});
  } catch (error) {
    console.error('Error fetching reports:', error);
    return res
      .status(500)
      .json({success: false, message: 'Error fetching reports'});
  }
});

// Delete a report by report ID
app.delete('/delReport', async (req, res) => {
  const {r_id} = req.query;

  if (!r_id) {
    return res
      .status(400)
      .json({success: false, message: 'Report ID is required'});
  }

  try {
    const result = await db.query(
      'DELETE FROM reports WHERE r_id = $1 RETURNING *',
      [r_id],
    );

    if (result.rowCount === 0) {
      console.warn(`Report with ID ${r_id} not found`);
      return res
        .status(404)
        .json({success: false, message: 'Report not found'});
    }

    console.info(`Deleted report with ID ${r_id}:`, result.rows[0]);

    const remainingReports = await db.query('SELECT COUNT(*) FROM reports');

    return res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
      deletedReport: result.rows[0],
      remainingReports: remainingReports.rows[0].count,
    });
  } catch (error) {
    console.error('Error deleting report:', error.stack || error.message);
    return res
      .status(500)
      .json({success: false, message: 'Internal server error'});
  }
});

// Update the content of an existing report
app.put('/updateReport', async (req, res) => {
  const {r_id} = req.query;
  const {report} = req.body;

  if (!r_id || !report) {
    return res
      .status(400)
      .json({success: false, message: 'Report ID and content are required'});
  }

  try {
    const result = await db.query(
      'UPDATE reports SET report = $1 WHERE r_id = $2 RETURNING r_id, report',
      [report, r_id],
    );

    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({success: false, message: 'Report not found'});
    }

    return res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      report: result.rows[0].report,
    });
  } catch (error) {
    console.error('Error updating report:', error);
    return res
      .status(500)
      .json({success: false, message: 'Internal server error'});
  }
});

//ChildCommunity
app.post('/send-sos', (req, res) => {
  const {full_Name, g_no, location} = req.body;

  // Ensure required fields are present
  if (!full_Name || !g_no || !location) {
    return res
      .status(400)
      .json({success: false, error: 'Missing required fields.'});
  }

  // Send WhatsApp message via Twilio
  client.messages
    .create({
      from: 'whatsapp:+14155238886', // Twilio WhatsApp number
      body: `🚨 *HIGH ALERT* 🚨  

Hello, this is an emergency notification.  

*${full_Name}* is in immediate danger and requires urgent assistance!  

📍 *Current Location:* ${location}  

⚠️ Please act immediately to provide help or contact emergency services.  

*DO NOT IGNORE THIS MESSAGE.*  
Every second counts in saving a life.`,

      to: `whatsapp:+91${g_no}`,
    })
    .then(message => {
      res.json({success: true, messageSid: message.sid});
    })
    .catch(error => {
      res.status(500).json({success: false, error: error.message});
    });
});

app.post('/send-notify', (req, res) => {
  const {full_Name, g_no, location} = req.body;

  if (!full_Name || !g_no || !location) {
    return res
      .status(400)
      .json({success: false, error: 'Missing required fields.'});
  }

  console.log('Sending notification to:', g_no);

  client.messages
    .create({
      body: `Hello, ${full_Name} wants to notify you of their location.\n\nCurrent Location: ${location}`,
      from: '+16203509804',
      to: `+91${g_no}`,
    })
    .then(message => {
      res.json({success: true, messageSid: message.sid});
    })
    .catch(error => {
      console.error('Error sending notification:', error.message);
      res.status(500).json({success: false, error: error.message});
    });
});

app.post('/send-ast', (req, res) => {
  const {full_Name, g_no, location} = req.body;

  // Ensure required fields are present
  if (!full_Name || !g_no || !location) {
    return res
      .status(400)
      .json({success: false, error: 'Missing required fields.'});
  }

  // Send WhatsApp message via Twilio
  client.messages
    .create({
      from: 'whatsapp:+14155238886', // Twilio WhatsApp number
      body: `🚨 *ASSISTANCE REQUEST* 🚨

Hello, urgent help is needed!

*${full_Name}* requires assistance at the following location:

📍 *Current Location:* ${location}

Please reach out as soon as possible or contact emergency services if necessary.

Your immediate response is crucial in providing the necessary help.`,

      to: `whatsapp:+91${g_no}`,
    })
    .then(message => {
      res.json({success: true, messageSid: message.sid});
    })
    .catch(error => {
      res.status(500).json({success: false, error: error.message});
    });
});

//Community
app.post('/store-location', (req, res) => {
  const {user_id, user_name, lat, lng, sublocality} = req.body;

  db.query(
    'SELECT * FROM locations WHERE user_id = $1',
    [user_id],
    (err, result) => {
      if (err) {
        return res.status(500).send('Database error');
      }

      if (result.rows.length > 0) {
        db.query(
          'UPDATE locations SET curr_location = $1, latitude = $2, longitude = $3 WHERE user_id = $4',
          [sublocality, lat, lng, user_id],
          (err, updateResult) => {
            if (err) {
              return res.status(500).send('Error updating location');
            }
            res.send('Location updated successfully');
          },
        );
      } else {
        db.query(
          'INSERT INTO locations (user_id, user_name, curr_location, latitude, longitude) VALUES ($1, $2, $3, $4, $5)',
          [user_id, user_name, 'Unknown location', lat, lng],
          (err, insertResult) => {
            if (err) {
              return res.status(500).send('Error inserting location');
            }
            res.send('Location stored successfully');
          },
        );
      }
    },
  );
});

app.listen(port, () => {
  console.log('Server listining on port 3000');
});
