'use strict';

//from https://scotch.io/tutorials/building-a-slack-bot-with-node-js-and-chuck-norris-super-powers

var util = require("util"),
	path = require("path"),
	fs = require("fs"),
	//SQLite = require("sqlite3").verbose,
	Bot = require("slackbots");

var TeaBot = function Constructor(settings){
	this.settings = settings;
	this.settings.name = this.settings.name || "teabot";
	//this.dbPath = settings.dbPath || path.resolve(process.cwd(), "data", "teabot.db");

	this.user = null;
	this.interval = 0;
	this.setIntervId = 0;
	this.teaOrder = [];
	this.teaMaker = null;
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
		this._isTeaRoundOpen()
	){
		//collect messages
		console.log("it's an order");
		this._collectTeaOrder(message);

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
TeaBot.prototype._replyWithMsg = function(originalMessage){
	var self = this,
		reply = null,
		channel = self._getChannelById(originalMessage.channel);

	self.postMessageToChannel(channel.name, 'Thank you for talking to me', {as_user:true});
}
TeaBot.prototype._runTimer =function(self, channel) {
	var message = "Your order is:",
		reply = '',
		interval = self.interval,
		teaMaker = self.teaMaker;

	if(interval === 0){
		console.log("The tea round has started!");
		console.log("And the Tea Maker is " + teaMaker.name);
		reply = '@here, @'+teaMaker.name+ ' wants to make hwtea! You now have 3 minutes to send me your tea order in a DM';
		self.postMessageToChannel(channel.name, reply, {as_user:true});
		interval++;
		self.interval = interval;
	   	setTimeout(self._runTimer.bind(self, channel), 180000); //180000); //3 minutes

	   	//setTimeout(self._runTimer.bind(undefined, self, channel), 20000); //180000); //3 minutes
	}else{
		message += self._returnTeaOrderAsString(message);
		self.postMessageToUser( teaMaker.name, message );
		//destroy order
		self.teaOrder = [];
		console.log("The tea round has ended!");
		reply = '@here, the tea round is finished! @'+teaMaker.name+ ' has got you order, your tea is coming soon!';
		self.postMessageToChannel(channel.name, reply, {as_user:true});
		self.interval = 0;
	}
}
TeaBot.prototype._isTeaRoundOpen = function(){
	if (this.interval === 1){
		return true;
	}else{
		return false;
	}
}
TeaBot.prototype._manageTeaRound = function(originalMessage, channel){
	//post a message to say somebody has volunteered to make a tea round
	var self = this;
		self.teaMaker = this._getUserById(originalMessage.user);

	//now wait 3 minutes for people to send their order
	self._runTimer(self,channel);
}
TeaBot.prototype._collectTeaOrder = function(message){
	var self = this,
		user = self._getUserById(message.user),
		confirmationMsg = "Thank you your order of\"" + message.text + "\"has been received. Your tea should arrive soon. But don't count on it.";
	
	if(undefined === self.teaOrder[user]){
		self.teaOrder[user.name] = message.text;
	}else{
		confirmationMsg = 'You have already placed an order and you cannot place another one';
	}
	//confirm order has been taken
	self.postMessageToUser( user.name, confirmationMsg );

}
TeaBot.prototype._returnTeaOrderAsString = function(message){
	var self = this,
		orderObj = self.teaOrder;
		console.log(self.teaOrder);
	var	length = self.teaOrder.length,
		order = null,
		orderMaker = null;
	if(length.length === 0){
		return "You had no orders coming through";
	}else{
		for( var prop in orderObj){
			orderMaker = prop;
			order = orderObj[prop];
			message+=' ' + orderMaker + ' has ordered ' + order;
		}
		return message;
	}
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

}


module.exports = TeaBot;