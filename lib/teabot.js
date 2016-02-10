'use strict';

//from https://scotch.io/tutorials/building-a-slack-bot-with-node-js-and-chuck-norris-super-powers

var util = require("util"),
	path = require("path"),
	fs = require("fs"),
	//SQLite = require("sqlite3").verbose,
	Bot = require("slackbots"),
	TeaRoundManager = require("../lib/teaRoundManager"),
	teaRoundManager = new TeaRoundManager(),
	teaQuotes = require("../data/quotes.json");

var TeaBot = function Constructor(settings){
	this.settings = settings;
	this.settings.name = this.settings.name || "teabot";


	this.help =  {
		'run a tea round': {
			"Keyword": "I want to make tea",
			"Description": "Allows you to start a tea round with you as tea maker. I will then collect tea orders via DMs for 3 minutes then return the full order to you"
		}
	};

	this.keywords = ['I want to make tea', 'quote me'];
	//this.dbPath = settings.dbPath || path.resolve(process.cwd(), "data", "teabot.db");
	//this.db = null;
}

// inherits methods and properties from the Bot constructor
util.inherits(TeaBot, Bot);

TeaBot.prototype.run = function () {
    TeaBot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
}
TeaBot.prototype._onStart = function(){
	this._loadBotUser();
	//this._connectDb();
	this._firstRunCheck();

	console.log(this.name + " has been started.");
}
TeaBot.prototype._loadBotUser = function(){
	var self = this;
	this.user = this.users.filter(function(user){
		return user.name === self.name;
	})[0];
}
/*TeaBot.prototype._connectDb = function () {
    if (!fs.existsSync(this.dbPath)) {
        console.error('Database path ' + '"' + this.dbPath + '" does not exists or it\'s not readable.');
        process.exit(1);
    }

    this.db = new SQLite.Database(this.dbPath);
}*/
TeaBot.prototype._firstRunCheck = function(){
	var self = this;
	self._welcomeMessage();
}
TeaBot.prototype._welcomeMessage = function(){
	var channel = this._getHWteaChannel();
	//this.postMessageToChannel(channel.name, 'Hello I am here', {as_user: true});

	//var channel = this.channels[0].name;
	//this.postMessageToChannel(this.channels[0].name, 'Hello I am here',{as_user: true});
}
TeaBot.prototype._onMessage = function(message){

	if(this._isUsefulMessage(message)){
		return false;
	}

	var channel = this._getChannelById(message.channel);

	if(this._isChatMessage(message) && 			//it's a chat message (not dm)
		this._isPrivateMessage(message)  && 	//it's a private message
		!this._isFromTeaBot(message) && 		//the massage is not from teabot
		teaRoundManager._isTeaRoundOpen() 		//a tea round has been already started
	){
		//collect messages
		console.log("it's an order");
		teaRoundManager._collectTeaOrder(message);

	}else if(this._isChatMessage(message) &&	//it's a chat message (not dm)
		this._isTeaRoundMessage(message) &&		//is it a tea round message
		!this._isFromTeaBot(message)			//the message is not from teabot
	){
		console.log("it's a tea round request");
		this._manageTeaRound(message, channel);
	
	//if it's a direct message and self.interval is set to 0 then we're taking tea orders!
	}else if(this._isChatMessage(message) &&	//it's a chat message (not dm)
		this._isChannelConversation(message) &&	//
		!this._isFromTeaBot(message) &&			//the message is not from teabot
		this._isAskingForQuote(message)		//it's asking for a quote
	){
		console.log("it's asking for a quote");
		this._getQuotes(message);
	
	}else if(this._isChatMessage(message) &&	//it's a chat message (not dm)
		this._isChannelConversation(message) &&	//
		!this._isFromTeaBot(message) &&			//the message is not from teabot
		this._isMentioningTeaBot(message)		//it's mentioning the teabot
	){
		console.log("it's just a normal mention let's send some help");
		this._replyWithMsg(message);
	}
}
TeaBot.prototype._isUsefulMessage = function(message){
	return message.type == "hello" ||
		message.type == "reconnect_url" ||
		message.type == "presence_change" ||
		message.type == "user_typing";
}
TeaBot.prototype._isChatMessage = function(message){
	return message.type === "message" && Boolean(message.text);
}
TeaBot.prototype._isChannelConversation = function(message){
	return typeof message.channel === "string" && 
		message.channel[0] === "C";
}
TeaBot.prototype._isPrivateMessage = function(message){
	return typeof message.channel === "string" && 
		message.channel[0] === "D";
}
TeaBot.prototype._isTeaRoundMessage = function(message){
	return message.text.toLowerCase().indexOf("i want to make tea") > -1;
}
TeaBot.prototype._isAskingForQuote = function(message){
	return message.text.toLowerCase().indexOf("quote") > -1;
}
TeaBot.prototype._isFromTeaBot = function(message){
	return ( (message.user === this.user.id) || (message.username !== undefined) );
}

TeaBot.prototype._isMentioningTeaBot = function(message){
	return message.text.toLowerCase().indexOf(this.name) > -1;
}

TeaBot.prototype._getChannelById = function(channelId){
	return this.channels.filter(function (item) {
		return item.id === channelId;
	})[0];
}
TeaBot.prototype._getUserById = function(user){
	return this.users.filter(function (item) {
		return item.id === user;
	})[0];
}
//temporary only post in hwteadev
TeaBot.prototype._getHWteaChannel = function(){
	return this.channels.filter(function (item) {
		if(item.is_member === true){
			return item.name;
		}
	})[0];
}
TeaBot.prototype._getQuotes = function(){
	var allQuotes = teaQuotes.teaquotes,
		quoteObj = allQuotes[Math.floor(Math.random() * allQuotes.length)],
		quote = null;
	quote = "\"" + quoteObj.text + "\", " + quoteObj.author;
	return quote;
}
TeaBot.prototype._replyWithMsg = function(originalMessage){
	var self = this,
		reply = null,
		channel = self._getChannelById(originalMessage.channel),
		help = self._sendHelp();
	self.postMessageToChannel(channel.name, help, {as_user:true});
}
TeaBot.prototype._sendHelp = function(){
	var msg = "Sorry, I don't know what you mean, you can enter the following:";
	console.log(this.keywords.legth);
	for(var i = 0; i < this.keywords.legth; i++){
		console.log(this.keywords[i]);
		msg += ' `' + this.keywords[i] + '`';
	}
	return msg;
}
TeaBot.prototype._manageTeaRound = function(message, channel){
	teaRoundManager.setTeaBot(this);
	teaRoundManager._manageTeaRound(message, channel);
}

module.exports = TeaBot;