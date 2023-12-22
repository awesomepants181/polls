import { Component, MouseEvent, ChangeEvent } from "react";
import { Poll, parsePoll } from "./polls";
import React from "react";
import { isRecord } from "./record";

type PollDetailsProps = {
    //Name of poll being clicked on
    name: string;

    //Callback to PollsApp when the back button is clicked
    onBackClick: () => void;
}

type PollDetailsState ={
    //Whether the poll is over or still ongoing
    isOver: boolean;

    //The poll being displayed
    poll: Poll | undefined;

    //The name of the person voting (if the poll is still ongoing)
    voter: string;

    //The index of the option being voted for (if the poll is still ongoing)
    selectedIndex: number | undefined;

    //A message to be displayed, as needed
    message: {msg: string, isError: boolean} | undefined;
}

export class PollDetails extends Component<PollDetailsProps, PollDetailsState> {
    constructor(props: PollDetailsProps) {
        super(props);
    
        //Start with nothing filled out
        this.state = {isOver: false, poll: undefined,voter:"", selectedIndex: undefined, message: undefined};
    }

    //Refresh the list of polls when the poll details UI is first put on page
    componentDidMount = (): void => {
        this.doRefreshClick(); 
    };



      //Render the poll details
    render = (): JSX.Element  =>{
        if(this.state.poll === undefined){
            return <p>loading poll: {this.props.name}</p>;
        } else{
            if(!this.state.isOver){
                //Poll is still ongoing
                return this.renderOngoing(this.state.poll);
            }else{
                //Poll is now over
                return this.renderOver(this.state.poll);
            }
        }
    }

    //When the poll is over, render a message saying when the poll ended and the results
    renderOver = (poll: Poll): JSX.Element =>{
        const minsOver = Math.abs(Math.round((poll.endTime - Date.now()) / 60 / 100) / 10);
        return(<div>
            <h2>{poll.name}</h2>
            <p>Closed {minsOver} minutes ago.</p>
            {this.renderResults()}
            <button type="button" onClick={this.doBackClick}>Back</button>
            <button type="button" onClick={this.doRefreshClick}>Refresh</button>
            {this.renderMessage()}
        </div>);
    }

    //When the poll is over, render the poll results
    renderResults = (): JSX.Element =>{
        if(this.state.poll === undefined){
            //Shouldn't be reached (for compilier)
            console.error("no poll to display!");
            return <p>No poll...</p>
        }else{
            const allResults: JSX.Element[] = [];
            const totalVotes: number = this.state.poll.voters.length;
            

            if(totalVotes === 0){
                //When there are no votes (can't divide by 0)
                for(const result of this.state.poll.options){

                    const index = this.state.poll.options.indexOf(result);
                    allResults.push(<div key={index}>
                        <li>0% - {result.option}</li>
                    </div>);
                }
            }else{
                //When there are at least one vote
                for(const result of this.state.poll.options){
                    const index = this.state.poll.options.indexOf(result);
                    const votePercent: number =  Math.round((result.votes / totalVotes) * 100);
                    
                    allResults.push(<div key={index}>
                        <li>{votePercent}% - {result.option}</li>
                    </div>);
                }
            }

            return <ul>{allResults}</ul>;
        }

    }

    //When the poll is still ongoing, render the UI for users to vote
    renderOngoing = (poll: Poll): JSX.Element =>{
        const minsLeft = Math.round((poll.endTime - Date.now()) / 60 / 100) / 10;

        return (<div>
            <h2>{poll.name}</h2>
            <p>Closes in {minsLeft} minutes...</p>
            {this.renderOptions()}
            <label htmlFor="name">Voter Name: </label>
            <input type ="text" id="name" value={this.state.voter} onChange={this.doVoterChange} />
            <br></br>
            <button type="button" onClick={this.doBackClick}>Back</button>
            <button type="button" onClick={this.doRefreshClick}>Refresh</button>
            <button type="button" onClick={this.doVoteClick}>Vote</button>
            {this.renderMessage()}
        </div>);
    }

