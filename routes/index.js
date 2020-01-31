var express = require('express');
var router = express.Router();
var models  = require('../models');
var MD5 = require("crypto-js/md5");
var Elo = require( 'elo-js' );
var config = require('../config.json');

const Op = models.Sequelize.Op;

const Discord = require('discord.js');
const client = new Discord.Client();
const elo = new Elo();

let questionObj = {
	questions: [
		"**First question, this one is easy... what is your name?**",
		"**Ok, now please tell me your rank?** I can only accept the following responses: `bronze1`, `bronze2`, `bronze3`, `silver1`, `silver2`, `silver3`, `gold1`, `gold2`, `gold3`, `platinum1`, `platinum2`, `platinum3`, `diamond1`, `diamond2`, `diamond3`, `champion1`, `champion2`, `champion3`, `grand_champion`. Please note, I am not the smartest bot in the world so if you do not type this exactly like I have provided, I might blow up! :exploding_head:",
		"**What division are you?** I can only accept the following responses: `1`, `2`, `3`, `4`. If you are a Grand Champion just enter `1` and please go easy on me, I'm just a silly bot :innocent:",
		"**What platform are you playing on?** I will only accept the following responses: `PC`, `Playstation`, `Xbox`, `Switch`.",
		"**What is your gamer ID on that platform?**",
		"**Last question - give me a little biography for you.** Here is a GOOD example: ```Sabrina is the main attacking outlet for her team, she is from San Francisco California and wants to make the RLCSE this season. She likes to make the opposition make mistakes and loves scoring goals from impossible angles``` You get the idea right?"
	],
	questionValidValues: {
		1: ['bronze1', 'bronze2', 'bronze3', 'silver1', 'silver2', 'silver3', 'gold1', 'gold2', 'gold3', 'platinum1', 'platinum2', 'platinum3', 'diamond1', 'diamond2', 'diamond3', 'champion1', 'champion2', 'champion3', 'grand_champion'],
		2: ['1', '2', '3', '4'],
		3: ['pc', 'playstation', 'xbox', 'switch']
	},
	getQuestions: function*() {
		for (let i = 0; i < questionObj.questions.length; i++) {
			yield questionObj.questions[i];
		}
	},
	rankings: {
		'bronze1-1': 0,
		'bronze1-2': 143,
		'bronze1-3': 170,
		'bronze1-4': 189,
		'bronze2-1': 197,
		'bronze2-2': 216,
		'bronze2-3': 236,
		'bronze2-4': 254,
		'bronze3-1': 258,
		'bronze3-2': 276,
		'bronze3-3': 295,
		'bronze3-4': 312,
		'silver1-1': 318,
		'silver1-2': 337,
		'silver1-3': 355,
		'silver1-4': 363,
		'silver2-1': 378,
		'silver2-2': 396,
		'silver2-3': 415,
		'silver2-4': 426,
		'silver3-1': 438,
		'silver3-2': 457,
		'silver3-3': 475,
		'silver3-4': 486,
		'gold1-1': 498,
		'gold1-2': 517,
		'gold1-3': 535,
		'gold1-4': 543,
		'gold2-1': 558,
		'gold2-2': 577,
		'gold2-3': 595,
		'gold2-4': 605,
		'gold3-1': 623,
		'gold3-2': 647,
		'gold3-3': 670,
		'gold3-4': 681,
		'platinum1-1': 703,
		'platinum1-2': 727,
		'platinum1-3': 750,
		'platinum1-4': 761,
		'platinum2-1': 783,
		'platinum2-2': 807,
		'platinum2-3': 830,
		'platinum2-4': 841,
		'platinum3-1': 863,
		'platinum3-2': 887,
		'platinum3-3': 910,
		'platinum3-4': 921,
		'diamond1-1': 943,
		'diamond1-2': 967,
		'diamond1-3': 990,
		'diamond1-4': 1001,
		'diamond2-1': 1023,
		'diamond2-2': 1047,
		'diamond2-3': 1070,
		'diamond2-4': 1080,
		'diamond3-1': 1108,
		'diamond3-2': 1137,
		'diamond3-3': 1165,
		'diamond3-4': 1180,
		'champion1-1': 1208,
		'champion1-2': 1237,
		'champion1-3': 1265,
		'champion1-4': 1280,
		'champion2-1': 1308,
		'champion2-2': 1337,
		'champion2-3': 1365,
		'champion2-4': 1382,
		'champion3-1': 1413,
		'champion3-2': 1434,
		'champion3-3': 1465,
		'champion3-4': 1499,
		'grand_champion-1': 1609,
	}
}

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.on('message', async msg => {
    	let discordUsername = msg.author.username + '#' + msg.author.discriminator;

	  	/**********************************************
	  	 * Next Event
	  	 * ********************************************
	  	 */
		if (msg.content === '!nextevent') {
	    	msg.reply('The next Slips tournament is on 8th February - 9th February January 2020 at 7pm ET.');
	  	}

	  	if (msg.content === '!registeredteams') {
	  		let teamList = await models.Team.findAll();
	  		var message = 'Teams registered right now \n';

	  		for(var team of teamList) {
	  			message += team.name + '\n';
	  		}
	    	msg.reply(message);
	  	}

	  	if (msg.content === '!registeredplayers') {
	  		let playersList = await models.Player.findAll();
	  		var message = 'Players registered right now \n';

	  		for(var player of playersList) {
	  			if(player.registration_status == 1) {
	  				message += player.name + '\n';
	  			}
	  		}
	    	msg.reply(message);
	  	}

	  	/**********************************************
	  	 * Solo Registrations
	  	 * ********************************************
	  	 */
	  	if (msg.content === '!registersolo') {

	  		// create a DM with the message sender
	  		let dm = await msg.author.createDM();

	  		// check in the DB if a player record exists
	  		let playerList = await models.Player.findAll({ where: { discord_username: discordUsername }});
	  		if(playerList.length > 0) {
	  			// if it does, check if player had already registered
	  			let player = playerList[0];
	  			if(player.registration_status) {
	  				await dm.send('Hello, it seems you have already registered!');
	  				return;
	  			}

	  			// otherwise re-start registration process
	  			await dm.send('Hello, thanks for getting in touch. Seems like you started to register but did not finish! So we have to start again!');

	  			let responses = {};

	  			let iterator = questionObj.getQuestions();
				count = 0;
				do { 
					question = iterator.next();
					await dm.send(question.value);

					try {
						var response = await new Promise(async function(resolve, reject) {
							const filter = m => true;
							await dm.awaitMessages(filter, { max: 1, maxMatches: 1, time: 1800000, errors: ['time'] })
							  .then(collected => {
							  	var msg = collected.entries().next().value[1];
							  	switch(count) {
							  		case 1:
							  			if(questionObj.questionValidValues[1].indexOf(msg.content) === -1) {
							  				reject('incorrect_response')
							  			}
							  			break;
							  		case 2: 
							  			if(questionObj.questionValidValues[2].indexOf(msg.content) === -1) {
							  				reject('incorrect_response')
							  			}
							  			break;
							  		case 3:
							  			if(questionObj.questionValidValues[3].indexOf(msg.content.toLowerCase()) === -1) {
							  				reject('incorrect_response')
							  			}
							  			break;
							  	}
							  	resolve(msg.content);
							  })
							  .catch(collected => {
							  	if(collected.size === 0) {
							  		reject('late_response');
							  	}
							  });
						});
						responses[count] = response;

					} catch (err) {
						if(err == 'incorrect_response') {
							await dm.send(":thinking: I don't think I understood what you just wrote! Can you try again or contact the admins and tell them I am malfunctioning again? If you want to try again type `!registersolo` to start over.");
						}
						if(err == 'late_response') {
							await dm.send('Sorry, you did not respond in time! :cry: Message again with !registersolo when you have a bit more time?');
						}
						return;
					}

					count++;

				} while(count < questionObj.questions.length)

				if(Object.keys(responses).length !== questionObj.questions.length) {
					await dm.send('Oops! Something went wrong, please contact the server admins to tell them I am malfunctioning!');
					return;
				}

				player.name = responses[0];
				player.rank = responses[1];
				player.division = responses[2];
				player.gamer_id = responses[3];
				player.gamer_platform = responses[4];
				player.bio = responses[5];
				player.registration_status = true;
				console.log(responses[1] + '-' + responses[2]);
				console.log(questionObj.rankings[responses[1] + '-' + responses[2]])

				player.rating = questionObj.rankings[responses[1] + '-' + responses[2]];
				console.log(player.rating)
				await player.save();
				await dm.send('Thanks, you are now registered!');

	  		// start registration process
	  		} else {

		  		await dm.send('Hello, thanks for getting in touch. So you want to register for the Slips tournament series?');
		  		await dm.send('First - let me tell you how it works!');
		  		await dm.send("**Why do you need to solo register?** Solo registering allows you to play solo matches against other player in our community to build up your win/loss record! The best solo player monthly wins a nice prize.");
		  		await dm.send("But even if you are not interested in competing in our leaderboard, your team captain (or you if you're the captain!) will need YOU to solo register before your account can be added to a team if you intend to compete in our monthly 3v3 $130 cash prize tournaments");
		  		await dm.send("I need to ask you some questions to get you registered... let's get started!");

		  		let player = await models.Player.build({
		  			'discord_username': discordUsername
				}).save();

		  		let responses = {};

	  			let iterator = questionObj.getQuestions();
				count = 0;
				do { 
					question = iterator.next();
					await dm.send(question.value);

					try {
						var response = await new Promise(async function(resolve, reject) {
							const filter = m => true;
							await dm.awaitMessages(filter, { max: 1, maxMatches: 1, time: 180000, errors: ['time'] })
							  .then(collected => {
							  	var msg = collected.entries().next().value[1];
							  	switch(count) {
							  		case 1:
							  			if(questionObj.questionValidValues[1].indexOf(msg.content) === -1) {
							  				reject('incorrect_response')
							  			}
							  			break;
							  		case 2: 
							  			if(questionObj.questionValidValues[2].indexOf(msg.content) === -1) {
							  				reject('incorrect_response')
							  			}
							  			break;
							  		case 3:
							  			if(questionObj.questionValidValues[3].indexOf(msg.content.toLowerCase()) === -1) {
							  				reject('incorrect_response')
							  			}
							  			break;
							  	}
							  	resolve(msg.content);
							  })
							  .catch(collected => {
							  	if(collected.size === 0) {
							  		reject('late_response');
							  	}
							  });
						});
						responses[count] = response;

					} catch (err) {
						if(err == 'incorrect_response') {
							await dm.send(":thinking: I don't think I understood what you just wrote! Can you try again or contact the admins and tell them I am malfunctioning again? If you want to try again type `!registersolo` to start over.");
						}
						if(err == 'late_response') {
							await dm.send('Sorry, you did not respond in time! :cry: Message again with !registersolo when you have a bit more time?');
						}
						return;
					}

					count++;

				} while(count < questionObj.questions.length)

				if(Object.keys(responses).length !== questionObj.questions.length) {
					await dm.send('Oops! Something went wrong, please contact the server admins to tell them I am malfunctioning!');
					return;
				}

				player.name = responses[0];
				player.rank = responses[1];
				player.division = responses[2];
				player.gamer_platform = responses[3];
				player.gamer_id = responses[4];
				player.bio = responses[5];
				player.rating = questionObj.rankings[responses[1] + '-' + responses[2]];
				player.registration_status = true;
				await player.save();
				await dm.send('Thanks, you are now registered!');
		  		
		  	}
	  	}

	  	/**********************************************
	  	 * Input Solo Result
	  	 * ********************************************
	  	 */
	  	if (msg.content === '!inputsoloresult') {

	  		let allowedUsernames = ['husainfazel#0001', '6_16Fun#2786','AlfredoSaucin#9232','Buttknuckle#9154','Imbaer#1337', 'Pubbies_Give_Me_Sniffles#4283', 'TheGJ90#4290'];

	  		if(allowedUsernames.indexOf(discordUsername) === -1) {
	  			await msg.reply('You are not allowed to use this command! :angry:');
	  			return;
	  		}

	  		let dm = await msg.author.createDM();

	  		try {
	  			await dm.send("**What is player one's discord username? Including the discriminator (e.g. 6_16Fun#2786)**")
				var player1 = await new Promise(async function(resolve, reject) {
					const filter = m => true;
					await dm.awaitMessages(filter, { max: 1, maxMatches: 1, time: 180000, errors: ['time'] })
					  .then(async collected => {
					  	var player1 = collected.entries().next().value[1].content;
					  	let playerList = await models.Player.findAll({ where: { discord_username: player1 }});
	  					if(playerList.length === 0) {
	  						reject('player_missing')
	  					}
					  	resolve(playerList[0]);
					  })
					  .catch(collected => {
					  	if(collected.size === 0) {
					  		reject('late_response');
					  	}
					  });
				});
			} catch (err) {
				if(err == 'player_missing') {
					await dm.send('Sorry, that player is not registered! :cry:');
				}
				if(err == 'late_response') {
					await dm.send('Sorry, you did not respond in time! :cry:');
				}
				return;
			}

			try {
	  			await dm.send("**What is player two's discord username? Including the discriminator (e.g. 6_16Fun#2786)**")
				var player2 = await new Promise(async function(resolve, reject) {
					const filter = m => true;
					await dm.awaitMessages(filter, { max: 1, maxMatches: 1, time: 180000, errors: ['time'] })
					  .then(async collected => {
					  	var player2 = collected.entries().next().value[1].content;
					  	let playerList = await models.Player.findAll({ where: { discord_username: player2 }});
	  					if(playerList.length === 0) {
	  						reject('player_missing')
	  					}
					  	resolve(playerList[0]);
					  })
					  .catch(collected => {
					  	if(collected.size === 0) {
					  		reject('late_response');
					  	}
					  });
				});
			} catch (err) {
				if(err == 'player_missing') {
					await dm.send('Sorry, that player is not registered! :cry:');
				}
				if(err == 'late_response') {
					await dm.send('Sorry, you did not respond in time! :cry:');
				}
				return;
			}

			try {
	  			await dm.send("**Who won? `1` or `2`**")
				var gameResult = await new Promise(async function(resolve, reject) {
					const filter = m => true;
					await dm.awaitMessages(filter, { max: 1, maxMatches: 1, time: 180000, errors: ['time'] })
					  .then(async collected => {
					  	var gameResult = collected.entries().next().value[1].content;
					  	console.log(gameResult)
					  	if(['1','2'].indexOf(gameResult) === -1) {
					  		reject('wrong_response');
					  	}
					  	resolve(gameResult);
					  })
					  .catch(collected => {
					  	if(collected.size === 0) {
					  		reject('late_response');
					  	}
					  });
				});
			} catch (err) {
				if(err == 'wrong_response') {
					await dm.send('You did not enter a correct result! :cry:');
				}
				if(err == 'late_response') {
					await dm.send('Sorry, you did not respond in time! :cry:');
				}
				return;
			}

			var oldPlayer1Rating = player1.rating;
			var oldPlayer2Rating = player2.rating;

			if(gameResult === '1') {
				player1.played = player1.played + 1;
				player2.played = player2.played + 1;
				player1.wins = player1.wins + 1;
				player1.rating = elo.ifWins(player1.rating, player2.rating);
				player2.rating = elo.ifLoses(player2.rating, player1.rating);
			}

			if(gameResult === '2') {
				player1.played = player1.played + 1;
				player2.played = player2.played + 1;
				player2.wins = player2.wins + 1;
				player1.rating = elo.ifLoses(player1.rating, player2.rating)
				player2.rating = elo.ifWins(player2.rating, player1.rating)
			}

			await player1.save();
			await player2.save();

			dm.send('Match has been inputted. Here are new ratings for these players - ' 
				+ player1.discord_username + ': ' + player1.rating + ' (old rating: '  + oldPlayer1Rating + ') and ' 
				+ player2.discord_username + ': ' + player2.rating + ' (old rating: '  + oldPlayer2Rating + ')');

	  	}

	  	/**********************************************
	  	 * Solo Rankings
	  	 * ********************************************
	  	 */
	  	if (msg.content.startsWith('!solorankings')) {
	    	let rankDivs = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'champion', 'grand_champion'];
	    	let msgParts = msg.content.split(' ');

	    	if(msgParts.length < 2) {
	    		msg.reply('Sorry, I am not a super AI so cannot read your mind, use this command like: `!solorankings <division>` where division is one of `bronze`, `silver`, `gold`, `platinum`, `diamond`, `champion`, `grand_champion`');
	    		return;
	    	}

	    	if(rankDivs.indexOf(msgParts[1]) === -1) {
	    		msg.reply('Sorry, this silly bot did not understand you! :stuck_out_tongue_winking_eye: use this command like: `!solorankings <division>` where division is one of `bronze`, `silver`, `gold`, `platinum`, `diamond`, `champion`, `grand_champion`');
	    		return;
	    	}

	    	let playerList = await models.Player.findAll({
	    	 	where: { 
	    	 		rank: {
	    				[Op.like]: msgParts[1] + '%' 
	    			},
	    			played: {
	    				[Op.gte]: 5
	    			}
	    		},
	    		order: [
				    ['rating', 'DESC']
				]
	    	});

	    	let formalDiv = msgParts[1].charAt(0).toUpperCase() + msgParts[1].slice(1);
	    	if(playerList.length > 1) {
	    		let count = 1;
	    		let m = '';
	    		let pNameLen = 0
		    	for(var player of playerList) {
		    		pNameLen = (player.discord_username.length > pNameLen) ? player.discord_username.length + 3 : pNameLen;
		    	}
		    	for(var player of playerList) {
                    numDashes = pNameLen - (player.discord_username.length + 1);
		    		m +=  count + ' --- ' + player.discord_username + ' ' ;
		    		for(var i = 0; i < numDashes; i++) {
		    			m+= '-';
		    		}
		    		m += " ";
		    		m += player.rating + '\n';
		    		count++;
		    	}
		    	msg.reply('\n**Solo Rankings for ' + formalDiv + '**```' + m +'```');
	    	} else {
	    		msg.reply('\n**Solo Rankings for ' + formalDiv + '**\n' +'No players have played enough matches to be ranked on this leaderboard! :cry:')
	    	}

		}

		/**********************************************
	  	 * Team Registrations
	  	 * ********************************************
	  	 */
	  	if (msg.content === '!registerteam') {

	  		// create a DM with the message sender
	  		let dm = await msg.author.createDM();

	  		// check in the DB if a player record exists
	  		let playerList = await models.Player.findAll({ where: { discord_username: discordUsername }});
	  		if(playerList.length === 0) {
	  			await dm.send('You are not registered as player in our system, please call `!registersolo` first!');
	  			return;
	  		}	  			

	  		let callingPlayer = playerList[0];

	  		// check if this player is in a team
	  		let inTeam = await models.Team.findAll({
	  			where: {
	  				[Op.or]: [
	  					{ player_one_id: callingPlayer.id }, 
	  					{ player_two_id: callingPlayer.id },
	  					{ player_three_id: callingPlayer.id },
	  				]
	  			}
	  		});

	  		if(inTeam.length > 0) {
	  			await dm.send('You are already part of a team, you need to contact an admin to discuss the matter!');
	  			return;
	  		}

	  		try {
	  			await dm.send("**What is your 1st team member's Discord username (including the #1234 part please!)**")
				var playerOne = await new Promise(async function(resolve, reject) {
					const filter = m => true;
					await dm.awaitMessages(filter, { max: 1, maxMatches: 1, time: 180000, errors: ['time'] })
					  .then(async collected => {
					  	var discordUsername = collected.entries().next().value[1].content;
					  	if(discordUsername == callingPlayer.discord_username) {
					  		reject('registering_self');
					  	}
					  	let p1 = await models.Player.findAll({ where: { discord_username: discordUsername }});
					  	if(p1.length > 0) {
					  		resolve(p1[0]);
					  	} else {
					  		reject('missing_player');
					  	}
					  })
					  .catch(collected => {
					  	if(collected.size === 0) {
					  		reject('late_response');
					  	}
					  });
				});
			} catch (err) {
				if(err == 'registering_self') {
					await dm.send('You cannot register yourself! :cry:');
				}
				if(err == 'missing_player') {
					await dm.send('I could not find the player you mentioned? Are you sure they are registered in our system? :cry:');
				}
				if(err == 'late_response') {
					await dm.send('Sorry, you did not respond in time! :cry:');
				}
				return;
			}

			try {
	  			await dm.send("**What is your 2nd team member's Discord username (including the #1234 part please!)**")
				var playerTwo = await new Promise(async function(resolve, reject) {
					const filter = m => true;
					await dm.awaitMessages(filter, { max: 1, maxMatches: 1, time: 180000, errors: ['time'] })
					  .then(async collected => {
					  	var discordUsername = collected.entries().next().value[1].content;

					  	if(discordUsername === playerOne.discord_username) {
					  		reject('duplicate_name');
					  	}
					  	if(discordUsername == callingPlayer.discord_username) {
					  		reject('registering_self');
					  	}

					  	let p2 = await models.Player.findAll({ where: { discord_username: discordUsername }});
					  	if(p2.length > 0) {
					  		resolve(p2[0]);
					  	} else {
					  		reject('missing_player');
					  	}
					  })
					  .catch(collected => {
					  	if(collected.size === 0) {
					  		reject('late_response');
					  	}
					  });
				});
			} catch (err) {
				if(err == 'registering_self') {
					await dm.send('You cannot register yourself! :cry:');
				}
				if(err == 'duplicate_name') {
					await dm.send('You already tried to register this user!');
				}
				if(err == 'missing_player') {
					await dm.send('I could not find the player you mentioned? Are you sure they are registered in our system? :cry:');
				}
				if(err == 'late_response') {
					await dm.send('Sorry, you did not respond in time! :cry:');
				}
				return;
			}

			try {
	  			await dm.send("**What is your team name?**")
				var teamName = await new Promise(async function(resolve, reject) {
					const filter = m => true;
					await dm.awaitMessages(filter, { max: 1, maxMatches: 1, time: 180000, errors: ['time'] })
					  .then(async collected => {
					  	var teamName = collected.entries().next().value[1].content;
					  	resolve(teamName);
					  })
					  .catch(collected => {
					  	if(collected.size === 0) {
					  		reject('late_response');
					  	}
					  });
				});
			} catch (err) {
				if(err == 'late_response') {
					await dm.send('Sorry, you did not respond in time! :cry:');
				}
				return;
			}

			try {
	  			await dm.send("**Now upload your team logo (it must be 750px x 750px)**")
				var logo = await new Promise(async function(resolve, reject) {
					const filter = m => true;
					await dm.awaitMessages(filter, { max: 1, maxMatches: 1, time: 180000, errors: ['time'] })
					  .then(async collected => {
					  	var msg = collected.entries().next().value[1];
					  	var attachment = msg.attachments.entries().next().value[1];
					  	if(attachment) {
					  		console.log(attachment.url);
					  		resolve(attachment.url)
					  	} else {
					  		reject('no_image');
					  	}

					  })
					  .catch(collected => {
					  	if(collected.size === 0) {
					  		reject('late_response');
					  	}
					  });
				});
			} catch (err) {
				if(err == 'no_image') {
					await dm.send("Sorry, I do not think you uploaded an image. Try again! :cry:");
				}
				if(err == 'late_response') {
					await dm.send('Sorry, you did not respond in time! :cry:');
				}
				return;
			}

			let rating = (callingPlayer.rating + playerOne.rating + playerTwo.rating) / 3;
 
			let team = await models.Team.build({
	  			'name': teamName,
	  			'logo': logo,
	  			'player_one_id': callingPlayer.id,
	  			'player_two_id': playerOne.id,
	  			'player_three_id': playerTwo.id,
	  			'rating': rating
			}).save();

			await dm.send('Your team is registered, start playing some matches!')

	  	}

	  	/**********************************************
	  	 * Input Team Result
	  	 * ********************************************
	  	 */
	  	if (msg.content === '!inputteamresult') {

	  		let allowedUsernames = ['husainfazel#0001', '6_16Fun#2786','AlfredoSaucin#9232','Buttknuckle#9154','Imbaer#1337', 'Pubbies_Give_Me_Sniffles#4283', 'TheGJ90#4290'];

	  		if(allowedUsernames.indexOf(discordUsername) === -1) {
	  			await msg.reply('You are not allowed to use this command! :angry:');
	  			return;
	  		}

	  		let dm = await msg.author.createDM();

	  		try {
	  			await dm.send("**What is Team One's Name (as on leaderboard)**")
				var team1 = await new Promise(async function(resolve, reject) {
					const filter = m => true;
					await dm.awaitMessages(filter, { max: 1, maxMatches: 1, time: 180000, errors: ['time'] })
					  .then(async collected => {
					  	var team1 = collected.entries().next().value[1].content;
					  	let teamList = await models.Team.findAll({ where: { name: team1 }});
	  					if(teamList.length === 0) {
	  						reject('team_missing')
	  					}
					  	resolve(teamList[0]);
					  })
					  .catch(collected => {
					  	if(collected.size === 0) {
					  		reject('late_response');
					  	}
					  });
				});
			} catch (err) {
				if(err == 'team_missing') {
					await dm.send('Sorry, that team is not registered! :cry:');
				}
				if(err == 'late_response') {
					await dm.send('Sorry, you did not respond in time! :cry:');
				}
				return;
			}

			try {
	  			await dm.send("**What is Team Two's Name (as on leaderboard)**")
				var team2 = await new Promise(async function(resolve, reject) {
					const filter = m => true;
					await dm.awaitMessages(filter, { max: 1, maxMatches: 1, time: 180000, errors: ['time'] })
					  .then(async collected => {
					  	var team2 = collected.entries().next().value[1].content;
					  	let teamList = await models.Team.findAll({ where: { name: team2 }});
	  					if(teamList.length === 0) {
	  						reject('team_missing')
	  					}
					  	resolve(teamList[0]);
					  })
					  .catch(collected => {
					  	if(collected.size === 0) {
					  		reject('late_response');
					  	}
					  });
				});
			} catch (err) {
				if(err == 'team_missing') {
					await dm.send('Sorry, that team is not registered! :cry:');
				}
				if(err == 'late_response') {
					await dm.send('Sorry, you did not respond in time! :cry:');
				}
				return;
			}

			try {
	  			await dm.send("**Who won? `1` or `2`**")
				var gameResult = await new Promise(async function(resolve, reject) {
					const filter = m => true;
					await dm.awaitMessages(filter, { max: 1, maxMatches: 1, time: 180000, errors: ['time'] })
					  .then(async collected => {
					  	var gameResult = collected.entries().next().value[1].content;
					  	console.log(gameResult)
					  	if(['1','2'].indexOf(gameResult) === -1) {
					  		reject('wrong_response');
					  	}
					  	resolve(gameResult);
					  })
					  .catch(collected => {
					  	if(collected.size === 0) {
					  		reject('late_response');
					  	}
					  });
				});
			} catch (err) {
				if(err == 'wrong_response') {
					await dm.send('You did not enter a correct result! :cry:');
				}
				if(err == 'late_response') {
					await dm.send('Sorry, you did not respond in time! :cry:');
				}
				return;
			}

			var oldTeam1Rating = team1.rating;
			var oldTeam2Rating = team2.rating;

			if(gameResult === '1') {
				team1.played = team1.played + 1;
				team2.played = team2.played + 1;
				team1.wins = team1.wins + 1;
				team1.rating = elo.ifWins(team1.rating, team2.rating);
				team2.rating = elo.ifLoses(team2.rating, team1.rating);
			}

			if(gameResult === '2') {
				team1.played = team1.played + 1;
				team2.played = team2.played + 1;
				team2.wins = team2.wins + 1;
				team1.rating = elo.ifLoses(team1.rating, team2.rating)
				team2.rating = elo.ifWins(team2.rating, team1.rating)
			}

			await team1.save();
			await team2.save();

			dm.send('Match has been inputted. Here are new ratings for these teams - ' 
				+ team1.name + ': ' + team1.rating + ' (old rating: '  + oldTeam1Rating + ') and ' 
				+ team2.name + ': ' + team2.rating + ' (old rating: '  + oldTeam2Rating + ')');

	  	}

	  	/**********************************************
	  	 * Team Rankings
	  	 * ********************************************
	  	 */
	  	if (msg.content.startsWith('!teamrankings')) {

	    	let teamList = await models.Team.findAll({
	    	 	where: { 
	    			played: {
	    				[Op.gte]: 5
	    			}
	    		},
	    		order: [
				    ['rating', 'DESC']
				]
	    	});

	    	if(teamList.length > 1) {
	    		let count = 1;
	    		let m = '';
	    		let tNameLen = 0
		    	for(var team of teamList) {
		    		tNameLen = (team.name.length > tNameLen) ? team.name.length + 3 : tNameLen;
		    	}
		    	for(var team of teamList) {
                    numDashes = tNameLen - (team.name.length + 1);
		    		m +=  count + ' --- ' + team.name + ' ' ;
		    		for(var i = 0; i < numDashes; i++) {
		    			m+= '-';
		    		}
		    		m += " ";
		    		m += team.rating + ' ( W' + team.wins + ' / P' + team.played + ' )\n';
		    		count++;
		    	}
		    	msg.reply('\n**Team Rankings**```' + m +'```');
	    	} else {
	    		msg.reply('\n**No teams have played enough matches to be ranked on the leaderboard! :cry:')
	    	}

		}
	  
	});

});

client.login(config.discord_token);

module.exports = router;
