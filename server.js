require('dotenv').config();

const Stripe = require('stripe');
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const STRIPE_SK = process.env.STRIPE_SK;
const STRIPE_PK = process.env.STRIPE_PK;
const STRIPE_API_VER = process.env.STRIPE_API_VER;
const stripe = new Stripe(STRIPE_SK, {apiVersion: STRIPE_API_VER});

const STRIPE_NATAL_CHART = process.env.STRIPE_NATAL_CHART_PRICE;

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://astrolumina.netlify.app',
    'https://carmenilie.com',
    'https://www.carmenilie.com'
  ]
}));

app.post('/create-session-natal-chart', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      line_items: [
        {
          price: STRIPE_NATAL_CHART,
          quantity: 1,
        },
      ],
      mode: 'payment',
      return_url: '',
      redirect_on_completion: "if_required"
    });

    res.send({ clientSecret: session.client_secret });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).send({ error: error.message });
    } else {
      res.status(500).send({ error: 'Unknown error occurred' });
    }
  }
});

//  /session-status?session_id={SESSION_ID}
app.get('/session-status', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

    res.send({
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).send({ error: error.message });
    } else {
      res.status(500).send({ error: 'Unknown error occurred' });
    }
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  const pidPath = path.resolve(__dirname, 'server.pid');
  fs.writeFileSync(pidPath, process.pid.toString());
});
