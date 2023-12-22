import React, { ChangeEvent, MouseEvent, Component } from "react";
import { isRecord } from "./record";

type NewPollProps = {
    //Callback to PollsApp when the back button is clicked
    onBackClick: () => void;
}

type NewPollState ={
    //The name of the poll being inputed
    name: string;

    //The total duaration of the poll being inputed
    totalMins: string;

    //The options for the poll being created
    options: string[];

    //An error message to be displayed, as needed
    error: string;
}

/**Allows the user to make a new poll */
export class NewPoll extends Component<NewPollProps, NewPollState>{
    constructor(props: NewPollProps) {
        super(props);
        //Start off with nothing filled out
        this.state = {name: "", totalMins:"", options:[], error: ""};
    }

    //Render the UI to create a new poll
    render = (): JSX.Element => {
        return(
            <div>
                <h2>New Poll</h2>
                <label htmlFor="name">Poll Name: </label>
                <input type ="text" id="name" value={this.state.name} onChange={this.doNameChange} />
                <br/>
                <label htmlFor="name">Minutes: </label>
                <input type ="number" id="totalMins" min= "0" value={this.state.totalMins.toString()} onChange={this.doTotalMinsChange} />
                <br/>
                <label htmlFor="options">Options: <em>1 per line, minimum 2 lines</em> </label>
                <br/>
                <textarea id="options" rows={this.state.options.length+1} cols={50} onChange={this.doOptionsChange} 
                    value={this.state.options.join("\n")}></textarea>
                <br/>
                <button type="button" onClick={this.doCreateClick}>Create</button>
                <button type="button" onClick={this.doBackClick}>Back</button>
                {this.renderError()}
            </div>
        );
    }

    //Render the error message, if there is one
    renderError = (): JSX.Element => {
        if (this.state.error.length === 0) {
            //When no error
          return <div></div>;
        } else {
            //When there is an error
          const style = {width: '300px', backgroundColor: 'rgb(246,194,192)',
              border: '1px solid rgb(137,66,61)', borderRadius: '5px', padding: '5px' };
          return (<div style={{marginTop: '15px'}}>
              <span style={style}><b>Error</b>: {this.state.error}</span>
            </div>);
        }
    };

    //When the create button is clicked
    doCreateClick = (_evt: MouseEvent<HTMLButtonElement>): void => {
        if (this.state.name.trim().length === 0) {
            //When no name for the poll has been entered in
            this.setState({error: "The poll name is missing."});
            return;
        }else if (isNaN(parseFloat(this.state.totalMins)) || parseFloat(this.state.totalMins) < 1){
            //When the polling length is invalid
            this.setState({error: "Invalid polling length. All polls must be at least 1 minute long."});
            return;
        }

        //Convert the user's input of options (array of strings) into 
        //an array of options (a record contiang the name of the option and number of votes it has)
        const opts : {option: string, votes: number}[] = [];
        for (const option of this.state.options){

                //Don't count empty rows as options
                if(option.trim().length !== 0 ){
                    //Every option starts off with 0 votes
                    opts.push({option: option, votes:0});
                }
        }

        //Make sure that there are at least two options before adding the poll
        if (opts.length < 2){
            this.setState({error: "There are not enough options."});
            return;
        }

        const body = {name: this.state.name, timeLength: parseFloat(this.state.totalMins), options: opts};

        fetch("/api/add", {method: 'POST', body: JSON.stringify(body), headers:{"Content-Type": "application/json"}})
        .then(this.doAddResp).catch(()=> this.doAddError("failed to connect to server"));
    }

    // Called with the response from a request to /api/add
    doAddResp = (resp: Response): void => {
        if (resp.status === 200) {
          resp.json().then(this.doAddJson)
              .catch(() => this.doAddError("200 response is not JSON"));
        } else if (resp.status === 400) {
          resp.text().then(this.doAddError)
              .catch(() => this.doAddError("400 response is not text"));
        } else {
          this.doAddError(`bad status code from /api/add: ${resp.status}`);
        }
    };

    // Called with the JSON response from /api/add
    doAddJson = (data: unknown): void => {
        if (!isRecord(data)) {
          console.error("bad data from /api/add: not a record", data);
          return;
        }
    
        //Go back to list screen after making poll
        this.props.onBackClick();  
    };

    //When we fail trying to add a poll
    doAddError = (msg: string): void => {
        this.setState({error: msg});
    }

    //When the text field for the new poll's name is changed
    doNameChange = (evt: ChangeEvent<HTMLInputElement>): void =>{
        this.setState({name: evt.target.value, error: ""});
    }

    //When the field for the new poll's duration is changed
    doTotalMinsChange = (evt: ChangeEvent<HTMLInputElement>): void =>{
            this.setState({totalMins: evt.target.value, error: ""});
    }

    //When the text field for the new poll's options are changed
    doOptionsChange = (evt:ChangeEvent<HTMLTextAreaElement>): void =>{

        this.setState({options: evt.target.value.split("\n"), error: ""});
    }

    //When the back button is clicked
    doBackClick = (_evt: MouseEvent<HTMLButtonElement>): void =>{
        this.props.onBackClick();
    }

}

