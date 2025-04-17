import express from 'express'
import { Server } from 'socket.io'
import http from 'http'
import {Chess} from 'chess.js'
import 'dotenv/config'

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const chess = new Chess()
let players = {}
let currentPlayer = "w"

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.render('index' , {title: 'Chess Game'})
})

io.on('connection',function(uniqueSocketId){
  console.log('New player connected');
  
  if(!players.white){
    players.white = uniqueSocketId.id;
    uniqueSocketId.emit('playerRole', 'w');
  }
  else if(!players.black){
    players.black = uniqueSocketId.id;
    uniqueSocketId.emit('playerRole', 'b');
  }
  else{
    uniqueSocketId.emit('spectatorRole');
  }

  uniqueSocketId.on("disconnect",function(){
    if(uniqueSocketId.id===players.white){
      delete players.white;
    }
    else if(uniqueSocketId.id===players.black){
      delete players.black;
    }
  });

  uniqueSocketId.on('move', function(move){
    try{
      if(chess.turn()==="w" && uniqueSocketId.id!==players.white){
        uniqueSocketId.emit('notYourTurn');
        return;
      }
      if(chess.turn()==="b" && uniqueSocketId.id!==players.black){
        uniqueSocketId.emit('notYourTurn');
        return;
      }
      const result = chess.move(move);
      if(result){
        currentPlayer = chess.turn();
        io.emit('move', move);
        io.emit('boardState', chess.fen());
      }else{
        console.log("Invalid Move: ", move);
        uniqueSocketId.emit('invalidMove', move);
      }
    }catch(err){
      console.log("Error: ", err);
      uniqueSocketId.emit('invalidMove', move);
    }
  })

});

server.listen(process.env.PORT, () => {
  console.log('Server running.');
})