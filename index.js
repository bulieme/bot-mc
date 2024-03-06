const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals: { GoalNear } } = require('mineflayer-pathfinder');
var Vec3 = require('vec3').Vec3;
const fs = require('fs/promises');

var botOwner;
var botParam;
var wport;
var isWebEnabled;

fs.readFile("./config.json")
	.then((data) => {
		console.log("config opened")
		botOwner = data.botOwner;
		botParam = data.botInfo;
		wport = data.port;
		isWebEnabled = data.port === false;
		console.log("config loaded!!")
	})
	.catch((error) => {
		console.log(error)
	});

if (isWebEnabled){
	const express = require('express');
	const app = express();

	app.use(function(req, res) {
	  res.status(200);
	  console.log("[" + req.method + "]" + req.ip + " > [" + req.originalUrl + "]");
	  return res.send(`OK`);
	});

	app.listen(wport, () => {
	  console.log(`App listening on port ${wport}`);
	})
}

const bot = mineflayer.createBot(botParam)
bot.loadPlugin(pathfinder)

function walk2goal(x,y,z, range) {
	const mcdata = require("minecraft-data")(bot.version);
	const mvs = new Movements(bot, mcdata);
	mvs.allow1by1towers = false // Do not build 1x1 towers when going up
	//mvs.canDig = false // Disable breaking of blocks when pathing 
	bot.pathfinder.setMovements(mvs);
	bot.lookAt(new Vec3(x, y, z))
	bot.pathfinder.setGoal(new GoalNear(x, y, z, range), false);
}

function between(min, max) {  
  return Math.floor(
    Math.random() * (max - min) + min
  )
}

bot.on("login", () => {
	console.log("Logged in!");
	
	bot.on("spawn", () => {
		console.log(`Spawned in ${bot.game.gameMode}.`);
	})
})

var whileWalk = false;
var isReached = true; // Because initially our destination is reached
var rwalkPos = new Vec3(0,0,0); // 0,0,0 pos. its because the bot digs everything to enter destination

bot.on("physicsTick", () => {
	if (whileWalk && isReached) {
		isReached = false; // because our destination will be different
		var offsX = between(-3,3);
		var offsZ = between(-3,3);
		console.log(new Vec3(rwalkPos.x+offsX, rwalkPos.y, rwalkPos.z+offsZ))
		walk2goal(rwalkPos.x+offsX, rwalkPos.y, rwalkPos.z+offsZ, 0);
	}
})

bot.on("goal_reached", (goal) => {
	console.log(`pathfinding to [${goal.x}, ${goal.y}, ${goal.z}] is done!!`);
	isReached = true;
	if (whileWalk){
		bot.waitForTicks(100)
	}
})

bot.on("path_stop", () => {
	isReached = true;
	console.log("Stopped!")
})

bot.on('whisper', (username, message) => {
	if (username === bot.username) return;
	if (username === botOwner) {
		if (message === "walk2me") {
			const ownerEntity = bot.players[botOwner]?.entity;
			const { x: posX, y: posY, z: posZ } = ownerEntity.position;
			walk2goal(posX, posY, posZ, 2);
		} else if (message === "walkRandomly") {
			if (whileWalk && !isReached) {whileWalk=false; isReached = true};
			var myself = bot.entity;
			rwalkPos = myself.position; // starting pos
			whileWalk = true;
		} else if (message === "stop") {
			bot.pathfinder.stop();
			if (whileWalk && !isReached) {
				whileWalk = false;
				isReached = true;
				walk2goal(rwalkPos.x, rwalkPos.y, rwalkPos.z, 0);
			};
		}
	}
})


bot.on("message", (jsonMsg, position, sender, verified) => {
	let msg = jsonMsg.toString()
	console.log(`[${position}] ${msg}`)
})

// Log errors and kick reasons:
bot.on('kicked', console.log)
bot.on('error', console.log)

/*

I never coded nodeJS before lol so there's my messy code i guess?

pls do not own this code for views. i dont want you to """own""" this code and profit all of it.

only make tutorials how to run this. Clone this to ur repo to do that.

*/