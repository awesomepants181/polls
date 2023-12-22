//Description of a single poll

import { isRecord } from "./record";

//RI: len(options) >= 2
export type Poll = {
    readonly name: string;
    readonly endTime: number;
    readonly options: {option: string, votes: number}[];
    readonly voters: {name:string, choiceIndex: number}[];
}

/**
 * Parses unknown data into an Poll. Logs an error and returns undefined if the passed data is not a valid Poll.
 * @param val unknown data being parsed into a Poll
 * @returns if val is a valid Poll, then returns the Poll. Otherwise, return undefined
 */
export const parsePoll = (val: unknown): Poll | undefined =>{
    //val is not a record (Polls are records)
    if (!isRecord(val)) {
        console.error("not a poll", val)
        return undefined;
    }

    //Missing name
    if(typeof val.name !== "string"){
        console.error("poll is missing valid 'name' parameter", val);
        return undefined;
    }

    //Missing endTime
    if (typeof val.endTime !== "number" || val.endTime < 0 || isNaN(val.endTime)){
        console.error("poll is missing a valid 'endTime' parameter", val);
        return undefined;
    }

    //Missing or invalid options
    if(!Array.isArray(val.options)){
        console.error("poll is missing a valid 'options' parameter: options is not an array", val);
        return undefined;
    } else{
        for (const opt of val.options){
            if(typeof opt.option !== "string"){
                //Invalid or missing name of an option
                console.error("poll is missing a valid 'options' parameter: an option does not have a valid name", val);
                return undefined;
            }else if (typeof opt.votes !== "number" || opt.votes < 0 || isNaN(opt.votes) || Math.floor(opt.votes) !== opt.votes){
                //Invalid or missing number of votes of an option
                console.error("poll is missing a valid 'options' parameter: an option does not have a valid amount of votes", val);
                return undefined;
            }
        }
    }

    //Missing voters
    if(!Array.isArray(val.voters)){
        console.error("poll is missing a valid 'voters' parameter: voters is not an array", val);
        return undefined;
    }else{
        for (const vote of val.voters){
            if(typeof vote.name !== "string"){
                //Ivalid or missing name of voter
                console.error("poll is missing a valid 'voters' parameter: a vote does not have a valid name", val);
                return undefined;
            }else if (typeof vote.choiceIndex !== "number"){
                //Invalid or missing option being voted for
                console.error("poll is missing a valid 'voters' parameter: a vote does not have a valid choice index", val);
                return undefined;
            }
        }
    }

    //Everything is valid
    return {name: val.name, endTime: val.endTime, options: val.options, voters: val.voters};
}