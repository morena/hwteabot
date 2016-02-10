var chai = require("chai"),
	expect = chai.expect,
	TeaBot = require("../lib/teabot");

describe("Teabot", function(){
	describe("constructor", function(){
		it("arguments should contain a token and a name", function(){
			var origToken = "abc",
				origName  = "morena",
				teabot = new TeaBot({
					token : origToken,
					//dbPath : dbPath,
					name : origName
				});
			expect(teabot.settings.token).to.equal(origToken);
			expect(teabot.settings.name).to.equal(origName);
		});
		it("should have a deafault name", function(){
			var origToken = "abc"
				teabot = new TeaBot({
					token : origToken
				});
			expect(teabot.settings.name).to.equal("teabot");
		});
	})
})