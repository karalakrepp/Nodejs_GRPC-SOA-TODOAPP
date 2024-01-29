

const { Pool } = require('pg');
const bcrypt  =require('bcrypt')
const pool = new Pool({ 
  user: 'pg username',
  host: 'hostname',
  database: 'db name',
  password: 'pass',
  port: "db port must be int", // PostgreSQL varsayılan portu
});

module.exports = {
   getAllTodos: async (owner_id) => {
    try {
      
  
      const result = await pool.query('SELECT * FROM todo WHERE ownerid= $1' , [owner_id]);
      console.log( 'with values:', (result.rows));
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
  
  insertTodo: async (todo) => {
    const result = await pool.query('INSERT INTO todo (name, isAktive, title, ownerId) VALUES ($1, $2, $3, $4) RETURNING *', [ todo.name, todo.isAktive, todo.title, todo.ownerID]);

    return result.rows[0];
  },
  
  
  updateTodo: async (todoId, updatedTodo) => {
    const result = await pool.query('UPDATE Todo SET name = $1, isAktive = $2, title = $3, ownerid = $4 WHERE id = $5 RETURNING *', [updatedTodo.name,  updatedTodo.isAktive, updatedTodo.title, updatedTodo.ownerID, todoId]);
    return result.rows[0];
  },

  removeTodo: async (todoId) => {
    await pool.query('DELETE FROM todo WHERE id = $1', [todoId]);
  },
  
checkUsernameDuplicate: async (username)=> {
    try {
      const query = 'SELECT * FROM users WHERE username = $1';
      const result = await pool.query(query, [username]);
  
      return { isDuplicate: result.rows.length > 0, message: 'Success' };
    } catch (error) {
      console.error('Error in checkUsernameDuplicate:', error);
      return { isDuplicate: false, message: 'Error checking username duplicate', error };
    }
  },
  
   checkEmailDuplicate :async (email)=> {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);
  
      return { isDuplicate: result.rows.length > 0, message: 'Success' };
    } catch (error) {
      console.error('Error in checkEmailDuplicate:', error);
      return { isDuplicate: false, message: 'Error checking email duplicate', error };
    }
  },
   addUser : async (username, password, email, tcKimlik, name, surname, year)  => {
    const hashPassword = await bcrypt.hash(password, 13)
    try {
      // Check for duplicate username and email
     
  
      // If no duplicates, proceed with user registration
      const result = await pool.query(
        `INSERT INTO users (username, password, email, kimlikno, firstname, lastname, year)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`, 
        [username, hashPassword, email, tcKimlik, name, surname, year]
      );
  
      return { success: true, message: 'Signup successful' };
    } catch (err) {
      console.error('Error executing SQL query:', err);
      return { success: false, message: 'Signup failed', error: err };
    }},

    login: async (email, password) => {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result= await pool.query(query, [email]);
    
      // Check if a user with the provided credentials exists
      if (result.rows.length === 0) {
        return null;
      }
    
      const user = result.rows[0];
    
      const isValidPassword = await bcrypt.compare(password, user.password);
    
      if (isValidPassword) {
        return {
          success: true,
          id: user.id,
          username: user.username,
          password: user.password,
          // Add other user properties as needed
        };
      } else {
        return { success: false, message: 'Şifre hatalı, lütfen tekrar deneyiniz.' };
      }
    }
    
    
    
  }

