import * as assert from 'assert';
import * as httpMocks from 'node-mocks-http';
import { addPoll, advanceTimeForTesting, countVotes, listPolls, loadPoll, resetForTesting, votePoll } from './routes';


describe('routes', function() {

  it('add', function(){
    //Branch 1: missing/invalid name
    const req1 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{}});
    const res1 = httpMocks.createResponse();
    addPoll(req1, res1);
    assert.strictEqual(res1._getStatusCode(), 400);
    assert.deepStrictEqual(res1._getData(), "missing or invalid 'name' parameter");

    const req2 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: 123}});
    const res2 = httpMocks.createResponse();
    addPoll(req2, res2);
    assert.strictEqual(res2._getStatusCode(), 400);
    assert.deepStrictEqual(res2._getData(), "missing or invalid 'name' parameter");

    //Branch 2: missing/invalid length of poll
    const req3 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "hello"}});
    const res3 = httpMocks.createResponse();
    addPoll(req3, res3);
    assert.strictEqual(res3._getStatusCode(), 400);
    assert.deepStrictEqual(res3._getData(), "'endTime' is not a number or is missing");

    const req4 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "hello", timeLength: "a string"}});
    const res4 = httpMocks.createResponse();
    addPoll(req4, res4);
    assert.strictEqual(res4._getStatusCode(), 400);
    assert.deepStrictEqual(res4._getData(), "'endTime' is not a number or is missing");
    
    const req5 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "hello", timeLength: -5}});
    const res5 = httpMocks.createResponse();
    addPoll(req5, res5);
    assert.strictEqual(res5._getStatusCode(), 400);
    assert.deepStrictEqual(res5._getData(), "'endTime' is not a number greater than or equal to 1: -5");
    
    const req6 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "hello", timeLength: NaN}});
    const res6 = httpMocks.createResponse();
    addPoll(req6, res6);
    assert.strictEqual(res6._getStatusCode(), 400);
    assert.deepStrictEqual(res6._getData(), "'endTime' is not a number greater than or equal to 1: NaN");
    
    //Branch 3: Options not in array or missing
    const req7 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "hello", timeLength: 1}});
    const res7 = httpMocks.createResponse();
    addPoll(req7, res7);
    assert.strictEqual(res7._getStatusCode(), 400);
    assert.deepStrictEqual(res7._getData(), "'options' are missing or invalid");

    const req8 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "hello", timeLength: 20, options:"bello"}});
    const res8 = httpMocks.createResponse();
    addPoll(req8, res8);
    assert.strictEqual(res8._getStatusCode(), 400);
    assert.deepStrictEqual(res8._getData(), "'options' are missing or invalid");

    //Branch 4: When there is an inavlid option
    const req9 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "hello", timeLength: 20, options:["not a record"]}});
    const res9 = httpMocks.createResponse();
    addPoll(req9, res9);
    assert.strictEqual(res9._getStatusCode(), 400);
    assert.deepStrictEqual(res9._getData(), "An option is not a record: not a record");

    const req10 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "hello", timeLength: 20, 
      options:[{option:"music", votes: 0},"again"]}});
    const res10 = httpMocks.createResponse();
    addPoll(req10, res10);
    assert.strictEqual(res10._getStatusCode(), 400);
    assert.deepStrictEqual(res10._getData(), "An option is not a record: again" );

    const req11 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "hello", timeLength: 20, 
      options:[{votes: 45}]}});
    const res11 = httpMocks.createResponse();
    addPoll(req11, res11);
    assert.strictEqual(res11._getStatusCode(), 400);
    assert.deepStrictEqual(res11._getData(), "An option doesn't have a valid name..." );

    const req12 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "hello", timeLength: 20, 
      options:[{option: 123, votes: 0}]}});
    const res12 = httpMocks.createResponse();
    addPoll(req12, res12);
    assert.strictEqual(res12._getStatusCode(), 400);
    assert.deepStrictEqual(res12._getData(), "An option doesn't have a valid name..." );

    const req13 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "hello", timeLength: 20, 
      options:[{option: "cheese"}]}});
    const res13 = httpMocks.createResponse();
    addPoll(req13, res13);
    assert.strictEqual(res13._getStatusCode(), 400);
    assert.deepStrictEqual(res13._getData(), "An option has a missing or invalid amount of votes" );

    const req14 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "hello", timeLength: 20, 
      options:[{option: "trust", votes: "a string"}]}});
    const res14 = httpMocks.createResponse();
    addPoll(req14, res14);
    assert.strictEqual(res14._getStatusCode(), 400);
    assert.deepStrictEqual(res14._getData(), "An option has a missing or invalid amount of votes" );

    const req15 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "hello", timeLength: 20, 
      options:[{option: "me", votes: 4}]}});
    const res15 = httpMocks.createResponse();
    addPoll(req15, res15);
    assert.strictEqual(res15._getStatusCode(), 400);
    assert.deepStrictEqual(res15._getData(), "An option is not starting off with 0 votes" );

    const req16 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "hello", timeLength: 20, 
      options:[{option: "yay", votes: 0}, {option: "phone", votes: 1003}]}});
    const res16 = httpMocks.createResponse();
    addPoll(req16, res16);
    assert.strictEqual(res16._getStatusCode(), 400);
    assert.deepStrictEqual(res16._getData(), "An option is not starting off with 0 votes" );

    //Branch 5: Poll doesn't have at least two options
    const req17 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "my poll", timeLength: 12, 
      options:[{option: "option 1", votes: 0}]}});
    const res17 = httpMocks.createResponse();
    addPoll(req17, res17);
    assert.strictEqual(res17._getStatusCode(), 400);
    assert.deepStrictEqual(res17._getData(), "my poll does not have at least two options..." );

    const req18 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "testttt", timeLength: 1, 
      options:[]}});
    const res18 = httpMocks.createResponse();
    addPoll(req18, res18);
    assert.strictEqual(res18._getStatusCode(), 400);
    assert.deepStrictEqual(res18._getData(), "testttt does not have at least two options..." );

    //Branch 6: No error
    const req19 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "which way to turn?", timeLength: 20, 
      options:[{option: "left", votes: 0}, {option: "right", votes: 0}]}});
    const res19 = httpMocks.createResponse();
    addPoll(req19, res19);
    assert.strictEqual(res19._getStatusCode(), 200);
    assert.deepStrictEqual(res19._getData().poll.name, "which way to turn?");
    assert.deepStrictEqual(res19._getData().poll.options, [{option: "left", votes: 0}, {option: "right", votes: 0}]);
    assert.deepStrictEqual(res19._getData().poll.voters, []);
    const endTime19 = res19._getData().poll.endTime;
    assert.ok(Math.abs(endTime19 - Date.now()- 20 * 60 * 1000) < 50);

    const req20 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "type of pizza?", timeLength: 1, 
      options:[{option: "cheese", votes: 0}, {option: "vegatable", votes: 0}, {option:"sauce?", votes: 0}]}});
    const res20 = httpMocks.createResponse();
    addPoll(req20, res20);
    assert.strictEqual(res20._getStatusCode(), 200);
    assert.deepStrictEqual(res20._getData().poll.name, "type of pizza?");
    assert.deepStrictEqual(res20._getData().poll.options, [{option: "cheese", votes: 0}, {option: "vegatable", votes: 0}, 
      {option:"sauce?", votes: 0}]);
    assert.deepStrictEqual(res20._getData().poll.voters, []);
    const endTime20 = res20._getData().poll.endTime;
    assert.ok(Math.abs(endTime20 - Date.now()- 1 * 60 * 1000) < 50);

    //Branch 7: Existing poll has same name
    const req21 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "type of pizza?", timeLength: 1, 
      options:[{option: "pepporoni", votes: 0}, {option: "hawaiian", votes: 0}, {option:"cheese", votes: 0}]}});
    const res21 = httpMocks.createResponse();
    addPoll(req21, res21);
    assert.strictEqual(res21._getStatusCode(), 400);
    assert.deepStrictEqual(res21._getData(), "Poll already exists named type of pizza?" );

    resetForTesting();
  });

  it('list', function(){
    //When list of polls is empty
    const req1 = httpMocks.createRequest({method: 'GET', url: '/api/list', query:{}});
    const res1 = httpMocks.createResponse();
    listPolls(req1, res1);
    assert.strictEqual(res1._getStatusCode(), 200);
    assert.deepStrictEqual(res1._getData(), {polls:[]});

    //Adding polls
    const req2 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "Favorite colors?", timeLength: 20, 
      options:[{option: "blue", votes: 0}, {option: "green", votes: 0}]}});
    const res2 = httpMocks.createResponse();
    addPoll(req2, res2);
    assert.strictEqual(res2._getStatusCode(), 200);

    //only 1 poll
    const req3 = httpMocks.createRequest({method: 'GET', url: '/api/list', query:{}});
    const res3 = httpMocks.createResponse();
    listPolls(req3, res3);
    assert.strictEqual(res3._getStatusCode(), 200);
    assert.deepStrictEqual(res3._getData().polls.length, 1);
    assert.deepStrictEqual(res3._getData().polls[0].name, "Favorite colors?");

    //Adding polls
    const req4 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "Shoes", timeLength: 1, 
      options:[{option: "flip-flops", votes: 0}, {option: "sneakers", votes: 0}, {option: "barefoot", votes: 0}]}});
    const res4 = httpMocks.createResponse();
    addPoll(req4, res4);
    assert.strictEqual(res4._getStatusCode(), 200);

    const req5 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "Weather", timeLength: 5.5, 
      options:[{option: "sunny", votes: 0}, {option: "rainy", votes: 0}, {option: "cloudy", votes: 0}]}});
    const res5 = httpMocks.createResponse();
    addPoll(req5, res5);
    assert.strictEqual(res5._getStatusCode(), 200);

    //Multiple polls
    const req6 = httpMocks.createRequest({method: 'GET', url: '/api/list', query:{}});
    const res6 = httpMocks.createResponse();
    listPolls(req6, res6);
    assert.strictEqual(res6._getStatusCode(), 200);
    assert.deepStrictEqual(res6._getData().polls.length, 3);
    assert.deepStrictEqual(res6._getData().polls[0].name, "Shoes");
    assert.deepStrictEqual(res6._getData().polls[1].name, "Weather");
    assert.deepStrictEqual(res6._getData().polls[2].name, "Favorite colors?");

    //Advance time by 2 minutes
    advanceTimeForTesting(2 *60 *1000);

     //Shoes poll is finished
     const req7 = httpMocks.createRequest({method: 'GET', url: '/api/list', query:{}});
     const res7 = httpMocks.createResponse();
     listPolls(req7, res7);
     assert.strictEqual(res7._getStatusCode(), 200);
     assert.deepStrictEqual(res7._getData().polls.length, 3);
     assert.deepStrictEqual(res7._getData().polls[0].name, "Weather");
     assert.deepStrictEqual(res7._getData().polls[1].name, "Favorite colors?");
     assert.deepStrictEqual(res7._getData().polls[2].name, "Shoes");

     //Advance time by another 4 minutes
    advanceTimeForTesting(4 *60 *1000);

    //Shoes poll and Weather poll are finished
    const req8 = httpMocks.createRequest({method: 'GET', url: '/api/list', query:{}});
    const res8 = httpMocks.createResponse();
    listPolls(req8, res8);
    assert.strictEqual(res8._getStatusCode(), 200);
    assert.deepStrictEqual(res8._getData().polls.length, 3);
    assert.deepStrictEqual(res8._getData().polls[0].name, "Favorite colors?");
    assert.deepStrictEqual(res8._getData().polls[1].name, "Weather");
    assert.deepStrictEqual(res8._getData().polls[2].name, "Shoes");

    //Advance time by another 20 minutes
    advanceTimeForTesting(20 *60 *1000);

    //All polls are finished
    const req9 = httpMocks.createRequest({method: 'GET', url: '/api/list', query:{}});
    const res9 = httpMocks.createResponse();
    listPolls(req9, res9);
    assert.strictEqual(res9._getStatusCode(), 200);
    assert.deepStrictEqual(res9._getData().polls.length, 3);
    assert.deepStrictEqual(res8._getData().polls[0].name, "Favorite colors?");
    assert.deepStrictEqual(res8._getData().polls[1].name, "Weather");
    assert.deepStrictEqual(res8._getData().polls[2].name, "Shoes");

    resetForTesting();
  });

  it('countVotes', function(){
    //No options
    let opts1:{option: string, votes: number}[] =[];
    countVotes(opts1, []);
    assert.deepStrictEqual(opts1,[]);

    //No votes
    let opts2 =  [{option: "flying", votes: 4}, {option: "teleport", votes: 8}];
    countVotes(opts2, []);
    assert.deepStrictEqual(opts2, [{option: "flying", votes: 0}, {option: "teleport", votes: 0}])

    //Only 1 option and 1 vote
    let opts3 =[{option: "pepporoni", votes: 0}];
    countVotes(opts3, [{name: "Cyclops", choiceIndex: 0}]);
    assert.deepStrictEqual(opts3,[{option: "pepporoni", votes: 1}]);

    let opts4 =[{option: "x-men", votes: 0}];
    countVotes(opts4, [{name: "Scott Summers", choiceIndex: 1}]);
    assert.deepStrictEqual(opts4,[{option: "x-men", votes: 0}]);

    //1 option, multiple votes
    let opts5 = [{option: "brotherhood", votes: 5}];
    countVotes(opts5, [{name: "Magneto", choiceIndex: 0}, {name: "Pyro", choiceIndex: 0},
     {name: "Jean Grey", choiceIndex:1}]);
     assert.deepStrictEqual(opts5,[{option: "brotherhood", votes: 2}]);

     let opts6 = [{option: "blue", votes: 4}];
     countVotes(opts6, [{name: "Nightcrawler", choiceIndex:0}, {name: "Mystique", choiceIndex:0}, {name: "Havok", choiceIndex:0}]);
      assert.deepStrictEqual(opts6,[{option: "blue", votes: 3}]);

    // mutiple options, and 1 vote
    let opts7 = [{option: "lights", votes: 3}, {option: "camera", votes: 6}];
    countVotes(opts7, [{name: "Prof. X", choiceIndex:0}]);
    assert.deepStrictEqual(opts7,[{option: "lights", votes: 1}, {option: "camera", votes: 0}]);

    let opts8 = [{option: "mutant", votes: 32}, {option: "human", votes: 56}, {option: "sentinal", votes: 0}];
    countVotes(opts8, [{name: "kelly", choiceIndex:2}]);
    assert.deepStrictEqual(opts8,[{option: "mutant", votes: 0}, {option: "human", votes: 0}, {option: "sentinal", votes: 1}]);

    // multiple options, multiple votes
    let opts9 = [{option: "rocks", votes: 0}, {option: "minerals", votes: 10}];
    countVotes(opts9, [{name: "John", choiceIndex: 0}]);
    assert.deepStrictEqual(opts9,[{option: "rocks", votes: 1}, {option: "minerals", votes: 0}]);

    let opts10 = [{option: "sedimentary", votes: 0}, {option: "igneous", votes: 0}, {option: "metamorphic", votes: 3}];
    countVotes(opts10, [{name: "Mary", choiceIndex:0}, {name: "Smith", choiceIndex:1}, {name: "Jane", choiceIndex:0}]);
    assert.deepStrictEqual(opts10,[{option: "sedimentary", votes: 2}, {option: "igneous", votes: 1}, {option: "metamorphic", votes: 0}]);
  });

  it('vote', function(){
    //Add auction
    const req1 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "type of pizza?", timeLength: 10, 
      options:[{option: "cheese", votes: 0}, {option: "vegetable", votes: 0}, {option:"sauce?", votes: 0}]}});
    const res1 = httpMocks.createResponse();
    addPoll(req1, res1);
    assert.strictEqual(res1._getStatusCode(), 200);


    //Branch 1: No voter name
    const req2 = httpMocks.createRequest({method: 'POST', url: '/api/vote', body:{}});
    const res2 = httpMocks.createResponse();
    votePoll(req2, res2);
    assert.strictEqual(res2._getStatusCode(), 400);
    assert.deepStrictEqual(res2._getData(), "missing or invalid 'voter' parameter");

    const req3 = httpMocks.createRequest({method: 'POST', url: '/api/vote', body:{voter: 34}});
    const res3 = httpMocks.createResponse();
    votePoll(req3, res3);
    assert.strictEqual(res3._getStatusCode(), 400);
    assert.deepStrictEqual(res3._getData(), "missing or invalid 'voter' parameter");

    //Branch 2: No or invalid poll name provided
    const req4 = httpMocks.createRequest({method: 'POST', url: '/api/vote', body:{voter: "me"}});
    const res4 = httpMocks.createResponse();
    votePoll(req4, res4);
    assert.strictEqual(res4._getStatusCode(), 400);
    assert.deepStrictEqual(res4._getData(), "missing or invalid 'pollName' parameter");

    const req5 = httpMocks.createRequest({method: 'POST', url: '/api/vote', body:{voter: "me", pollName: 123}});
    const res5 = httpMocks.createResponse();
    votePoll(req5, res5);
    assert.strictEqual(res5._getStatusCode(), 400);
    assert.deepStrictEqual(res5._getData(), "missing or invalid 'pollName' parameter");

    //Branch 3: No poll exists under the give name, pollName
    const req6 = httpMocks.createRequest({method: 'POST', url: '/api/vote', body:{voter: "me", pollName: "a"}});
    const res6 = httpMocks.createResponse();
    votePoll(req6, res6);
    assert.strictEqual(res6._getStatusCode(), 400);
    assert.deepStrictEqual(res6._getData(), "no poll named 'a'");

    const req7 = httpMocks.createRequest({method: 'POST', url: '/api/vote', body:{voter: "me", pollName: "trope"}});
    const res7 = httpMocks.createResponse();
    votePoll(req7, res7);
    assert.strictEqual(res7._getStatusCode(), 400);
    assert.deepStrictEqual(res7._getData(), "no poll named 'trope'");

    //Branch 4:  voting for invalid or missing optionIndex
    const req8 = httpMocks.createRequest({method: 'POST',url: '/api/vote', body:{voter: "me", pollName: "type of pizza?"}});
    const res8 = httpMocks.createResponse();
    votePoll(req8, res8);
    assert.strictEqual(res8._getStatusCode(), 400);
    assert.deepStrictEqual(res8._getData(), "optionIndex is missing or invalid");

    const req9 = httpMocks.createRequest({method: 'POST',url: '/api/vote', body:{voter: "me", pollName: "type of pizza?", optionindex: "a"}});
    const res9 = httpMocks.createResponse();
    votePoll(req9, res9);
    assert.strictEqual(res9._getStatusCode(), 400);
    assert.deepStrictEqual(res9._getData(), "optionIndex is missing or invalid");

    //Branch 5: voting for option not in poll
    const req10 = httpMocks.createRequest({method: 'POST',url: '/api/vote', body:{voter: "me", pollName: "type of pizza?", optionIndex:3}});
    const res10 = httpMocks.createResponse();
    votePoll(req10, res10);
    assert.strictEqual(res10._getStatusCode(), 400);
    assert.deepStrictEqual(res10._getData(), "Voting for an option not in type of pizza?");

    const req11 = httpMocks.createRequest({method: 'POST',url: '/api/vote', body:{voter: "me", pollName: "type of pizza?", optionIndex: 4}});
    const res11 = httpMocks.createResponse();
    votePoll(req11, res11);
    assert.strictEqual(res11._getStatusCode(), 400);
    assert.deepStrictEqual(res11._getData(), "Voting for an option not in type of pizza?");

    //Branch 6: First-time voter
    const req12 = httpMocks.createRequest({method: 'POST',url: '/api/vote', body:{voter: "person1", pollName: "type of pizza?", optionIndex:0}});
    const res12 = httpMocks.createResponse();
    votePoll(req12, res12);
    assert.strictEqual(res12._getStatusCode(), 200);
    assert.deepStrictEqual(res12._getData().poll.name, "type of pizza?");
    assert.deepStrictEqual(res12._getData().poll.options, [{option: "cheese", votes: 1}, {option: "vegetable", votes: 0}, 
      {option:"sauce?", votes: 0}]);
      assert.deepStrictEqual(res12._getData().poll.voters, [{name: "person1", choiceIndex: 0}]);
      
    const req13= httpMocks.createRequest({method: 'POST',url: '/api/vote', body:{voter: "person2", pollName: "type of pizza?", 
      optionIndex:1}});
    const res13 = httpMocks.createResponse();
    votePoll(req13, res13);
    assert.strictEqual(res13._getStatusCode(), 200);
    assert.deepStrictEqual(res13._getData().poll.name, "type of pizza?");
    assert.deepStrictEqual(res13._getData().poll.options, [{option: "cheese", votes: 1}, {option: "vegetable", votes: 1}, 
      {option:"sauce?", votes: 0}]);
      assert.deepStrictEqual(res13._getData().poll.voters, [{name: "person1", choiceIndex: 0}, 
      {name: "person2", choiceIndex: 1}]);


    //Branch 7: Updating vote
    const req14 = httpMocks.createRequest({method: 'POST', url: '/api/vote',
      body:{voter: "person2", pollName: "type of pizza?", optionIndex:2}});
    const res14 = httpMocks.createResponse();
    votePoll(req14, res14);
    assert.strictEqual(res14._getStatusCode(), 200);
    assert.deepStrictEqual(res14._getData().poll.name, "type of pizza?");
    assert.deepStrictEqual(res14._getData().poll.options, [{option: "cheese", votes: 1}, {option: "vegetable", votes: 0}, 
      {option:"sauce?", votes: 1}]);
      assert.deepStrictEqual(res14._getData().poll.voters, [{name: "person1", choiceIndex: 0}, 
      {name: "person2", choiceIndex:2}]);

    const req15 = httpMocks.createRequest({method: 'POST', url: '/api/vote',
      body:{voter: "person1", pollName: "type of pizza?", optionIndex:2}});
    const res15 = httpMocks.createResponse();
    votePoll(req15, res15);
    assert.strictEqual(res15._getStatusCode(), 200);
    assert.deepStrictEqual(res15._getData().poll.name, "type of pizza?");
    assert.deepStrictEqual(res15._getData().poll.options, [{option: "cheese", votes: 0}, {option: "vegetable", votes: 0}, 
      {option:"sauce?", votes: 2}]);
      assert.deepStrictEqual(res14._getData().poll.voters, [{name: "person1", choiceIndex: 2}, 
      {name: "person2", choiceIndex:2}]);


    //Advance time by 11 minutes
    advanceTimeForTesting(20 * 60 * 1000);

    //Branch 8: Poll is over, can't vote
    const req16 = httpMocks.createRequest({method: 'POST', url: '/api/vote',
      body:{voter: "person3", pollName: "type of pizza?", optionIndex:0}});
    const res16 = httpMocks.createResponse();
    votePoll(req16, res16);
    assert.strictEqual(res16._getStatusCode(), 400);
    assert.deepStrictEqual(res16._getData(), "type of pizza? has already ended...");

    const req17 = httpMocks.createRequest({method: 'POST', url: '/api/vote',
      body:{voter: "person1", pollName: "type of pizza?", optionIndex: 0}});
    const res17 = httpMocks.createResponse();
    votePoll(req17, res17);
    assert.strictEqual(res17._getStatusCode(), 400);
    assert.deepStrictEqual(res17._getData(), "type of pizza? has already ended...");

    resetForTesting();
  });

  it('load', function(){
    //Add auctions
    const req1 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "which way to turn?", timeLength: 5, 
      options:[{option: "left", votes: 0}, {option: "right", votes: 0}]}});
    const res1 = httpMocks.createResponse();
    addPoll(req1, res1);
    assert.strictEqual(res1._getStatusCode(), 200);

    const req2 = httpMocks.createRequest({method: 'POST', url: '/api/add', body:{name: "Best meal of the day", timeLength: 2, 
      options:[{option: "breakfast", votes: 0}, {option: "lunch", votes: 0}, {option: "dinner", votes: 0}]}});
    const res2 = httpMocks.createResponse();
    addPoll(req2, res2);
    assert.strictEqual(res2._getStatusCode(), 200);

    //Branch 1: Missing/invalid name
    const req3 = httpMocks.createRequest({method:"GET", url: "/api/load", query:{}});
    const res3 = httpMocks.createResponse();
    loadPoll(req3, res3);
    assert.strictEqual(res3._getStatusCode(), 400);
    assert.deepStrictEqual(res3._getData(), "missing or invalid 'name' parameter");

    const req4 = httpMocks.createRequest({method:"GET", url: "/api/load", query:{name: true}});
    const res4 = httpMocks.createResponse();
    loadPoll(req4, res4);
    assert.strictEqual(res4._getStatusCode(), 400);
    assert.deepStrictEqual(res4._getData(), "missing or invalid 'name' parameter");

    //Branch 2: No poll with name
    const req5 = httpMocks.createRequest({method:"GET", url: "/api/load", query:{name: "my poll"}});
    const res5 = httpMocks.createResponse();
    loadPoll(req5, res5);
    assert.strictEqual(res5._getStatusCode(), 400);
    assert.deepStrictEqual(res5._getData(), "no poll named my poll");

    const req6 = httpMocks.createRequest({method:"GET", url: "/api/load", query:{name: "yes"}});
    const res6 = httpMocks.createResponse();
    loadPoll(req6, res6);
    assert.strictEqual(res6._getStatusCode(), 400);
    assert.deepStrictEqual(res6._getData(), "no poll named yes");

    //Branch 3: Found poll!
    const req7 = httpMocks.createRequest({method:"GET", url: "/api/load", query:{name: "which way to turn?"}});
    const res7 = httpMocks.createResponse();
    loadPoll(req7, res7);
    assert.strictEqual(res7._getStatusCode(), 200);
    assert.deepStrictEqual(res7._getData().poll.name, "which way to turn?");
    assert.deepStrictEqual(res7._getData().poll.options, [{option: "left", votes: 0}, {option: "right", votes: 0}]);

    const req8 = httpMocks.createRequest({method:"GET", url: "/api/load", query:{name: "Best meal of the day"}});
    const res8 = httpMocks.createResponse();
    loadPoll(req8, res8);
    assert.strictEqual(res8._getStatusCode(), 200);
    assert.deepStrictEqual(res8._getData().poll.name, "Best meal of the day");
    assert.deepStrictEqual(res8._getData().poll.options, [{option: "breakfast", votes: 0}, {option: "lunch", votes: 0}, 
      {option: "dinner", votes: 0}]);
  });

});