    //Render the options the user can vote for in an ongoing poll
    renderOptions = (): JSX.Element =>{
        if(this.state.poll === undefined){
            //Shouldn't be reached (for compilier)
            console.error("no poll to display!");
            return <p>No poll...</p>
        }else{
            const allOptions: JSX.Element[] = [];

            for (const option of this.state.poll.options){
                const index = this.state.poll.options.indexOf(option);
                if(this.state.selectedIndex === index){
                    //Selected option
                    allOptions.push(
                        <div key = {index}>
                            <input type="radio" id={option.option} name= {"poll options"} value={index}
                                checked={true} onChange={this.doOptionChange}/>
                            <label htmlFor={option.option}>{option.option}</label> 
                        </div>
                    );
                }else{
                    //Non-selected options
                    allOptions.push(
                        <div key={index}>
                            <input type="radio" id={option.option} name= {"poll options"} value={index}
                                checked={false} onChange= {this.doOptionChange}/>
                            <label htmlFor={option.option}>{option.option}</label> 
                        </div>
                    );
                }
            }

            return <ul>{allOptions}</ul>;
        }
    }

    //Render a message to be displayed to the user, as needed
    renderMessage = (): JSX.Element => {
        if (this.state.message === undefined) {
            //When no message needs to be displayed
          return <div></div>;
        } else {
            if(this.state.message.isError){
                //Error messages are red
                const style = {width: '300px', backgroundColor: 'rgb(246,194,192)',
                border: '1px solid rgb(137,66,61)', borderRadius: '5px', padding: '5px' };

                return (<div style={{marginTop: '15px'}}>
                    <span style={style}><b>Error</b>: {this.state.message.msg}</span>
                </div>);
            }else{
                //non-error messages are white
                const style = {width: '300px',
                border: '1px solid rgb(137,66,61)', borderRadius: '5px', padding: '5px' };

                return (<div style={{marginTop: '15px'}}>
                    <span style={style}> {this.state.message.msg}</span>
                </div>);
            }
        }
      };

      //When the user changes the option they select
    doOptionChange = (evt:ChangeEvent<HTMLInputElement>): void =>{
        const currPoll = this.state.poll;

        if(currPoll === undefined){
            //for compiler
            console.error("no poll selected, shouldn't be reached!");
            return;
        }

        if(currPoll.endTime < Date.now()){
            //Update the screen, but displays a error message to the user if the poll is over
            this.setState({message: {msg: `${currPoll.name} is now over. Your changes were not saved.`, isError: true}, isOver: true});
        }else{
            //Update the screen when the poll is still ongoing
            this.setState({selectedIndex:  parseFloat(evt.target.value), message: undefined});
        }
    }

    //When the user changes they name they are voting under
    doVoterChange = (evt: ChangeEvent<HTMLInputElement>): void =>{
        const currPoll = this.state.poll;

        if(currPoll === undefined){
            //for compiler
            console.error("no poll selected, shouldn't be reached!");
            return;
        }
        if(currPoll.endTime < Date.now()){
            //Update the screen, but displays a error message to the user if the poll is over
            this.setState({message: {msg: `${currPoll.name} is now over. Your changes were not saved.`, isError: true}, isOver: true});
        }else{
             //Update the screen when the poll is still ongoing
            this.setState({voter: evt.target.value,  message: undefined});
        }
    }

    //When the vote button is clicked
    doVoteClick = (_evt: MouseEvent<HTMLButtonElement>): void =>{
        //When the user hasn't selected an option
        if(this.state.selectedIndex === undefined){
            this.setState({message: {msg: "No option selected to vote for!", isError: true}});
            return;
        }

        //When the user doesn't provide a name to vote under
        if(this.state.voter.trim().length === 0){
            this.setState({message: {msg: "No name entered with vote!", isError: true}});
            return;
        }


        if (this.state.poll === undefined){
            //For complier
            console.error("no poll selected, shouldn't be reached!");
            return;
        }

        if(this.state.poll.endTime < Date.now()){
            //If the poll was over, display the results and a message to the user saying that their vote was not recorded
            this.setState({message: {msg: `${this.state.poll.name} is now over. Your vote was not recorded.`, isError: true}, 
                isOver: true});
            return;
        }

        const body = {voter: this.state.voter, pollName: this.state.poll.name, 
            optionIndex: this.state.selectedIndex}

        fetch("/api/vote", {method: "POST", body: JSON.stringify(body), headers: {"Content-Type": "application/json"}})
        .then(this.doVoteResp)
        .catch(() => this.doVoteError("failed to connect to server"));
    }

