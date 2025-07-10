import nodemailer from 'nodemailer';

import dotenv from 'dotenv';
dotenv.config();
// Create a transporter using Zoho SMTP settings
export const Transporter = nodemailer.createTransport({
  service: 'Zoho',
  auth: {
    user: process.env.ZOHO_EMAIL, // Your Zoho email
    pass: process.env.ZOHO_PASSWORD, // Your Zoho password or app-specific password
  },
  tls: {
    rejectUnauthorized: false, // To avoid self-signed certificate errors
  },
});
