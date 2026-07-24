import axios from 'axios';

const test = async () => {
  try {
    const url = 'https://hrm.vastoratech.com/api/auth/admin/login';
    console.log('Sending login request to:', url);
    
    const res = await axios.post(url, {
      email: 'founder@vastora.tech',
      password: 'Vastora@123'
    });

    console.log('Response status:', res.status);
    console.log('Set-Cookie headers:', res.headers['set-cookie']);

  } catch (err) {
    if (err.response) {
      console.log('Response status:', err.response.status);
      console.log('Set-Cookie headers:', err.response.headers['set-cookie']);
    } else {
      console.error('Error message:', err.message);
    }
  }
};

test();
