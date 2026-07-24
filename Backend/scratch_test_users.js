import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true }));

const test = async () => {
  try {
    const email = process.env.DEMO_EMAIL || 'admin@example.com';
    const password = process.env.DEMO_PASSWORD || 'Password123';
    console.log(`Logging in as ${email}...`);
    const loginRes = await client.post('http://localhost:5000/api/employees/login', {
      email,
      password
    });
    console.log('Login successful! Role:', loginRes.data.role);

    console.log('Fetching users...');
    const usersRes = await client.get('http://localhost:5000/api/users');
    console.log('Fetched users count:', usersRes.data.length);
    console.log('Users:', usersRes.data.map(u => ({name: u.name, role: u.role, id: u._id})));

  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
};

test();
