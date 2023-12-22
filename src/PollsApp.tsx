import React, { Component} from "react";
import { PollsList } from "./PollsList";
import { NewPoll } from "./NewPoll";
import { PollDetails } from "./PollDetails";

//Indicates which UI should be on the screen. 
type Page = "list" | "new" | {kind: "details", name: string}

// RI: If page is "details", then index is a valid index into polls array.
type PollsAppState = {
  //Which page the program should be on
  currPage: Page;
}

/** Displays the UI of the Polls application. */
export class PollsApp extends Component<{}, PollsAppState> {

  constructor(props: {}) {
    super(props);

    //Start by displaying the list of Polls
    this.state = {currPage: "list"};
  }
  
  render = (): JSX.Element => {
    if(this.state.currPage === "list"){
      return <PollsList onNewClick={this.doNewClick} onPollClick={this.doPollClick}></PollsList>
    }else if (this.state.currPage === "new"){
      return <NewPoll onBackClick={this.doBackClick}></NewPoll>;
    }else{
      return <PollDetails onBackClick={this.doBackClick} name={this.state.currPage.name}></PollDetails>;
    }
    
  };

  //When a back button is clicked go back to displaying the list of polls
  doBackClick = (): void =>{
    this.setState({currPage: "list"});

  }

  //When the New Poll button is clicked display the UI to make a new poll
  doNewClick= (): void =>{
    this.setState({currPage: "new"});
  }

  //Display the details of the poll when a poll is clicked on
  doPollClick = (name: string): void => {
    this.setState({currPage:{kind:"details", name}});
  }
}