    //Called with the server response from a request to /api/vote
    doVoteResp = (res: Response): void => {
        if (res.status === 200) {
          res.json().then(this.doVoteJson)
              .catch(() => this.doVoteError("200 res is not JSON"));
        } else if (res.status === 400) {
          res.text().then(this.doVoteError)
              .catch(() => this.doVoteError("400 response is not text"));
        } else {
          this.doVoteError(`bad status code from /api/refersh: ${res.status}`);
        }
    };

    
    // Called with the JSON response from /api/add
    doVoteJson = (data: unknown): void => {
        if (!isRecord(data)) {
          console.error("bad data from /api/vote: not a record", data);
          return;
        }

        if(!isRecord(data.poll)){
            console.error("bad data from /api/vote: poll is not a record", data);
            return;
        }

        const currPoll = parsePoll(data.poll);

        //When we get a non-poll back from the server
        if(currPoll === undefined){
            console.error("bad data from /api/vote: not a poll!", data);
            return;
        }

        if(this.state.selectedIndex === undefined){
            //For compilier
            console.error("Impossible. No option was selected")
            return;
        }

        const initialIndex: number = this.state.selectedIndex;
    
        //Update the poll and display a message to the user confirming their vote was recorded
        this.setState({poll: currPoll, selectedIndex: undefined, voter:"", 
        message:{msg: `Recorded vote for '${this.state.voter}' as '${currPoll.options[initialIndex].option}'`, isError: false}});
    }

    //When we fail to vote in a poll
    doVoteError = (msg: string): void => {
        console.error(`Error fetching /api/vote: ${msg}`);
    };
    

    //When the refresh button is clicked (or when the user votes)
    doRefreshClick = (): void =>{
        const url = "/api/load" + "?name=" + encodeURIComponent(this.props.name);

        fetch(url).then(this.doLoadResp).catch(() => this.doLoadError("failed to connect to server"));
    }

    //Called with the server response from a request to /api/load
    doLoadResp = (res: Response): void => {
        if (res.status === 200) {
          res.json().then(this.doLoadJson)
              .catch(() => this.doLoadError("200 res is not JSON"));
        } else if (res.status === 400) {
          res.text().then(this.doLoadError)
              .catch(() => this.doLoadError("400 response is not text"));
        } else {
          this.doLoadError(`bad status code from /api/refersh: ${res.status}`);
        }
    };

    // Called with the JSON response from /api/vote
    doLoadJson = (data: unknown): void => {
        if (!isRecord(data)) {
          console.error("bad data from /api/load: not a record", data);
          return;
        }

        if(!isRecord(data.poll)){
            console.error("bad data from /api/load: poll is not a record", data);
            return;
        }

        const currPoll = parsePoll(data.poll);
        //When we get a non-poll back from the server
        if(currPoll === undefined){
            console.error("bad data from /api/load: not a poll!", data);
            return;
        }

        if(currPoll.endTime < Date.now()){
            //Poll is now over
            this.setState({poll: currPoll, isOver: true, message: undefined});
        }else{
            //Poll is still ongoing
            this.setState({poll: currPoll, isOver: false});
        }
    }

    //When we fail to load a poll
    doLoadError = (msg: string): void => {
        console.error(`Error fetching /api/load: ${msg}`);
    };

    //When the back button is clicked
    doBackClick = (_evt: MouseEvent<HTMLButtonElement>): void =>{
        this.props.onBackClick();
    }


    
}