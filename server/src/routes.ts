import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";


// Require type checking of request body.
type SafeRequest = Request<ParamsDictionary, {}, Record<string, unknown>>;
type SafeResponse = Response;  // only writing, so no need to check

//Description of an individual poll
// RI: len(options) >= 2
type Poll = {
  //Name of the poll
  name: string;

  //When the poll ends
  endTime: number;

  //All of the poll's options and the amount of votes the option has (must have at least two options)
  options: {option: string, votes: number}[];

  //All of the voters and their choices in the poll. 
  //Choices are recorded by index of the selected option
  voters: {name:string, choiceIndex: number}[];
}

// Map from poll names to the details of the actual poll
const polls: Map<string, Poll> = new Map();

/** Testing function to remove all the added auctions. */
export const resetForTesting = (): void => {
  polls.clear();
};

/** Testing function to move all end times forward the given amount in ms. */
export const advanceTimeForTesting = (ms: number): void => {
  for (const poll of polls.values()) {
    poll.endTime = poll.endTime - ms;
  }
};

//Sort all of the polls with the ones finishing  soonest first and all of 
// completed polls after the ongoing polls, with the polls that ended most
// recently first.
const comparePolls = (a: Poll, b: Poll): number => {
  const now: number = Date.now();
  const endA = now <= a.endTime ? a.endTime : 1e15 - a.endTime;
  const endB = now <= b.endTime ? b.endTime : 1e15 - b.endTime;
  return endA - endB;
};

/**
 * Sends a sorted list of all of the polls. The list are sorted so that the ongoing polls are listed first, 
 * with the polls ending the soonest first. After the all of the ongoing polls list the completed polls, with
 * the polls completed the most recent listed first
 * @param _req the request
 * @param res the response
 */
export const listPolls = (_req: SafeRequest, res: SafeResponse): void =>{
  //Store and sortthe polls in an array
  const pollValues: Poll[] = Array.from(polls.values());
  pollValues.sort(comparePolls);

  res.send({polls: pollValues});
}

/**
 * Add a valid poll to the list of all of the polls. Also, sends back the newly created poll
 * @param req the request
 * @param res the response
 */
export const addPoll = (req: SafeRequest, res: SafeResponse): void =>{
  //The name of the poll
  const name = req.body.name;

  //When the poll doesn't have a valid name 
  if (typeof name !== "string"){
    res.status(400).send("missing or invalid 'name' parameter");
    return;
  }

  //The length of the poll (in minutes)
  const timeLength = req.body.timeLength;

  if (typeof timeLength !== "number"){
    //When no length or inavlid length is provided
    res.status(400).send("'endTime' is not a number or is missing");
    return;
  }else if (isNaN(timeLength) || timeLength < 1){
    //The minimum length of a poll is 1 minute (Note: the length does not have to be an integer)
    res.status(400).send(`'endTime' is not a number greater than or equal to 1: ${timeLength}`);
    return;
  }

  //All of the poll's options 
  const options = req.body.options;

  if(!Array.isArray(options)){
    //When the options are not in an array
    res.status(400).send("'options' are missing or invalid");
    return;
  }else{
    //Check each option
    for (const opt of options){
      if(!isRecord(opt)){
        //When the option is not a record
        res.status(400).send(`An option is not a record: ${opt}`);
        return;
      }

      if(typeof opt.option !== "string"){
        //When the option does not have a valid name
        res.status(400).send("An option doesn't have a valid name...");
        return;
      }
      
      if( typeof opt.votes !== "number"){
        //When the option does not have an amount of votes
        res.status(400).send("An option has a missing or invalid amount of votes");
        return;
      }

      if ( opt.votes !== 0){
        //All options should start with 0 votes
        res.status(400).send("An option is not starting off with 0 votes");
        return;
      }
    }
  }

  //Makes sure that the poll has (valid) two options
  if (options.length < 2){
    res.status(400).send(`${name} does not have at least two options...`);
    return;
  }

  //When there is an existing poll with the same name
  if(polls.has(name)){
    res.status(400).send(`Poll already exists named ${name}`);
    return;
  }

  //Make poll now that we know all fields are valid
  const poll: Poll = {
    name: name,
    endTime: Date.now() + timeLength * 60 * 1000, //in ms
    options: options,
    voters: []
  };

  polls.set(poll.name, poll);
  res.send({poll: poll});
}

