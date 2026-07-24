import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: false, // Set to false to support HTTP deployments (like direct IP access)
    sameSite: 'lax', // Allow cross-port cookies on the same IP
    path: '/', // Ensure cookie is sent for all routes
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

export default generateToken;
