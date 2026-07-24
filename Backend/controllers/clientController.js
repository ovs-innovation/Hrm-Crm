import Client from '../models/Client.js';

export const createClient = async (req, res) => {
  try {
    const { name, company, email, phone, status, notes } = req.body;
    
    const clientExists = await Client.findOne({ email });
    if (clientExists) {
      return res.status(400).json({ message: 'Client with this email already exists' });
    }

    const client = await Client.create({
      name,
      company,
      email,
      phone,
      status,
      notes
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getClients = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const clients = await Client.find(filter).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    Object.assign(client, req.body);
    const updatedClient = await client.save();
    
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    await client.deleteOne();
    res.json({ message: 'Client removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
