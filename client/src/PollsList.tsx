import { Component, MouseEvent } from "react";
import { Poll, parsePoll } from "./polls";
import React from "react";
import { isRecord } from "./record";


type ListProps ={
    //Callback to PollsApp when the new poll button is clicked
    onNewClick: () => void;

    //Callback to PollsApp when a specific poll is selected
    onPollClick: (name: string) => void;

}

type ListState = {
    //The current time 
    now: number,  
    // The list of polls
    polls: Poll[] | undefined,
  };


  export class PollsList extends Component<ListProps, ListState>{
    constructor(props: ListProps) {
        super(props);
        this.state = {now: Date.now(), polls: undefined};
    }

    //Refresh the list of polls on screen when the list is first put on the screen
    componentDidMount =(): void =>{
        this.doRefreshClick();
    }

    componentDidUpdate = (prevProps: ListProps): void => {
        if (prevProps !== this.props) {
            //Forces a refresh
          this.setState({now: Date.now()});  
        }
    };

    //Render the ongoing polls and the closed polls separately
    render = (): JSX.Element =>{
        if(this.state.polls === undefined){
            return <p>Loading polls...</p>
        }else{
            return (
                <div>
                    <h2>Current Polls</h2>
                    {this.renderActivePolls()}
                    <h2>Closed Polls</h2>
                    {this.renderClosedPolls()}
                    <button type="button" onClick={this.doRefreshClick}>Refresh</button>
                    <button type="button" onClick={this.doNewClick}>New Poll</button>
                </div>
            );
        }
    }

    //Render the ongoing polls
    renderActivePolls = (): JSX.Element =>{
        if(this.state.polls === undefined){
            return <p>Loading active poll list...</p>
        } else{
            const activePolls: JSX.Element[] = [];

            for (const poll of this.state.polls){
                const minLeft:number = Math.round((poll.endTime - Date.now()) / 60 / 100) / 10
                
                //Only render the active polls here
                if(minLeft > 0 ){
                    activePolls.push(
                        <li key={poll.name}>
                            <a href="#" onClick={(evt) => this.doPollClick(evt, poll.name)}> {poll.name}</a>
                            <span> - {minLeft} minutes remaining</span>
                        </li>
                    );
                }
            }
            return <ul>{activePolls}</ul>;
        }
    }

    //Render the polls that are over
    renderClosedPolls = (): JSX.Element =>{
        if(this.state.polls === undefined){
            return <p>Loading closed poll list...</p>
        } else{
            const closedPolls: JSX.Element[] = [];

            for (const poll of this.state.polls){
                const minLeft:number = Math.round((poll.endTime - Date.now()) / 60 / 100) / 10;
                
                //Only render the polls that are over here
                if(minLeft <= 0 ){
                    closedPolls.push(
                        <li key={poll.name}>
                            <a href="#" onClick={(evt) => this.doPollClick(evt, poll.name)}> {poll.name}</a>
                            <span> - closed {Math.abs(minLeft)} minutes ago</span>
                        </li>
                    );
                }
            }
            return <ul>{closedPolls}</ul>;
        }
    }

    //When the new poll button is clicked
    doNewClick = (_evt: MouseEvent<HTMLButtonElement>): void=>{
        this.props.onNewClick();
    }

    //When a specific poll is clicked
    doPollClick = (evt: MouseEvent<HTMLAnchorElement>, name:string): void =>{
        evt.preventDefault();
        this.props.onPollClick(name);
    }

    //When the refresh button is clicked
    doRefreshClick = (): void => {
        fetch("/api/list").then(this.doListResp).catch(()=> this.doListError("failed to connect to server"));
    }

    //Called with the server response from a request to /api/list
    doListResp = (resp: Response): void =>{
        if (resp.status === 200) {
            resp.json().then(this.doListJson)
                .catch(() => this.doListError("200 response is not JSON"));
          } else if (resp.status === 400) {
            resp.text().then(this.doListError)
                .catch(() => this.doListError("400 response is not text"));
          } else {
            this.doListError(`bad status code from /api/list: ${resp.status}`);
          }
    }

    // Called with the JSON response from /api/load
    doListJson = (data: unknown): void =>{
        if (!isRecord(data)) {
            console.error("bad data from /api/list: not a record", data);
            return;
        }
      
        if (!Array.isArray(data.polls)) {
            console.error("bad data from /api/list: polls is not an array", data);
            return;
        }

        const updatedPolls: Poll[] = [];
        for (const val of data.polls){
            //Makes sure that each element in the array from the server is a poll
            const poll = parsePoll(val);

            if(poll === undefined){
                console.error("Got back a non-poll item from /api/list", val);
                return;
            }

            updatedPolls.push(poll);
        }

        this.setState({polls: updatedPolls, now: Date.now() })
    }

    //When we fail to refresh the list of polls
    doListError = (msg: string): void =>{
        console.error(`Error fetching /api/list: ${msg}`);
    }
}