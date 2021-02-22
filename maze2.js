var path = require('path');
var express = require('express');
var app = express();
var fs = require('fs');
var server = app.listen(80, function () {
    console.log('Listening on http://localhost:80/');
});


var dir = path.join(__dirname, 'public');

console.log(path);

var mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

app.get('*', function (req, res) {
    var file = path.join(dir, req.path.replace(/\/$/, '/maze2.html'));
    if (file.indexOf(dir + path.sep) !== 0) {
        return res.status(403).end('Forbidden');
    }
    var type = mime[path.extname(file).slice(1)] || 'text/plain';
	console.log('Serving:  ' + file + ' of type ' + type);
    var s = fs.createReadStream(file);
    s.on('open', function () {
        res.set('Content-Type', type);
        s.pipe(res);
    });
    s.on('error', function () {
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found');
    });
});

//************************************************Globals */

var mx=100;
var my=100;
var map=[];
for (x=0;x<mx;x++) {
    map[x]=[];
}

		var fs=require('fs');
		fs.readFile("map.txt", function (err, data){
			if(err) console.log(err);
			map=JSON.parse(data);
		});

var frame=0;
setInterval(gameLoop,60);

var players=[];
var playersObj=[];

//****************************************End Globals */


//********************************socket io stuff
var io = require('socket.io')(server);
io.on("connection", function(socket){
    socket.on("playerMove", function(msg, callback){				
		//console.log(msg);
		arrstr=msg.split(',');
        var px=parseInt(arrstr[1]);
        var py=parseInt(arrstr[2]);

        

        if (!players.includes(arrstr[0])) {
            players.push(arrstr[0]);
            var pOBJ={
                ID: arrstr[0],
                px: px,
                py: py,
                alive:true
            }
            playersObj.push(pOBJ);
        } else {
            for (i=0;i<playersObj.length;i++){
                if (playersObj[i].ID==arrstr[0]) {
                    playersObj[i].px=px;
                    playersObj[i].py=py;                    
                }
            }
        }
        
        
        
        

        


        //console.log(playersObj);
    });
	
    var checkFlag=0;
	socket.on("imAlive", function(msg, callback){
        //console.log("imAlive MSG:" + msg + "  checkFlag:"+ checkFlag);
        //console.log(playersObj);
        if (checkFlag==1){
            for (i=0;i<playersObj.length;i++){            
                playersObj[i].alive=false;
            }
        }

        for (i=0;i<playersObj.length;i++){
            if (playersObj[i].ID==msg) {
                playersObj[i].alive=true;                                  
            }
        }

        if (checkFlag>4) {
            checkFlag=0;
            for (i=0;i<playersObj.length;i++){            
               if (playersObj[i].alive==false) {
                   console.log("removing unresponsive user:  " + playersObj[i].ID);
                   playersObj.splice(i,1);
                   
                   return;
               }
            }
        }

        checkFlag++;

    });
	
	socket.on("addBlock", function(msg, callback){				
		console.log(msg);	
		var place=msg.split(',');
		var b=" ";
		if (place[3]=="1") b="#";
		if (place[3]=="2") b="W";
		if (place[3]=="3") b="C";
		if (place[3]=="4") b="B";
		if (place[3]=="5") b="S";
		if (place[3]=="6"){
			b="T," + place[4] + "," + place[5];
			
		}	
		map[parseInt(place[1])][parseInt(place[2])]=b;
    });

	socket.on("saveMap", function(msg, callback){				
		var fs=require('fs');
		fs.writeFile("map.txt", JSON.stringify(map), function (err){
			if(err) console.log(err);
		});

    });
}); 
 
//********************************end of socket io stuff

function gameLoop() {
    frame++;    
    
    var payload={
        frame: frame,
        mx: mx,
        my: my,
        map: map, 
		playersObj: playersObj
    }
    io.sockets.emit("mapUpdate", JSON.stringify(payload));
}

