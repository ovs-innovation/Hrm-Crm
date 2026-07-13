import Message from '../models/Message.js';
import { getReceiverSocketId, io } from '../socket/socket.js';

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error in getMessages controller: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, fileUrl, fileType } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Socket functionality to send message in real time
    const receiverSocketId = getReceiverSocketId(receiverId);
    let status = 'sent';
    if (receiverSocketId) {
      status = 'delivered';
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      fileUrl,
      fileType,
      status,
    });

    await newMessage.save();

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('newMessage', newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error in sendMessage controller: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the URL to access the file
    // Example: http://localhost:5000/uploads/filename.ext
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    // Determine file type category (image, pdf, etc.) for easier frontend rendering
    const mimeType = req.file.mimetype;
    let fileType = 'file';
    if (mimeType.startsWith('image/')) {
      fileType = 'image';
    } else if (mimeType === 'application/pdf') {
      fileType = 'pdf';
    }

    res.status(200).json({ fileUrl, fileType });
  } catch (error) {
    console.error('Error in uploadFile controller: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAsSeen = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const loggedInUserId = req.user._id;

    await Message.updateMany(
      { senderId: userToChatId, receiverId: loggedInUserId, status: { $ne: 'seen' } },
      { $set: { status: 'seen' } }
    );

    res.status(200).json({ message: 'Messages marked as seen' });
  } catch (error) {
    console.error('Error in markAsSeen controller: ', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
