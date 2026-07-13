import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar, withCredentials: true }));

const test = async () => {
  try {
    console.log('Logging in as rudrapratap7488@gmail.com...');
    const loginRes = await client.post('http://localhost:5000/api/employees/login', {
      email: 'rudrapratap7488@gmail.com',
      password: 'Password123'
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
