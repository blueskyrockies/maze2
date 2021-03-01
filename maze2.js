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
			spawnArmys();
		});
		

		

var frame=0;
setInterval(gameLoop,60);

var players=[];
var playersObj=[];
var army=[];
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
	
	socket.on("hitArmy", function(msg, callback){				
		console.log(msg);	
		var place=msg.split(',');
		var Gold=Math.floor(Math.random()*10)+11;
		army[parseInt(place[0])].hp-=parseInt(place[1]);
		if (army[parseInt(place[0])].hp<=0){
			army.splice(parseInt(place[0]), 1);
			io.sockets.emit("giveGold",place[2] + "," +Gold);
		}


	
    });
	
	socket.on("clearBlock", function(msg, callback){				
		console.log(msg);	
		var place=msg.split(',');
				
		map[parseInt(place[1])][parseInt(place[2])]=" ";
    });

	socket.on("saveMap", function(msg, callback){				
		var fs=require('fs');
		var clone=[...map];
		for (x=0;x<99;x++){
			for (y=0;y<99;y++){
				if (clone[x][y]=="|" || clone[x][y]=="H" || clone[x][y]=="G") clone[x][y]=" ";
			}
		}
		fs.writeFile("map.txt", JSON.stringify(clone), function (err){
			if(err) console.log(err);
		});
		

    });		
	
	
	
}); 


 
//********************************end of socket io stuff
function spawnArmys(){
	//return;
	for(i=0;i<5;i++){
		var flag=true;
		while(flag){
			var x=Math.floor(Math.random()*99);
			var y=Math.floor(Math.random()*99);
			var a={
				x:x,
				y:y,
				hp:20,
				ap:Math.floor(Math.random()*3)+1
			}
			if (map[x][y]==" ") flag=false;
		}
		console.log("spawning" + a);
		army.push(a);
	}
}




function gameLoop() {
    frame++; 

	if (army.length==0 && frame>1000){
		spawnArmys();
	}
		
	
	var gcnt=0;
	var bcnt=0;
	var scnt=0;
	for (x=0;x<99;x++){
		for (y=0;y<99;y++){
			if (map[x][y]=="|")scnt++;
			if (map[x][y]=="G")gcnt++;
			if (map[x][y]=="H")bcnt++
		}	
	}
	
    
	if (frame%100==0 && gcnt<25){
		var flag=true;
		while(flag){
			var x=Math.floor(Math.random()*99)
			var y=Math.floor(Math.random()*99)
			if (map[x][y] == " "){
				map[x][y]="G";
				console.log("Gold added at" + x + "," + y);
				flag=false;
			}	
		}		
	}

	if (frame%100==0 && bcnt<20){
		var flag=true;
		while(flag){
			var x=Math.floor(Math.random()*99)
			var y=Math.floor(Math.random()*99)
			if (map[x][y] == " "){
				map[x][y]="H";
				console.log("Health Bottle added at" + x + "," + y);
				flag=false;
			}	
		}		
	}	
	if (frame%500==0 && scnt<10){
		var flag=true;
		while(flag){
			var x=Math.floor(Math.random()*99)
			var y=Math.floor(Math.random()*99)
			if (map[x][y] == " "){
				map[x][y]="|";
				console.log("sword added at" + x + "," + y);
				flag=false;
			}	
		}		
	}	
	if (frame%50==0){
		for (i=0;i<army.length;i++){
			var d=Math.floor(Math.random()*8);
			
			
			if (army[i].x==0 && d==2){d=3}
			if (army[i].x==99 && d==3){d=2}
			if (army[i].y==0 && d==0){d=1}
			if (army[i].y==99 && d==1){d=0}
			if (d==0 && map[army[i].x][(army[i].y)-1]==" "){army[i].y--};
			if (d==1 && map[army[i].x][(army[i].y)+1]==" "){army[i].y++};
			if (d==2 && map[(army[i].x)-1][army[i].y]==" "){army[i].x--};
			if (d==3 && map[(army[i].x)+1][army[i].y]==" "){army[i].x++};
			if (army[i].x<0){army[i].x=0};
			if (army[i].x>99){army[i].x=99};
			if (army[i].y<0){army[i].y=0};
			if (army[i].y>99){army[i].y=99};
		}
	}	
	
	
    var payload={
        frame: frame,
        mx: mx,
        my: my,
        map: map, 
		playersObj: playersObj,
		army: army
    }
    io.sockets.emit("mapUpdate", JSON.stringify(payload));
}

