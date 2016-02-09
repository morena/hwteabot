'use strict';

//from https://scotch.io/tutorials/building-a-slack-bot-with-node-js-and-chuck-norris-super-powers

var util = require("util"),
	path = require("path"),
	fs = require("fs"),
	//SQLite = require("sqlite3").verbose,
	Bot = require("slackbots"),
	TeaRoundManager = require("../lib/teaRoundManager"),
	teaRoundManager = new TeaRoundManager();

var TeaBot = function Constructor(settings){
	this.settings = settings;
	this.settings.name = this.settings.name || "teabot";
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

	if( message.type == "hello" ||
		message.type == "reconnect_url" ||
		message.type == "presence_change" ||
		message.type == "user_typing"
	){
		return false;
	}

	var channel = this._getChannelById(message.channel);

	if(this._isChatMessage(message) &&
		this._isPrivateMessage(message)  &&
		!this._isFromTeaBot(message) &&
		teaRoundManager._isTeaRoundOpen()
	){
		//collect messages
		console.log("it's an order");
		teaRoundManager._collectTeaOrder(message);

	}else if(this._isChatMessage(message) &&
		this._isTeaRoundMessage(message) &&
		!this._isFromTeaBot(message)
	){
		console.log("it's a tea round request");
		this._manageTeaRound(message, channel);
	
	//if it's a direct message and self.interval is set to 0 then we're taking tea orders!
	}else if(this._isChatMessage(message) &&
		this._isChannelConversation(message) &&
		!this._isFromTeaBot(message) &&
		this._isMentioningTeaBot(message)
	){
		console.log("it's just a normal mention");
		this._replyWithMsg(message);
	}
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
	return message.text.toLowerCase().indexOf("i want to make hwtea") > -1;
}
TeaBot.prototype._isFromTeaBot = function(message){
	return ( (message.user === this.user.id) || (message.username !== undefined) );
}

TeaBot.prototype._isMentioningTeaBot = function(message){
	return message.text.toLowerCase().indexOf('hwtea') > -1 ||
		message.text.toLowerCase().indexOf(this.name) > -1;
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

TeaBot.prototype._replyWithMsg = function(originalMessage){
	var self = this,
		reply = null,
		channel = self._getChannelById(originalMessage.channel);

	self.postMessageToChannel(channel.name, 'Thank you for talking to me', {as_user:true});
}
TeaBot.prototype._getQuotes = function(){

}
TeaBot.prototype._manageTeaRound = function(message, channel){
	teaRoundManager.setTeaBot(this);
	teaRoundManager._manageTeaRound(message, channel);
}

module.exports = TeaBot;