import mongoose from 'mongoose';

const checkEmployee = async () => {
  try {
    await mongoose.connect('mongodb+srv://Hrm-CRM:rudra2610@hrm.grtlcgo.mongodb.net/hrm?appName=Hrm');
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    const employees = await db.collection('employees').find({}).toArray();
    console.log('Employees found:', employees.length);
    if (employees.length > 0) {
      console.log('First employee:', {
        email: employees[0].email,
        passwordHash: employees[0].password
      });
    } else {
      console.log('No employees found! The registration must have failed.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkEmployee();
