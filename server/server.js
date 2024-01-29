const PROTO_PATH ='C:/Users/karal/Desktop/soapproje/proto/greeter.proto'

var grpc = require("@grpc/grpc-js");
var protoLoader = require("@grpc/proto-loader");
var db =require("../db/db")
const cookie = require('cookie');
const soap = require('soap');
var packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true
});
const { v4: uuidv4 } = require("uuid");
const jwt = require('jsonwebtoken');

const server = new grpc.Server();

var customersProto = grpc.loadPackageDefinition(packageDefinition);

const secretKey = "veryverysecret";





server.addService(customersProto.CustomerService.service, {
  getAll: async (call, callback) => {
    const {owner_id} = call.request;
  
  
      // owner_id'yi kullanarak ilgili kullanıcının tüm görevlerini getir
      const todo = await db.getAllTodos(owner_id);
      console.log('too:',todo)
      // Görevleri geri döndür
      callback(null, {todo} );
    } ,
    
  
    
      insert: async (call, callback) => {
        const todo = call.request;
        const insertedTodo = await db.insertTodo(todo);
        callback(null, insertedTodo);
      },
    
      update: async (call, callback) => {
        const todoId = call.request.id;
        const updatedTodo = call.request;
        const todo = await db.updateTodo(todoId, updatedTodo);
        callback(null, todo);
      },
    
      remove: async (call, callback) => {
        const id = call.request.id;
        console.log(id)
        await db.removeTodo(id)
      
        callback(null, {});
      },
      
      Login: async (call, callback) => {
        const { email, password } = call.request;
       
      
        try {
          // Verify the user credentials against the database
          var user =await db.login(email,password)
          
          console.log("user:",user)
          // User is authenticated, generate a JWT token
          const userData = {
            userId: user.id, // Replace with the actual user ID from the database
            username: user.username,
            pass:user.password
        };

        
          const token = jwt.sign(userData, secretKey, { expiresIn: '1h' });
          console.log("token :",token)


           const cookieOptions = {
      httpOnly: true,
      expires: new Date(Date.now() + 3600000), // 1 saat
    };
    const jwtCookie = cookie.serialize('jwt', token, cookieOptions);

    // Cookie'yi response'un "set-cookie" başlığı ile gönder
    callback(null, {
      headers: { 'set-cookie': jwtCookie },
      message: 'Kullanıcı başarıyla doğrulandı',
      token: token
    });
         
          
        } catch (error) {
          // Handle login error
          console.error('Error during login:', error);
          callback({ code: grpc.status.INTERNAL, details: 'hata var' });
        }
      },
      Register: async (call, callback) => {
        const { username, password, email, tcKimlik, name, surname, year } = call.request;
    console.log('Received data:', { username, password, email, tcKimlik, name, surname, year });
        //soap kontrol
        try {
         
          const tcKimlikDogrulandi = await tcKimlikNoDogrula(tcKimlik, name, surname, year);
          
          if (!tcKimlikDogrulandi) {
            callback({
              code: grpc.status.INVALID_ARGUMENT,
              details: 'TC kimlik doğrulaması başarısız',
            });
            
          }
          else{
            
            // Uncomment the following code once you implement the database logic
            const usernameResult = await db.checkUsernameDuplicate(username);
            const emailResult = await db.checkEmailDuplicate(email);
        
            if (usernameResult.isDuplicate) {
              callback({
                code: grpc.status.INVALID_ARGUMENT,
                details: 'Username is already taken',
              });
              return;
            }
        
            if (emailResult.isDuplicate) {
              callback({
                code: grpc.status.INVALID_ARGUMENT,
                details: 'Email is already registered',
              });
              return;
            }
        
            // If no duplicates, proceed with user registration
            const newUser = await db.addUser(username, password, email, tcKimlik, name, surname, year);

            if (!newUser.success){
              callback({
                code: grpc.INVALID_ARGUMENT,
                message:newUser.message,
                hata:newUser.error
              })
            }
        
            callback(null, {
              message: newUser.message,
              status: 'ok',
              success: true,
              newUser: newUser,
            });
          }
          
          
          
          
          
          // Temporary response for testing
         
        } catch (error) {
          // Handle errors
          console.error('Error registering user:', error);
          callback({ code: grpc.status.INTERNAL, details: 'Internal Server Error' });
        }
      },
    })


  //soap

  async function tcKimlikNoDogrula(tcKimlikNo, isim, soyisim, dogumyili) {
      return new Promise((resolve, reject) => {
        const url = 'https://tckimlik.nvi.gov.tr/Service/KPSPublic.asmx?wsdl';
        const args = { TCKimlikNo: tcKimlikNo, Ad: isim, Soyad: soyisim, DogumYili: dogumyili };
        console.log(args)
        soap.createClient(url, (err, clients) => {
          if (err) {
            console.error(err);
            reject(err);
          }
    
          clients.TCKimlikNoDogrula(args, (err, result) => {
            if (err) {
           
              reject(err);
            }
    
            // TC kimlik doğrulamasının sonucu
            const dogrulandi = result && result.TCKimlikNoDogrulaResult;
    
            resolve(dogrulandi);
          });
        });
      });
    }
    
//middleware




const bindAddr = "127.0.0.1:30043";
const creds = grpc.ServerCredentials.createInsecure();

server.bindAsync(bindAddr, creds, (err, port) => {
  if (err) {
    console.error(`Error binding to ${bindAddr}:`, err);
  } else {
    console.log(`Server running at http://${bindAddr}`);
    server.start();
  }
});