'use strict';

var TeaRoundManager = function Constructor(){
	
	this.interval = 0;
	this.setIntervId = 0;
	this.teaOrder = [];
	this.teaMaker = null;
	this.teabot = null;
}

TeaRoundManager.prototype.init = function () {
    console.log("hello");
}
TeaRoundManager.prototype.setTeaBot = function (teabot) {
    this.teabot = teabot;
    //console.log(this.teabot);
}
TeaRoundManager.prototype._isTeaRoundOpen = function(){
	if (this.interval === 1){
		return true;
	}else{
		return false;
	}
}
TeaRoundManager.prototype._runTimer =function(teabot, channel) {
	var message = "Your order is:",
		reply = '',
		self = this,
		interval = self.interval,
		teaMaker = self.teaMaker;

	if(interval === 0){
		console.log("The tea round has started!");
		console.log("And the Tea Maker is " + teaMaker.name);
		reply = '@here, @'+teaMaker.name+ ' wants to make hwtea! You now have 3 minutes to send me your tea order in a DM';
		teabot.postMessageToChannel(channel.name, reply, {as_user:true});
		interval++;
		self.interval = interval;
	   	setTimeout(self._runTimer.bind(self, teabot, channel), 180000); //180000); //3 minutes

	   	//setTimeout(self._runTimer.bind(undefined, self, channel), 20000); //180000); //3 minutes
	}else{
		message += self._returnTeaOrderAsString(message);
		teabot.postMessageToUser( teaMaker.name, message );
		//destroy order
		self.teaOrder = [];
		console.log("The tea round has ended!");
		reply = '@here, the tea round is finished! @'+teaMaker.name+ ' has got you order, your tea is coming soon!';
		teabot.postMessageToChannel(channel.name, reply, {as_user:true});
		self.interval = 0;
	}
}
TeaRoundManager.prototype._manageTeaRound = function(originalMessage, channel){
	//post a message to say somebody has volunteered to make a tea round
	var self = this;
		self.teaMaker = this.teabot._getUserById(originalMessage.user);

	//now wait 3 minutes for people to send their order
	self._runTimer(this.teabot,channel);
}
TeaRoundManager.prototype._collectTeaOrder = function(message){
	var self = this,
		teabot = this.teabot,
		user = teabot._getUserById(message.user),
		confirmationMsg = "Thank you your order of\"" + message.text + "\"has been received. Your tea should arrive soon. But don't count on it.";
	
	if(undefined === self.teaOrder[user]){
		self.teaOrder[user.name] = message.text;
	}else{
		confirmationMsg = 'You have already placed an order and you cannot place another one';
	}
	//confirm order has been taken
	teabot.postMessageToUser( user.name, confirmationMsg );

}
TeaRoundManager.prototype._returnTeaOrderAsString = function(message){
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
			message+=', ' + orderMaker + ' has ordered ' + order;
		}
		return message;
	}
}
module.exports = TeaRoundManager;