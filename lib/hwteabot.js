'use strict';

//from https://scotch.io/tutorials/building-a-slack-bot-with-node-js-and-chuck-norris-super-powers

var util = require("util"),
	path = require("path"),
	fs = require("fs"),
	SQLite = require("sqlite3").verbose,
	Bot = require("slackbots"),
	TeaRoundManager = require("./TeaRoundManager.js");

var HWteaBot = function Constructor(settings){
	this.settings = settings;
	this.settings.name = this.settings.name || "hwteabot";
	//this.dbPath = settings.dbPath || path.resolve(process.cwd(), "data", "hwteabot.db");

	this.user = null;
	//this.db = null;
}

// inherits methods and properties from the Bot constructor
util.inherits(HWteaBot, Bot);

HWteaBot.prototype.run = function () {
    HWteaBot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
}
HWteaBot.prototype._onStart = function(){
	this._loadBotUser();
	//this._connectDb();
	this._firstRunCheck();

	console.log(this.name + " has been started.");
}
HWteaBot.prototype._loadBotUser = function(){
	var self = this;
	this.user = this.users.filter(function(user){
		return user.name === self.name;
	})[0];
}
/*HWteaBot.prototype._connectDb = function () {
    if (!fs.existsSync(this.dbPath)) {
        console.error('Database path ' + '"' + this.dbPath + '" does not exists or it\'s not readable.');
        process.exit(1);
    }

    this.db = new SQLite.Database(this.dbPath);
}*/
HWteaBot.prototype._firstRunCheck = function(){
	var self = this;
	self._welcomeMessage();
}
HWteaBot.prototype._welcomeMessage = function(){
	var channel = this._getHWteaChannel();
	//this.postMessageToChannel(channel.name, 'Hello I am here', {as_user: true});

	//var channel = this.channels[0].name;
	//this.postMessageToChannel(this.channels[0].name, 'Hello I am here',{as_user: true});
}
HWteaBot.prototype._onMessage = function(message){
	if(this._isChatMessage(message) &&
		this._isChannelConversation(message) &&
		!this._isFromHWteaBot(message) &&
		this._isMentioningHWteaBot(message)
	){
		this._replyWithMsg(message);
	}
}
HWteaBot.prototype._isChatMessage = function(message){
	return message.type === "message" && Boolean(message.text);
}
HWteaBot.prototype._isChannelConversation = function(message){
	return typeof message.channel === "string" && 
		message.channel[0] === "C";
}
HWteaBot.prototype._isFromHWteaBot = function(message){
	return message.user === this.user.id;
}
HWteaBot.prototype._isMentioningHWteaBot = function(message){
	return message.text.toLowerCase().indexOf('hwtea') > -1 ||
		message.text.toLowerCase().indexOf(this.name) > -1;
}
HWteaBot.prototype._replyWithMsg = function(originalMessage){
	var self = this,
	channel = self._getChannelById(originalMessage.channel);

	//self.postMessageToChannel(channel.name, 'replying back with something', {as_user:true});

	if(originalMessage.text.toLowerCase().indexOf("I want to make tea") > -1){
		var teaRoundManager = new TeaRoundManager(this, originalMessage);
		teaRoundManager.startTeaRound();
	}
}
HWteaBot.prototype._getChannelById = function(channelId){
	return this.channels.filter(function (item) {
		return item.id === channelId;
	})[0];
}
//temporary only post in hwteadev
HWteaBot.prototype._getHWteaChannel = function(){
	return this.channels.filter(function (item) {
		if(item.is_member === true){
			return item.name;
		}
	})[0];
}

module.exports = HWteaBot;