/**
 * Votes in a poll and updates the amount of votes each option has in the poll. Also, sends back the poll 
 * being voted in
 * @param req the request
 * @param res the response
 */
export const votePoll = (req: SafeRequest, res: SafeResponse): void =>{
  //Check that that the voter has a valid name
  const voter = req.body.voter;
  if(typeof voter !== "string"){
    res.status(400).send("missing or invalid 'voter' parameter");
    return;
  }

  //Check that voter has specfied a poll to vote in 
  const pollName = req.body.pollName;
  if(typeof pollName !== "string"){
    res.status(400).send("missing or invalid 'pollName' parameter");
    return;
  }

  //Check that voter is voting in an existing poll
  const currPoll = polls.get(pollName);
  if(currPoll === undefined){
    res.status(400).send(`no poll named '${pollName}'`);
    return;
  }

  //Check that voter is voting in an active poll
  if (Date.now() >= currPoll.endTime){
    res.status(400).send(`${pollName} has already ended...`);
    return;
  }

  //Check to see if voter has specfied an option to vote for
  const optionIndex = req.body.optionIndex;
  if(typeof optionIndex !== "number"){
    res.status(400).send("optionIndex is missing or invalid");
    return;
  }

  //Checks that the voter is voting for a valid option
  if(optionIndex >= currPoll.options.length){
    res.status(400).send(`Voting for an option not in ${pollName}`);
    return;
  }

  const updatedVoters: {name: string, choiceIndex: number}[] = [];

  //Whether the voter has already voted
  let hasVoted: boolean = false;

  //Checks if the voter has already voted
  for (const votee of currPoll.voters){
    if(votee.name === voter){
      //When the voter has already voted (change their vote)
      hasVoted = true;
      //Change vote
      updatedVoters.push({name:voter, choiceIndex: optionIndex})
    }else{
      updatedVoters.push(votee);
    }
  }

  //Adding first time voter to the array of voters
  if (hasVoted === false){
    updatedVoters.push({name:voter, choiceIndex: optionIndex});
  }

  //Update voters
  currPoll.voters = updatedVoters;
  //Recount votes
  countVotes(currPoll.options, updatedVoters);

  res.send({poll: currPoll});
}

/**
 * Helper method to count the votes for each option in a poll. (exported to test)
 * @param options the poll's options
 * @param votes the poll's votes
 * @modifies options
 * @effects each element in options has their votes updated to match the amount of votes for them
 */
 export const countVotes = (options: {option: string, votes: number}[], votes:{name: string, choiceIndex: number}[]): void =>{

  for (const opt of options){
    //Reset the options's votes to 0
    opt.votes = 0;

    for(const vote of votes){
      if(vote.choiceIndex === options.indexOf(opt)){
        //Increment the option's votes when they have a vote
        opt.votes = opt.votes + 1;
      }
    }
  }
 }

 /**
  * Sends back the current state of the specified poll
  * @param req the request
  * @param res the response
  */
 export const loadPoll = (req:SafeRequest, res:SafeResponse): void =>{
  //The name of the poll the user is requesting
  const name = req.query.name;

  //When the requested name is missing or invalid
  if(typeof name !== "string"){
    res.status(400).send("missing or invalid 'name' parameter");
    return;
  }

  //The poll the user is requesting
  const poll = polls.get(name);

  //When there is no poll with the requested name
  if(poll === undefined){
    res.status(400).send(`no poll named ${name}`);
    return;
  }
  
  res.send({poll: poll});
 }

/**
 * Determines whether the given value is a record.
 * @param val the value in question
 * @return true if the value is a record and false otherwise
 */
const isRecord = (val: unknown): val is Record<string, unknown> => {
  return val !== null && typeof val === "object";
};
