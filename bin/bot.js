'use strict';

var HWteaBot = require("../lib/hwteabot"),
	token = process.env.BOT_API_KEY,
	//dbPath = process.env.BOT_DB_PATH,
	name = process.env.BOT_NAME;

var hwteabot = new HWteaBot({
	token : token,
	//dbPath : dbPath,
	name : name
});

hwteabot.run();